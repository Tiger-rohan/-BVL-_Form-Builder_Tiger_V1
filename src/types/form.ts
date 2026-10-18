export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface FormOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  minSelect?: number;
  maxSelect?: number;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: FormOption[];
  validation?: FieldValidation;
}

export interface FormSettings {
  submitButtonText?: string;
  confirmationMessage?: string;
  redirectUrl?: string;
  allowMultipleSubmissions?: boolean;
}

export interface FormDefinition {
  version: number;
  fields: FormField[];
  settings?: FormSettings;
}

export interface FormItem {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  current_version: number;
  schema: FormDefinition;
  settings: FormSettings;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

export interface FormVersionItem {
  id: string;
  version_number: number;
  changelog?: string;
  created_at: string;
  submission_count?: number;
}

export interface SubmissionItem {
  id: string;
  formVersion: number;
  data: Record<string, any>;
  metadata: {
    ip?: string;
    userAgent?: string;
    submittedAt?: string;
    completionTimeSeconds?: number;
  };
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}
