import { FormSchema, FormFieldDefinition, FormValidationResult } from './types.ts';

/**
 * Standard RFC 5322 compliant email regex pattern
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Evaluates whether a field's condition is satisfied based on current form answers.
 */
export function isFieldVisible(
  field: FormFieldDefinition,
  formData: Record<string, any>
): boolean {
  if (!field.condition) return true;

  const targetValue = formData[field.condition.fieldKey];
  const expectedValue = field.condition.value;

  switch (field.condition.operator) {
    case 'equals':
      return String(targetValue) === String(expectedValue);
    case 'notEquals':
      return String(targetValue) !== String(expectedValue);
    case 'isNotEmpty':
      return targetValue !== undefined && targetValue !== null && targetValue !== '';
    case 'contains':
      if (Array.isArray(targetValue)) {
        return targetValue.includes(expectedValue);
      }
      return String(targetValue || '').includes(String(expectedValue));
    default:
      return true;
  }
}

/**
 * Framework-independent validator for form submissions.
 * Validates a dataset against a FormSchema without any external library dependencies.
 */
export function validateFormSubmission(
  schema: FormSchema,
  data: Record<string, any>
): FormValidationResult {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    // If field is hidden by condition, skip validation
    if (!isFieldVisible(field, data)) {
      continue;
    }

    const value = data[field.key];
    const rules = field.validation || {};

    // 1. Check Required constraints
    const isMissing =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (rules.required && isMissing) {
      errors[field.key] =
        rules.customErrorMessage || `${field.label || field.key} is required.`;
      continue;
    }

    // If not required and empty, skip remaining validations
    if (isMissing) {
      continue;
    }

    // 2. Type-specific and Rule validation
    switch (field.type) {
      case 'text':
      case 'textarea': {
        const strVal = String(value);
        if (rules.min !== undefined && strVal.length < rules.min) {
          errors[field.key] = `Must be at least ${rules.min} characters.`;
        } else if (rules.max !== undefined && strVal.length > rules.max) {
          errors[field.key] = `Cannot exceed ${rules.max} characters.`;
        } else if (rules.pattern) {
          try {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(strVal)) {
              errors[field.key] =
                rules.customErrorMessage || `Input format is invalid.`;
            }
          } catch {
            // Ignore invalid developer regex
          }
        }
        break;
      }

      case 'email': {
        const emailStr = String(value).trim();
        if (!EMAIL_REGEX.test(emailStr)) {
          errors[field.key] =
            rules.customErrorMessage || `Please enter a valid email address.`;
        }
        break;
      }

      case 'number': {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors[field.key] = `Must be a valid number.`;
        } else {
          if (rules.min !== undefined && numVal < rules.min) {
            errors[field.key] = `Value cannot be less than ${rules.min}.`;
          }
          if (rules.max !== undefined && numVal > rules.max) {
            errors[field.key] = `Value cannot exceed ${rules.max}.`;
          }
        }
        break;
      }

      case 'select':
      case 'radio': {
        if (field.options && field.options.length > 0) {
          const allowedValues = field.options.map((opt) => opt.value);
          if (!allowedValues.includes(String(value))) {
            errors[field.key] = `Selected option is not in the allowed choices list.`;
          }
        }
        break;
      }

      case 'checkbox': {
        if (!Array.isArray(value)) {
          errors[field.key] = `Value must be an array of selected options.`;
        } else if (field.options && field.options.length > 0) {
          const allowedValues = field.options.map((opt) => opt.value);
          const hasInvalidChoice = value.some(
            (v) => !allowedValues.includes(String(v))
          );
          if (hasInvalidChoice) {
            errors[field.key] = `One or more selected options are invalid.`;
          }
        }
        break;
      }

      case 'date': {
        const dateVal = String(value);
        const parsed = Date.parse(dateVal);
        if (isNaN(parsed)) {
          errors[field.key] = `Please provide a valid ISO date (YYYY-MM-DD).`;
        }
        break;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
