import {
  FormStorageAdapter,
  FormSubmission,
  FormSchema,
} from '@formforge/core';

export interface SqlQueryClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
}

/**
 * PostgresStorageAdapter
 * Server-side storage adapter for PostgreSQL databases (pg, PGlite, Cloud SQL, Neon, RDS).
 * Keeps credentials and SQL drivers strictly on the server.
 */
export class PostgresStorageAdapter implements FormStorageAdapter {
  readonly name = 'PostgresStorageAdapter';
  private db: SqlQueryClient;

  constructor(dbClient: SqlQueryClient) {
    this.db = dbClient;
  }

  async saveSubmission(
    submission: Omit<FormSubmission, 'id'> & { id?: string }
  ): Promise<FormSubmission> {
    const id = submission.id || crypto.randomUUID();
    const submittedAt = submission.metadata?.submittedAt || new Date().toISOString();

    const sql = `
      INSERT INTO submissions (id, form_id, form_version, data, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, form_id, form_version, data, metadata
    `;

    const params = [
      id,
      submission.formId,
      submission.formVersion,
      JSON.stringify(submission.data),
      JSON.stringify({
        ...submission.metadata,
        submittedAt,
      }),
    ];

    const res = await this.db.query(sql, params);
    const row = res.rows[0];

    return {
      id: row.id,
      formId: row.form_id,
      formVersion: row.form_version,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    };
  }

  async getFormSchema(formId: string): Promise<FormSchema | null> {
    const sql = `
      SELECT id, title, description, schema, updated_at
      FROM forms
      WHERE id = $1 OR slug = $1
      LIMIT 1
    `;
    const res = await this.db.query(sql, [formId]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const schemaData =
      typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      version: schemaData.version || 1,
      fields: schemaData.fields || [],
      settings: schemaData.settings || {},
      updatedAt: row.updated_at,
    };
  }

  async listSubmissions(
    formId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<FormSubmission[]> {
    let sql = `
      SELECT id, form_id, form_version, data, metadata
      FROM submissions
      WHERE form_id = $1
      ORDER BY (metadata->>'submittedAt') DESC
    `;
    const params: any[] = [formId];

    if (options?.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (options?.offset) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const res = await this.db.query(sql, params);
    return res.rows.map((row) => ({
      id: row.id,
      formId: row.form_id,
      formVersion: row.form_version,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    }));
  }
}
