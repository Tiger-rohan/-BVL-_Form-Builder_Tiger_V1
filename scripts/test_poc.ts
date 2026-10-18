/**
 * FormForge Modular Architecture & Proof-of-Concept Verification Test Suite
 * Tests core validation, MemoryStorageAdapter, RestApiStorageAdapter, custom developer adapters,
 * and server-side submission processing.
 */

import {
  FormSchema,
  FormStorageAdapter,
  FormSubmission,
  validateFormSubmission,
} from '../packages/core/src/index.ts';

import {
  MemoryStorageAdapter,
  RestApiStorageAdapter,
} from '../packages/adapters/src/index.ts';

import { processSubmission } from '../packages/server/src/index.ts';

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('🧪 Starting FormForge Modular Architecture & Adapter Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // Sample Portable Schema
  const testSchema: FormSchema = {
    id: 'test_schema_001',
    title: 'Volunteer Application',
    description: 'Portable form definition test schema',
    version: 1,
    fields: [
      {
        id: 'f_name',
        key: 'full_name',
        type: 'text',
        label: 'Full Name',
        validation: { required: true, min: 3 },
      },
      {
        id: 'f_email',
        key: 'email',
        type: 'email',
        label: 'Email',
        validation: { required: true },
      },
      {
        id: 'f_hours',
        key: 'available_hours',
        type: 'number',
        label: 'Available Hours / Week',
        validation: { required: true, min: 1, max: 40 },
      },
      {
        id: 'f_role',
        key: 'preferred_role',
        type: 'select',
        label: 'Preferred Role',
        options: [
          { label: 'Field Enumerator', value: 'enumerator' },
          { label: 'Data Analyst', value: 'analyst' },
        ],
        validation: { required: true },
      },
    ],
  };

  // 1. Test Core Validation (Zero DB)
  console.log('--- 1. Core Framework Validation (Zero-DB) ---');
  const invalidResult = validateFormSubmission(testSchema, {
    full_name: 'Al', // min 3 failed
    email: 'not-an-email', // regex failed
    available_hours: 50, // max 40 failed
    preferred_role: 'invalid_role', // option membership failed
  });

  assert(!invalidResult.valid, 'Invalid payload correctly fails core validation');
  assert(invalidResult.errors.full_name !== undefined, 'Min length error caught for full_name');
  assert(invalidResult.errors.email !== undefined, 'Invalid email error caught');
  assert(invalidResult.errors.available_hours !== undefined, 'Numeric max error caught');
  assert(invalidResult.errors.preferred_role !== undefined, 'Option membership error caught');

  const validResult = validateFormSubmission(testSchema, {
    full_name: 'Alex Rivera',
    email: 'alex.rivera@formforge.dev',
    available_hours: 15,
    preferred_role: 'enumerator',
  });

  assert(validResult.valid, 'Valid payload passes core validation without any errors');
  assert(Object.keys(validResult.errors).length === 0, 'No errors in valid submission');

  // 2. Test MemoryStorageAdapter
  console.log('\n--- 2. MemoryStorageAdapter (In-Memory Mock Storage) ---');
  const memoryAdapter = new MemoryStorageAdapter([testSchema]);

  const savedMemorySub = await memoryAdapter.saveSubmission({
    formId: testSchema.id,
    formVersion: testSchema.version,
    data: {
      full_name: 'Alex Rivera',
      email: 'alex@formforge.dev',
      available_hours: 10,
      preferred_role: 'enumerator',
    },
    metadata: {
      submittedAt: new Date().toISOString(),
      source: 'UnitTest',
    },
  });

  assert(savedMemorySub.id.startsWith('sub_mem_'), 'Memory adapter generated unique ID');
  assert(savedMemorySub.data.full_name === 'Alex Rivera', 'Memory adapter preserved submission data');

  const listMemory = await memoryAdapter.listSubmissions(testSchema.id);
  assert(listMemory.length === 1, 'Memory adapter lists stored submissions correctly');

  const retrievedSub = await memoryAdapter.getSubmission(savedMemorySub.id);
  assert(retrievedSub !== null && retrievedSub.id === savedMemorySub.id, 'Memory adapter getSubmission succeeds');

  // 3. Test Custom Developer Adapter Implementation
  console.log('\n--- 3. Custom Developer Adapter Implementation ---');
  const customStore: any[] = [];
  const customAdapter: FormStorageAdapter = {
    name: 'CustomEnterpriseAdapter',
    async saveSubmission(submission) {
      const record = {
        ...submission,
        id: `custom_uuid_${Date.now()}`,
        customFlag: true,
      };
      customStore.push(record);
      return record as FormSubmission;
    },
  };

  const savedCustom = await customAdapter.saveSubmission({
    formId: 'form_corp_99',
    formVersion: 2,
    data: { surveyScore: 10 },
    metadata: { submittedAt: new Date().toISOString() },
  });

  assert(savedCustom.id.startsWith('custom_uuid_'), 'Custom developer adapter executed save logic');
  assert(customStore.length === 1, 'Custom adapter stored record in host data structure');

  // 4. Test Server Submission Handler Utility
  console.log('\n--- 4. Server Submission Handler Utility ---');
  const serverProcessFail = await processSubmission({
    schema: testSchema,
    answers: { full_name: 'X' }, // missing required fields
    storageAdapter: memoryAdapter,
  });
  assert(serverProcessFail.status === 422, 'processSubmission returns HTTP 422 for invalid answers');
  assert(!serverProcessFail.success, 'processSubmission marked failure');

  const serverProcessSuccess = await processSubmission({
    schema: testSchema,
    answers: {
      full_name: 'Dana Kim',
      email: 'dana.kim@formforge.dev',
      available_hours: 20,
      preferred_role: 'analyst',
    },
    storageAdapter: memoryAdapter,
    metadata: { clientIp: '10.0.0.1' },
  });
  assert(serverProcessSuccess.status === 201, 'processSubmission returns HTTP 201 for valid answers');
  assert(serverProcessSuccess.success, 'processSubmission marked success');
  assert(serverProcessSuccess.submission?.data.full_name === 'Dana Kim', 'processSubmission persisted data via adapter');

  // 5. Test RestApiStorageAdapter against Sample Host API
  console.log('\n--- 5. RestApiStorageAdapter against Sample Host REST API ---');
  try {
    const restAdapter = new RestApiStorageAdapter({
      endpointUrl: `${BASE_URL}/api/sample-host/submissions`,
      headers: {
        'X-Custom-Auth': 'Bearer test-token-123',
      },
    });

    const hostSubmission = await restAdapter.saveSubmission({
      formId: testSchema.id,
      formVersion: testSchema.version,
      data: {
        full_name: 'Host API Respondent',
        email: 'respondent@external-corp.com',
        available_hours: 35,
        preferred_role: 'analyst',
      },
      metadata: {
        submittedAt: new Date().toISOString(),
        client: 'RestApiStorageAdapter-Test',
      },
    });

    assert(hostSubmission.id !== undefined, 'RestApiStorageAdapter successfully POSTed to host REST API');
    assert(hostSubmission.data.full_name === 'Host API Respondent', 'Host API returned stored data');

    // Verify host stored it
    const hostCheckRes = await fetch(`${BASE_URL}/api/sample-host/submissions`);
    const hostData = await hostCheckRes.json();
    assert(hostData.count > 0, 'Sample host backend verified receipt of submission');
  } catch (err: any) {
    console.error('REST API test error:', err);
    assert(false, `RestApiStorageAdapter failed: ${err.message}`);
  }

  // 6. Test Hosted Mode Backward Compatibility
  console.log('\n--- 6. Hosted Platform Backward Compatibility ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.status === 200, 'Hosted platform /api/health endpoint is healthy');

  console.log(`\n==========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
