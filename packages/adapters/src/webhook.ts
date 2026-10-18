import {
  FormStorageAdapter,
  FormSubmission,
} from '@formforge/core';

export interface WebhookAdapterOptions {
  webhookUrl: string;
  secretToken?: string;
  additionalHeaders?: Record<string, string>;
  customFetch?: typeof fetch;
}

/**
 * WebhookStorageAdapter
 * Dispatches form submission payloads as JSON webhooks to any external service.
 */
export class WebhookStorageAdapter implements FormStorageAdapter {
  readonly name = 'WebhookStorageAdapter';
  private webhookUrl: string;
  private secretToken?: string;
  private additionalHeaders: Record<string, string>;
  private fetchFn: typeof fetch;

  constructor(options: WebhookAdapterOptions) {
    this.webhookUrl = options.webhookUrl;
    this.secretToken = options.secretToken;
    this.additionalHeaders = options.additionalHeaders || {};
    this.fetchFn = options.customFetch || globalThis.fetch;
  }

  async saveSubmission(
    submission: Omit<FormSubmission, 'id'> & { id?: string }
  ): Promise<FormSubmission> {
    const record: FormSubmission = {
      ...submission,
      id: submission.id || `sub_wh_${Date.now()}`,
      metadata: {
        ...submission.metadata,
        submittedAt: submission.metadata?.submittedAt || new Date().toISOString(),
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FormForge-Event': 'form.submission',
      'X-FormForge-Timestamp': new Date().toISOString(),
      ...this.additionalHeaders,
    };

    if (this.secretToken) {
      headers['X-FormForge-Signature'] = `token=${this.secretToken}`;
    }

    const res = await this.fetchFn(this.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      throw new Error(`Webhook endpoint responded with HTTP ${res.status}`);
    }

    return record;
  }
}
