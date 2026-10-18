import { FormSchema, FormFieldDefinition } from './types.ts';

export function createBlankSchema(title = 'Untitled Survey'): FormSchema {
  return {
    id: `form_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    description: '',
    version: 1,
    fields: [
      {
        id: `f_${Date.now()}_1`,
        key: 'full_name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter respondent name...',
        validation: { required: true, min: 2 },
      },
      {
        id: `f_${Date.now()}_2`,
        key: 'email_address',
        type: 'email',
        label: 'Email Address',
        placeholder: 'name@organization.org',
        validation: { required: true },
      },
    ],
    settings: {
      submitButtonText: 'Submit Assessment',
      successMessage: 'Thank you! Your assessment has been recorded successfully.',
      allowMultiple: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function bumpSchemaVersion(schema: FormSchema): FormSchema {
  return {
    ...schema,
    version: schema.version + 1,
    updatedAt: new Date().toISOString(),
  };
}
