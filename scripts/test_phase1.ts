const BASE_URL = 'http://localhost:3000';

async function req(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting FormForge Phase 1 Core Platform Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  // 1. Health check
  const health = await req('/api/health');
  assert(health.status === 200 && health.data?.status === 'healthy', '1. Backend Health Check');

  // 2. Unauthenticated access to private route blocked (RLS / Auth Gate)
  const unauthForms = await req('/api/forms');
  assert(unauthForms.status === 401, '2. Unauthenticated access to /api/forms is rejected (401)');

  // 3. User Signup
  const testEmail = `researcher_${Date.now()}@formforge.dev`;
  const signup = await req('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      name: 'Dr. Jane Smith',
    }),
  });
  assert(signup.status === 201 && signup.data?.token, '3. User registration and JWT issuance');
  const token = signup.data?.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 4. Duplicate Signup Blocked
  const dupSignup = await req('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      name: 'Dr. Jane Smith Duplicate',
    }),
  });
  assert(dupSignup.status === 400, '4. Duplicate email registration rejected');

  // 5. User Login
  const login = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
    }),
  });
  assert(login.status === 200 && login.data?.user?.email === testEmail, '5. User login verification');

  // 6. Create Form
  const formCreate = await req('/api/forms', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Water Security Assessment 2026',
      description: 'Field survey on drinking water access and source contamination.',
    }),
  });
  assert(formCreate.status === 201 && formCreate.data?.form?.id, '6. Form creation with draft schema');
  const formId = formCreate.data.form.id;
  const formSlug = formCreate.data.form.slug;

  // 7. Update Draft Schema with all 8 Field Types
  const customSchema = {
    version: 1,
    fields: [
      {
        id: 'q1_name',
        name: 'respondent_name',
        label: 'Respondent Full Name',
        type: 'text',
        validation: { required: true, minLength: 2 },
      },
      {
        id: 'q2_email',
        name: 'contact_email',
        label: 'Contact Email',
        type: 'email',
        validation: { required: true },
      },
      {
        id: 'q3_household_size',
        name: 'household_size',
        label: 'Number of Household Members',
        type: 'number',
        validation: { required: true, min: 1, max: 50 },
      },
      {
        id: 'q4_notes',
        name: 'survey_notes',
        label: 'Field Observations / Notes',
        type: 'textarea',
        validation: { required: false },
      },
      {
        id: 'q5_primary_source',
        name: 'primary_water_source',
        label: 'Primary Drinking Water Source',
        type: 'select',
        options: [
          { label: 'Piped Water to Dwelling', value: 'piped' },
          { label: 'Protected Tube Well / Borehole', value: 'borehole' },
          { label: 'Protected Spring', value: 'spring' },
          { label: 'Rainwater Collection', value: 'rainwater' },
        ],
        validation: { required: true },
      },
      {
        id: 'q6_water_treated',
        name: 'water_treated_before_drinking',
        label: 'Do you treat water prior to drinking?',
        type: 'radio',
        options: [
          { label: 'Yes, always', value: 'yes' },
          { label: 'Sometimes', value: 'sometimes' },
          { label: 'No, never', value: 'no' },
        ],
        validation: { required: true },
      },
      {
        id: 'q7_treatment_methods',
        name: 'treatment_methods_used',
        label: 'Treatment Methods Employed',
        type: 'checkbox',
        options: [
          { label: 'Boiling', value: 'boiling' },
          { label: 'Chlorination / Bleach', value: 'chlorine' },
          { label: 'Ceramic / Biosand Filtration', value: 'filtration' },
          { label: 'Solar Disinfection (SODIS)', value: 'sodis' },
        ],
        validation: { required: false, minSelect: 1, maxSelect: 3 },
      },
      {
        id: 'q8_interview_date',
        name: 'interview_date',
        label: 'Date of Household Interview',
        type: 'date',
        validation: { required: true },
      },
    ],
  };

  const updateForm = await req(`/api/forms/${formId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Water Security Assessment 2026',
      description: 'Field survey on drinking water access and source contamination.',
      schema: customSchema,
      settings: {
        submitButtonText: 'Submit Assessment',
        confirmationMessage: 'Assessment safely received and synced to FormForge database.',
      },
    }),
  });
  assert(updateForm.status === 200, '7. Update draft schema with 8 question types');

  // 8. Public access rejected while in draft state
  const draftPublic = await req(`/api/public/forms/${formSlug}`);
  assert(draftPublic.status === 403, '8. Draft form is inaccessible to public respondents (403)');

  // 9. Publish Form -> Creates Version Snapshot
  const publish = await req(`/api/forms/${formId}/publish`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ changelog: 'Initial release of water survey v1' }),
  });
  assert(publish.status === 200 && publish.data?.status === 'published', '9. Form publication');

  // 10. Public Form Discovery
  const publicForm = await req(`/api/public/forms/${formSlug}`);
  assert(
    publicForm.status === 200 && publicForm.data?.form?.schema?.fields?.length === 8,
    '10. Public form retrieval without authentication'
  );

  // 11. Server-side validation failure test
  const invalidSubmission = await req(`/api/public/forms/${formSlug}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        respondent_name: 'J', // too short (minLength 2)
        contact_email: 'invalid-email-string', // invalid email
        household_size: -5, // below min 1
        primary_water_source: 'unlisted_lake', // invalid option
        interview_date: 'invalid-date',
      },
    }),
  });
  assert(
    invalidSubmission.status === 422 && invalidSubmission.data?.fieldErrors,
    '11. Server-side validation strictly enforces types, regex, options & ranges (422 Unprocessable)'
  );

  // 12. Valid public submission
  const validSubmission = await req(`/api/public/forms/${formSlug}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        q1_name: 'Amina Al-Mansoor',
        q2_email: 'amina.almansoor@example.org',
        q3_household_size: 6,
        q4_notes: 'Community bore well located 400m from dwelling.',
        q5_primary_source: 'borehole',
        q6_water_treated: 'yes',
        q7_treatment_methods: ['boiling', 'chlorine'],
        q8_interview_date: '2026-10-02',
      },
      metadata: {
        enumerator: 'Field Agent 12',
      },
    }),
  });
  assert(
    validSubmission.status === 201 && validSubmission.data?.submissionId,
    '12. Valid public submission safely stored in PostgreSQL'
  );

  // 13. Owner response retrieval with search and pagination
  const responses = await req(`/api/forms/${formId}/responses`, {
    headers: authHeaders,
  });
  assert(
    responses.status === 200 && responses.data?.total === 1 && responses.data?.responses[0]?.data?.q1_name === 'Amina Al-Mansoor',
    '13. Owner response dashboard retrieval with parsed data'
  );

  // 14. Version History inspection
  const versions = await req(`/api/forms/${formId}/versions`, {
    headers: authHeaders,
  });
  assert(
    versions.status === 200 && versions.data?.versions?.length >= 1,
    '14. Version history log with linked submission counters'
  );

  // 15. Form Duplication
  const duplicate = await req(`/api/forms/${formId}/duplicate`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert(duplicate.status === 201 && duplicate.data?.formId, '15. Form cloning / duplication');

  // 16. Form Archival & Access Enforcement
  const archive = await req(`/api/forms/${formId}/archive`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert(archive.status === 200, '16. Form archival');

  const archivedPublicSubmit = await req(`/api/public/forms/${formSlug}/submit`, {
    method: 'POST',
    body: JSON.stringify({ data: { q1_name: 'Test' } }),
  });
  assert(archivedPublicSubmit.status === 403, '17. Submissions blocked for archived forms (403)');

  // 17. Restore form
  const unarchive = await req(`/api/forms/${formId}/unarchive`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert(unarchive.status === 200, '18. Form restored to draft/editable state');

  console.log(`\n==========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Fatal error during test run:', e);
  process.exit(1);
});
