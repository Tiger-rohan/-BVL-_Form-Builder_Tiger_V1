import {
  FormStorageAdapter,
  FormSubmission,
  FormSchema,
} from '@formforge/core';

export interface RestApiAdapterOptions {
  /** The base URL or full endpoint where submissions should be POSTed */
  endpointUrl: string;
  /** Custom HTTP headers sent with each request (e.g. Authorization, X-Api-Key) */
  headers?: Record<string, string>;
  /** Optional transformation function before sending to host API */
  transformPayload?: (submission: Omit<FormSubmission, 'id'>) => any;
  /** Optional custom fetch implementation (defaults to global fetch) */
  customFetch?: typeof fetch;
}

/**
 * RestApiStorageAdapter
 * Sends form submissions over HTTP to any host backend (Python, Java, Go, PHP, .NET, Node.js).
 */
export class RestApiStorageAdapter implements FormStorageAdapter {
  readonly name = 'RestApiStorageAdapter';
  private endpointUrl: string;
  private headers: Record<string, string>;
  private transformPayload?: (submission: Omit<FormSubmission, 'id'>) => any;
  private fetchFn: typeof fetch;

  constructor(options: RestApiAdapterOptions) {
    this.endpointUrl = options.endpointUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    this.transformPayload = options.transformPayload;
    this.fetchFn = options.customFetch || globalThis.fetch;
  }

  async saveSubmission(
    submission: Omit<FormSubmission, 'id'> & { id?: string }
  ): Promise<FormSubmission> {
    const payload = this.transformPayload
      ? this.transformPayload(submission)
      : {
          id: submission.id || `sub_api_${Date.now()}`,
          formId: submission.formId,
          formVersion: submission.formVersion,
          data: submission.data,
          metadata: {
            ...submission.metadata,
            submittedAt: submission.metadata?.submittedAt || new Date().toISOString(),
          },
        };

    const res = await this.fetchFn(this.endpointUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = `Host API responded with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error || errJson.message) {
          errorMsg = errJson.error || errJson.message;
        }
      } catch {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    const responseData = await res.json().catch(() => ({}));
    return {
      id: responseData.id || payload.id || `sub_${Date.now()}`,
      formId: responseData.formId || submission.formId,
      formVersion: responseData.formVersion || submission.formVersion,
      data: responseData.data || submission.data,
      metadata: responseData.metadata || submission.metadata,
    };
  }

  async listSubmissions(
    formId: string,
    options?: { limit?: number; offset?: number; search?: string }
  ): Promise<FormSubmission[]> {
    const url = new URL(this.endpointUrl);
    url.searchParams.set('formId', formId);
    if (options?.limit) url.searchParams.set('limit', String(options.limit));
    if (options?.offset) url.searchParams.set('offset', String(options.offset));
    if (options?.search) url.searchParams.set('search', options.search);

    const res = await this.fetchFn(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to list submissions from host API: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.submissions || [];
  }
}
