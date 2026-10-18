import {
  FormStorageAdapter,
  FormSubmission,
  FormSchema,
} from '@formforge/core';

export interface SupabaseClientLike {
  from(table: string): {
    insert(values: any): {
      select(): {
        single(): Promise<{ data: any; error: any }>;
      };
    };
    select(columns?: string): {
      eq(column: string, value: any): {
        single?(): Promise<{ data: any; error: any }>;
        order?(col: string, opts?: any): {
          range?(from: number, to: number): Promise<{ data: any; error: any }>;
        };
      };
    };
  };
}

/**
 * SupabaseStorageAdapter (Optional)
 * For host applications that choose to use Supabase as their backend.
 * Not required for the core framework.
 */
export class SupabaseStorageAdapter implements FormStorageAdapter {
  readonly name = 'SupabaseStorageAdapter';
  private supabase: SupabaseClientLike;

  constructor(supabaseClient: SupabaseClientLike) {
    this.supabase = supabaseClient;
  }

  async saveSubmission(
    submission: Omit<FormSubmission, 'id'> & { id?: string }
  ): Promise<FormSubmission> {
    const { data, error } = await this.supabase
      .from('submissions')
      .insert({
        id: submission.id || crypto.randomUUID(),
        form_id: submission.formId,
        form_version: submission.formVersion,
        data: submission.data,
        metadata: {
          ...submission.metadata,
          submittedAt: submission.metadata?.submittedAt || new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error saving submission: ${error.message}`);
    }

    return {
      id: data.id,
      formId: data.form_id,
      formVersion: data.form_version,
      data: data.data,
      metadata: data.metadata,
    };
  }

  async getFormSchema(formId: string): Promise<FormSchema | null> {
    const { data, error } = await this.supabase
      .from('forms')
      .select('id, title, description, schema, updated_at')
      .eq('id', formId)
      .single!();

    if (error || !data) return null;

    const schemaData =
      typeof data.schema === 'string' ? JSON.parse(data.schema) : data.schema;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      version: schemaData.version || 1,
      fields: schemaData.fields || [],
      settings: schemaData.settings || {},
      updatedAt: data.updated_at,
    };
  }
}
