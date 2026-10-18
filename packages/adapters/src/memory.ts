import {
  FormStorageAdapter,
  FormSubmission,
  FormSchema,
} from '@formforge/core';

/**
 * MemoryStorageAdapter
 * Framework-neutral in-memory storage adapter for testing, development,
 * offline usage, and zero-database embedded environments.
 */
export class MemoryStorageAdapter implements FormStorageAdapter {
  readonly name = 'MemoryStorageAdapter';
  private submissions: Map<string, FormSubmission> = new Map();
  private schemas: Map<string, FormSchema> = new Map();

  constructor(initialSchemas: FormSchema[] = []) {
    for (const schema of initialSchemas) {
      this.schemas.set(schema.id, schema);
    }
  }

  setSchema(schema: FormSchema): void {
    this.schemas.set(schema.id, schema);
  }

  async getFormSchema(formId: string): Promise<FormSchema | null> {
    return this.schemas.get(formId) || null;
  }

  async saveSubmission(
    submission: Omit<FormSubmission, 'id'> & { id?: string }
  ): Promise<FormSubmission> {
    const id =
      submission.id ||
      `sub_mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const savedRecord: FormSubmission = {
      ...submission,
      id,
      metadata: {
        ...submission.metadata,
        submittedAt: submission.metadata?.submittedAt || new Date().toISOString(),
      },
    };

    this.submissions.set(id, savedRecord);
    return savedRecord;
  }

  async listSubmissions(
    formId: string,
    options?: { limit?: number; offset?: number; search?: string }
  ): Promise<FormSubmission[]> {
    let results = Array.from(this.submissions.values()).filter(
      (s) => s.formId === formId
    );

    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter((s) =>
        JSON.stringify(s.data).toLowerCase().includes(q)
      );
    }

    // Sort descending by submittedAt
    results.sort(
      (a, b) =>
        new Date(b.metadata.submittedAt).getTime() -
        new Date(a.metadata.submittedAt).getTime()
    );

    const offset = options?.offset || 0;
    const limit = options?.limit !== undefined ? options.limit : results.length;

    return results.slice(offset, offset + limit);
  }

  async getSubmission(submissionId: string): Promise<FormSubmission | null> {
    return this.submissions.get(submissionId) || null;
  }

  clear(): void {
    this.submissions.clear();
  }

  count(formId?: string): number {
    if (!formId) return this.submissions.size;
    return Array.from(this.submissions.values()).filter(
      (s) => s.formId === formId
    ).length;
  }
}
