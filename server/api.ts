import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pg, getDatabaseDiagnostics } from './db.js';
import { requireAuth, AuthRequest, createUser, authenticateUser } from './auth.js';
import { validateFormSubmission, FormDefinitionSchema } from './validation.js';

export const apiRouter = Router();

// Helper to generate URL-safe slugs
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const rand = crypto.randomBytes(3).toString('hex');
  return `${base || 'form'}-${rand}`;
}

// ============================================================================
// 1. Authentication Endpoints
// ============================================================================

apiRouter.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await createUser(email, password, name);
    // Auto-login on signup
    const { generateToken } = await import('./auth.js');
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      user,
      token,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await authenticateUser(email, password);
    const { generateToken } = await import('./auth.js');
    const token = generateToken(user);

    return res.json({
      message: 'Logged in successfully.',
      user,
      token,
    });
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// ============================================================================
// 2. Forms Management Endpoints (Requires User Auth - RLS enforced)
// ============================================================================

// List forms for current user with submission counts
apiRouter.get('/forms', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = `
      SELECT 
        f.id, f.title, f.description, f.slug, f.status, f.current_version,
        f.created_at, f.updated_at,
        COUNT(s.id)::int AS submission_count
      FROM forms f
      LEFT JOIN submissions s ON s.form_id = f.id
      WHERE f.user_id = $1
      GROUP BY f.id
      ORDER BY f.updated_at DESC
    `;
    const result = await pg.query<any>(query, [userId]);
    return res.json({ forms: result.rows });
  } catch (err: any) {
    console.error('Error fetching forms:', err);
    return res.status(500).json({ error: 'Failed to retrieve forms.' });
  }
});

// Create a new form
apiRouter.post('/forms', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Form title is required.' });
    }

    const id = crypto.randomUUID();
    const slug = slugify(title);

    // Initial starter schema
    const initialSchema: FormDefinitionSchema = {
      version: 1,
      fields: [
        {
          id: crypto.randomUUID(),
          name: 'full_name',
          label: 'Full Name',
          type: 'text',
          placeholder: 'Enter respondent full name',
          validation: { required: true, minLength: 2 },
        },
        {
          id: crypto.randomUUID(),
          name: 'email_address',
          label: 'Email Address',
          type: 'email',
          placeholder: 'respondent@example.com',
          validation: { required: true },
        },
      ],
      settings: {
        submitButtonText: 'Submit Form',
        confirmationMessage: 'Thank you! Your submission has been securely recorded.',
      },
    };

    const initialSettings = {
      submitButtonText: 'Submit Form',
      confirmationMessage: 'Thank you! Your submission has been securely recorded.',
      redirectUrl: '',
      allowMultipleSubmissions: true,
    };

    await pg.query(
      `INSERT INTO forms (id, user_id, title, description, slug, status, current_version, schema, settings)
       VALUES ($1, $2, $3, $4, $5, 'draft', 1, $6, $7)`,
      [
        id,
        userId,
        title.trim(),
        (description || '').trim(),
        slug,
        JSON.stringify(initialSchema),
        JSON.stringify(initialSettings),
      ]
    );

    // Record initial version 1 snapshot
    const versionId = crypto.randomUUID();
    await pg.query(
      `INSERT INTO form_versions (id, form_id, version_number, schema, changelog)
       VALUES ($1, $2, 1, $3, 'Initial draft created')`,
      [versionId, id, JSON.stringify(initialSchema)]
    );

    return res.status(201).json({
      message: 'Form created successfully.',
      form: {
        id,
        user_id: userId,
        title: title.trim(),
        description: description || '',
        slug,
        status: 'draft',
        current_version: 1,
        schema: initialSchema,
        settings: initialSettings,
      },
    });
  } catch (err: any) {
    console.error('Error creating form:', err);
    return res.status(500).json({ error: 'Failed to create form.' });
  }
});

// Get single form definition & draft for editor
apiRouter.get('/forms/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pg.query<any>(
      `SELECT id, user_id, title, description, slug, status, current_version, schema, settings, created_at, updated_at
       FROM forms
       WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    const form = result.rows[0];
    return res.json({
      form: {
        ...form,
        schema: JSON.parse(form.schema),
        settings: JSON.parse(form.settings),
      },
    });
  } catch (err: any) {
    console.error('Error fetching form:', err);
    return res.status(500).json({ error: 'Failed to load form.' });
  }
});

// Update draft form definition
apiRouter.put('/forms/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, schema, settings } = req.body;

    // Verify ownership
    const check = await pg.query<any>('SELECT id FROM forms WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Form title cannot be empty.' });
    }

    if (!schema || !Array.isArray(schema.fields)) {
      return res.status(400).json({ error: 'Schema must include an array of fields.' });
    }

    await pg.query(
      `UPDATE forms
       SET title = $1, description = $2, schema = $3, settings = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6`,
      [
        title.trim(),
        (description || '').trim(),
        JSON.stringify(schema),
        JSON.stringify(settings || {}),
        id,
        userId,
      ]
    );

    return res.json({ message: 'Form saved successfully.' });
  } catch (err: any) {
    console.error('Error updating form:', err);
    return res.status(500).json({ error: 'Failed to save form.' });
  }
});

// Publish a form: increments version, writes immutable snapshot to form_versions, marks status as 'published'
apiRouter.post('/forms/:id/publish', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { changelog } = req.body;

    const result = await pg.query<any>(
      'SELECT id, title, schema, status, current_version FROM forms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    const form = result.rows[0];
    const newVersion = form.status === 'published' ? form.current_version + 1 : form.current_version;
    const parsedSchema = JSON.parse(form.schema);
    parsedSchema.version = newVersion;

    const versionId = crypto.randomUUID();
    await pg.query(
      `INSERT INTO form_versions (id, form_id, version_number, schema, changelog)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (form_id, version_number) DO UPDATE
       SET schema = EXCLUDED.schema, changelog = EXCLUDED.changelog`,
      [
        versionId,
        id,
        newVersion,
        JSON.stringify(parsedSchema),
        changelog || `Published version ${newVersion}`,
      ]
    );

    await pg.query(
      `UPDATE forms
       SET status = 'published', current_version = $1, schema = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4`,
      [newVersion, JSON.stringify(parsedSchema), id, userId]
    );

    return res.json({
      message: `Form successfully published as Version ${newVersion}.`,
      version: newVersion,
      status: 'published',
    });
  } catch (err: any) {
    console.error('Error publishing form:', err);
    return res.status(500).json({ error: 'Failed to publish form.' });
  }
});

// Archive a form
apiRouter.post('/forms/:id/archive', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pg.query<any>(
      `UPDATE forms SET status = 'archived', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    return res.json({ message: 'Form archived. Public submissions are now disabled.' });
  } catch (err: any) {
    console.error('Error archiving form:', err);
    return res.status(500).json({ error: 'Failed to archive form.' });
  }
});

// Unarchive a form (restore to draft)
apiRouter.post('/forms/:id/unarchive', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pg.query<any>(
      `UPDATE forms SET status = 'draft', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    return res.json({ message: 'Form restored to draft status.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to unarchive form.' });
  }
});

// Duplicate a form
apiRouter.post('/forms/:id/duplicate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pg.query<any>(
      'SELECT title, description, schema, settings FROM forms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Source form not found.' });
    }

    const source = result.rows[0];
    const newId = crypto.randomUUID();
    const newTitle = `${source.title} (Copy)`;
    const newSlug = slugify(newTitle);

    await pg.query(
      `INSERT INTO forms (id, user_id, title, description, slug, status, current_version, schema, settings)
       VALUES ($1, $2, $3, $4, $5, 'draft', 1, $6, $7)`,
      [newId, userId, newTitle, source.description, newSlug, source.schema, source.settings]
    );

    const versionId = crypto.randomUUID();
    await pg.query(
      `INSERT INTO form_versions (id, form_id, version_number, schema, changelog)
       VALUES ($1, $2, 1, $3, 'Duplicated from ${source.title}')`,
      [versionId, newId, source.schema]
    );

    return res.status(201).json({
      message: 'Form duplicated successfully.',
      formId: newId,
      slug: newSlug,
    });
  } catch (err: any) {
    console.error('Error duplicating form:', err);
    return res.status(500).json({ error: 'Failed to duplicate form.' });
  }
});

// Delete a form
apiRouter.delete('/forms/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pg.query<any>(
      'DELETE FROM forms WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    return res.json({ message: 'Form and all associated data deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting form:', err);
    return res.status(500).json({ error: 'Failed to delete form.' });
  }
});

// Version history list
apiRouter.get('/forms/:id/versions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const check = await pg.query<any>('SELECT id FROM forms WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    const versions = await pg.query<any>(
      `SELECT v.id, v.version_number, v.changelog, v.created_at,
              COUNT(s.id)::int AS submission_count
       FROM form_versions v
       LEFT JOIN submissions s ON s.form_id = v.form_id AND s.form_version = v.version_number
       WHERE v.form_id = $1
       GROUP BY v.id, v.version_number, v.changelog, v.created_at
       ORDER BY v.version_number DESC`,
      [id]
    );

    return res.json({ versions: versions.rows });
  } catch (err: any) {
    console.error('Error fetching version history:', err);
    return res.status(500).json({ error: 'Failed to load versions.' });
  }
});

// ============================================================================
// 3. Submissions & Response Dashboard Endpoints (Requires User Auth)
// ============================================================================

// List responses for form with filters, search, and pagination
apiRouter.get('/forms/:id/responses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { search, version, startDate, endDate, page = '1', limit = '50' } = req.query;

    // Verify ownership
    const check = await pg.query<any>('SELECT id, title, schema FROM forms WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    const form = check.rows[0];
    const formSchema = JSON.parse(form.schema) as FormDefinitionSchema;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = ['s.form_id = $1'];
    const params: any[] = [id];

    if (version) {
      params.push(parseInt(version as string, 10));
      conditions.push(`s.form_version = $${params.length}`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`s.created_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`s.created_at <= $${params.length}`);
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`LOWER(s.data) LIKE $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countResult = await pg.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM submissions s WHERE ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total || 0;

    // Submissions
    params.push(limitNum);
    params.push(offset);
    const dataQuery = `
      SELECT s.id, s.form_version, s.data, s.metadata, s.created_at
      FROM submissions s
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const dataResult = await pg.query<any>(dataQuery, params);

    const responses = dataResult.rows.map((row: any) => ({
      id: row.id,
      formVersion: row.form_version,
      data: JSON.parse(row.data),
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
    }));

    return res.json({
      formTitle: form.title,
      schema: formSchema,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      responses,
    });
  } catch (err: any) {
    console.error('Error fetching responses:', err);
    return res.status(500).json({ error: 'Failed to load responses.' });
  }
});

// CSV Export endpoint
apiRouter.get('/forms/:id/responses/csv', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const check = await pg.query<any>('SELECT id, title, schema FROM forms WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const form = check.rows[0];
    const formSchema = JSON.parse(form.schema) as FormDefinitionSchema;

    const submissions = await pg.query<any>(
      `SELECT id, form_version, data, created_at FROM submissions
       WHERE form_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    // Build CSV headers: Submission ID, Version, Submitted At, followed by all field labels
    const fields = formSchema.fields;
    const headers = [
      'Submission ID',
      'Form Version',
      'Submitted At (UTC)',
      ...fields.map((f) => `"${f.label.replace(/"/g, '""')}"`),
    ];

    const rows = [headers.join(',')];

    for (const sub of submissions.rows) {
      const parsedData = JSON.parse(sub.data);
      const rowValues = [
        `"${sub.id}"`,
        sub.form_version,
        `"${new Date(sub.created_at).toISOString()}"`,
        ...fields.map((f) => {
          const val = parsedData[f.id] !== undefined ? parsedData[f.id] : parsedData[f.name];
          if (val === null || val === undefined) return '""';
          if (Array.isArray(val)) {
            return `"${val.join('; ').replace(/"/g, '""')}"`;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        }),
      ];
      rows.push(rowValues.join(','));
    }

    const csvContent = rows.join('\r\n');
    const safeTitle = form.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_responses_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (err: any) {
    console.error('Error generating CSV export:', err);
    return res.status(500).json({ error: 'Failed to generate CSV.' });
  }
});

// Single response inspection
apiRouter.get('/forms/:id/responses/:responseId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, responseId } = req.params;

    const check = await pg.query<any>('SELECT id, schema FROM forms WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    const sub = await pg.query<any>(
      'SELECT id, form_version, data, metadata, created_at FROM submissions WHERE id = $1 AND form_id = $2',
      [responseId, id]
    );

    if (sub.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found.' });
    }

    const row = sub.rows[0];
    return res.json({
      response: {
        id: row.id,
        formVersion: row.form_version,
        data: JSON.parse(row.data),
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        createdAt: row.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load response detail.' });
  }
});

// Delete individual response
apiRouter.delete('/forms/:id/responses/:responseId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, responseId } = req.params;

    const check = await pg.query<any>('SELECT id FROM forms WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied.' });
    }

    const result = await pg.query<any>(
      'DELETE FROM submissions WHERE id = $1 AND form_id = $2 RETURNING id',
      [responseId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found.' });
    }

    return res.json({ message: 'Response deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete response.' });
  }
});

// ============================================================================
// 4. Public Respondent Endpoints (Zero Auth Required - Public Discovery & Submit)
// ============================================================================

// Fetch published form by slug
apiRouter.get('/public/forms/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pg.query<any>(
      `SELECT id, title, description, slug, status, current_version, schema, settings
       FROM forms
       WHERE slug = $1 LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or has been moved.' });
    }

    const form = result.rows[0];

    // Only allow published forms for public respondents
    if (form.status !== 'published') {
      return res.status(403).json({
        error:
          form.status === 'archived'
            ? 'This form is archived and no longer accepting submissions.'
            : 'This form has not been published yet.',
        status: form.status,
      });
    }

    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        version: form.current_version,
        schema: JSON.parse(form.schema),
        settings: JSON.parse(form.settings),
      },
    });
  } catch (err: any) {
    console.error('Error loading public form:', err);
    return res.status(500).json({ error: 'Failed to load form.' });
  }
});

// Submit response to published form
apiRouter.post('/public/forms/:slug/submit', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const submittedData = req.body.data;
    const clientMetadata = req.body.metadata || {};

    const formResult = await pg.query<any>(
      'SELECT id, status, current_version, schema, settings FROM forms WHERE slug = $1 LIMIT 1',
      [slug]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const form = formResult.rows[0];

    if (form.status !== 'published') {
      return res.status(403).json({
        error:
          form.status === 'archived'
            ? 'This form is archived and no longer accepting submissions.'
            : 'This form is not currently open for submissions.',
      });
    }

    const formSchema = JSON.parse(form.schema) as FormDefinitionSchema;

    // Strict server-side validation against schema
    const validation = validateFormSubmission(formSchema, submittedData);
    if (!validation.isValid) {
      return res.status(422).json({
        error: 'Validation failed. Please review the highlighted fields.',
        fieldErrors: validation.errors,
      });
    }

    const submissionId = crypto.randomUUID();
    const serverMetadata = {
      ...clientMetadata,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
      submittedAt: new Date().toISOString(),
    };

    await pg.query(
      `INSERT INTO submissions (id, form_id, form_version, data, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        submissionId,
        form.id,
        form.current_version,
        JSON.stringify(validation.sanitizedData),
        JSON.stringify(serverMetadata),
      ]
    );

    const settings = JSON.parse(form.settings);

    return res.status(201).json({
      message: settings.confirmationMessage || 'Response recorded successfully.',
      submissionId,
      submittedAt: serverMetadata.submittedAt,
    });
  } catch (err: any) {
    console.error('Error recording submission:', err);
    return res.status(500).json({ error: 'Failed to record response. Please try again.' });
  }
});

// ============================================================================
// 5. Versioned Public REST API (v1 for Phase 2 readiness)
// ============================================================================

apiRouter.get('/v1/forms/:slug', async (req: Request, res: Response) => {
  // Re-use public form endpoint logic
  try {
    const { slug } = req.params;
    const result = await pg.query<any>(
      'SELECT id, title, description, slug, status, current_version, schema FROM forms WHERE slug = $1 LIMIT 1',
      [slug]
    );
    if (result.rows.length === 0 || result.rows[0].status !== 'published') {
      return res.status(404).json({ error: 'Published form not found.' });
    }
    const form = result.rows[0];
    return res.json({
      apiVersion: '1.0',
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        version: form.current_version,
        schema: JSON.parse(form.schema),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error retrieving form.' });
  }
});

apiRouter.post('/v1/forms/:slug/submissions', async (req: Request, res: Response) => {
  // Handler for v1 submission endpoint
  try {
    const { slug } = req.params;
    const submittedData = req.body.data;
    const clientMetadata = req.body.metadata || {};

    const formResult = await pg.query<any>(
      'SELECT id, status, current_version, schema, settings FROM forms WHERE slug = $1 LIMIT 1',
      [slug]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const form = formResult.rows[0];

    if (form.status !== 'published') {
      return res.status(403).json({
        error:
          form.status === 'archived'
            ? 'This form is archived and no longer accepting submissions.'
            : 'This form is not currently open for submissions.',
      });
    }

    const formSchema = JSON.parse(form.schema) as FormDefinitionSchema;

    const validation = validateFormSubmission(formSchema, submittedData);
    if (!validation.isValid) {
      return res.status(422).json({
        error: 'Validation failed.',
        fieldErrors: validation.errors,
      });
    }

    const submissionId = crypto.randomUUID();
    const serverMetadata = {
      ...clientMetadata,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'api-client',
      submittedAt: new Date().toISOString(),
    };

    await pg.query(
      `INSERT INTO submissions (id, form_id, form_version, data, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        submissionId,
        form.id,
        form.current_version,
        JSON.stringify(validation.sanitizedData),
        JSON.stringify(serverMetadata),
      ]
    );

    return res.status(201).json({
      message: 'Submission accepted via API v1.',
      submissionId,
      submittedAt: serverMetadata.submittedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record response.' });
  }
});

// ============================================================================
// 6. Sample Host Application REST API (Demonstrates Option C & RestApiStorageAdapter)
// ============================================================================
const hostReceivedSubmissions: Array<{
  id: string;
  formId: string;
  formVersion: number;
  data: any;
  receivedAt: string;
  source: string;
}> = [];

// Endpoint simulating a developer's external backend (e.g. Django, Spring, Laravel, Express)
apiRouter.post('/sample-host/submissions', (req: Request, res: Response) => {
  const { formId, formVersion, data, metadata } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Host API requires a valid data object.' });
  }

  const hostRecord = {
    id: req.body.id || `host_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    formId: formId || 'unknown_form',
    formVersion: formVersion || 1,
    data,
    receivedAt: new Date().toISOString(),
    source: 'FormForge RestApiStorageAdapter',
  };

  hostReceivedSubmissions.unshift(hostRecord);
  if (hostReceivedSubmissions.length > 50) hostReceivedSubmissions.pop();

  return res.status(201).json({
    message: 'Submission successfully received and persisted by host application API.',
    record: hostRecord,
    totalHostRecords: hostReceivedSubmissions.length,
  });
});

apiRouter.get('/sample-host/submissions', (_req: Request, res: Response) => {
  return res.json({
    description: 'Sample host backend submissions storage',
    count: hostReceivedSubmissions.length,
    submissions: hostReceivedSubmissions,
  });
});

// Health check & Live Database Connection status
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const diag = await getDatabaseDiagnostics();
  return res.status(diag.connected ? 200 : 503).json({
    status: diag.connected ? 'healthy' : 'unhealthy',
    service: 'FormForge Backend',
    database: {
      connected: diag.connected,
      type: diag.engine === 'external-postgresql' ? 'External PostgreSQL / Supabase' : 'Embedded PostgreSQL (PGlite)',
      target: diag.target,
      autoMigrated: diag.autoMigrated,
      latencyMs: diag.latencyMs,
      tables: diag.tables,
      stats: diag.stats,
      error: diag.error,
    },
    time: new Date().toISOString(),
  });
});

// Full Database Diagnostics Endpoint
apiRouter.get('/database/diagnostics', async (_req: Request, res: Response) => {
  const diag = await getDatabaseDiagnostics();
  return res.json(diag);
});

// Database Table Inspector (Allows user to inspect rows in each table)
apiRouter.get('/database/tables/:table', async (req: Request, res: Response) => {
  const table = req.params.table.toLowerCase();
  const allowed = ['users', 'forms', 'form_versions', 'submissions', 'integrations', 'delivery_logs'];
  if (!allowed.includes(table)) {
    return res.status(400).json({ error: `Invalid table name. Allowed: ${allowed.join(', ')}` });
  }

  try {
    let sql = `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 25`;
    if (table === 'users') {
      sql = `SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 25`;
    }
    const result = await pg.query(sql);
    return res.json({
      table,
      count: result.rows.length,
      rows: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to query table' });
  }
});
