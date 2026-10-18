/**
 * @formforge/core - Portable, framework-agnostic types and interfaces
 */

export type FormFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customErrorMessage?: string;
}

export interface FormFieldCondition {
  fieldKey: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isNotEmpty';
  value: any;
}

export interface FormFieldDefinition {
  id: string;
  key: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: FormFieldOption[];
  defaultValue?: any;
  condition?: FormFieldCondition;
}

export interface SubmissionSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  allowMultiple?: boolean;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  version: number;
  fields: FormFieldDefinition[];
  settings?: SubmissionSettings;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormSubmissionMetadata {
  submittedAt: string;
  clientIp?: string;
  userAgent?: string;
  durationMs?: number;
  [key: string]: any;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formVersion: number;
  data: Record<string, any>;
  metadata: FormSubmissionMetadata;
}

export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Standard Storage Adapter Interface
 * Allows FormForge to be backed by in-memory stores, REST APIs,
 * PostgreSQL, MySQL, MongoDB, Supabase, or any custom storage.
 */
export interface FormStorageAdapter {
  /** Descriptive name of the storage adapter (e.g. 'MemoryStorageAdapter', 'RestApiStorageAdapter') */
  readonly name: string;

  /**
   * Save a verified form submission.
   * Host application can persist this in any database, table, or external API.
   */
  saveSubmission(
    submission: Omit<FormSubmission, 'id'> & { id?: string }
  ): Promise<FormSubmission>;

  /** Optional: Retrieve the active form schema by ID or slug */
  getFormSchema?(formId: string): Promise<FormSchema | null>;

  /** Optional: Retrieve all submissions for a given form */
  listSubmissions?(
    formId: string,
    options?: { limit?: number; offset?: number; search?: string }
  ): Promise<FormSubmission[]>;

  /** Optional: Retrieve a specific submission by its ID */
  getSubmission?(submissionId: string): Promise<FormSubmission | null>;
}
