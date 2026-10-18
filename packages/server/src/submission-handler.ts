import {
  FormSchema,
  FormStorageAdapter,
  FormSubmission,
  validateFormSubmission,
} from '@formforge/core';

export interface ProcessSubmissionOptions {
  schema: FormSchema;
  answers: Record<string, any>;
  storageAdapter: FormStorageAdapter;
  metadata?: {
    clientIp?: string;
    userAgent?: string;
    [key: string]: any;
  };
}

export interface ProcessSubmissionResult {
  success: boolean;
  submission?: FormSubmission;
  errors?: Record<string, string>;
  status: number;
}

/**
 * Server-side submission processor.
 * Performs strict validation and delegates persistence to the provided storage adapter.
 */
export async function processSubmission(
  options: ProcessSubmissionOptions
): Promise<ProcessSubmissionResult> {
  const { schema, answers, storageAdapter, metadata } = options;

  // 1. Strict server validation
  const validation = validateFormSubmission(schema, answers);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      status: 422,
    };
  }

  // 2. Persist via storage adapter
  try {
    const saved = await storageAdapter.saveSubmission({
      formId: schema.id,
      formVersion: schema.version,
      data: answers,
      metadata: {
        submittedAt: new Date().toISOString(),
        clientIp: metadata?.clientIp || '127.0.0.1',
        userAgent: metadata?.userAgent || 'Unknown',
        ...metadata,
      },
    });

    return {
      success: true,
      submission: saved,
      status: 201,
    };
  } catch (err: any) {
    return {
      success: false,
      errors: {
        _storage: err.message || 'Storage adapter failed to persist submission.',
      },
      status: 500,
    };
  }
}
