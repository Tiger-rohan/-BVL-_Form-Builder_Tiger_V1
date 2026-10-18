export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
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

export interface FormFieldSchema {
  id: string;
  name: string; // programmatic field key
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
}

export interface FormDefinitionSchema {
  version: number;
  fields: FormFieldSchema[];
  settings?: {
    submitButtonText?: string;
    confirmationMessage?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateFormSubmission(
  schema: FormDefinitionSchema,
  submittedData: unknown
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};

  if (!submittedData || typeof submittedData !== 'object' || Array.isArray(submittedData)) {
    return {
      isValid: false,
      errors: { _general: 'Submission payload must be a JSON object.' },
      sanitizedData: {},
    };
  }

  const rawData = submittedData as Record<string, any>;

  for (const field of schema.fields) {
    const rawVal = rawData[field.id] !== undefined ? rawData[field.id] : rawData[field.name];
    const validation = field.validation || {};
    const isRequired = !!validation.required;

    // 1. Required check
    const isEmpty =
      rawVal === undefined ||
      rawVal === null ||
      (typeof rawVal === 'string' && rawVal.trim() === '') ||
      (Array.isArray(rawVal) && rawVal.length === 0);

    if (isRequired && isEmpty) {
      errors[field.id] = `"${field.label}" is required.`;
      continue;
    }

    // If empty and not required, skip further type/range validation
    if (isEmpty) {
      sanitizedData[field.id] = null;
      continue;
    }

    // 2. Type-specific validation
    switch (field.type) {
      case 'text':
      case 'textarea': {
        if (typeof rawVal !== 'string') {
          errors[field.id] = `"${field.label}" must be a text value.`;
          break;
        }
        const str = rawVal.trim();
        if (validation.minLength !== undefined && str.length < validation.minLength) {
          errors[field.id] = `"${field.label}" must be at least ${validation.minLength} characters.`;
          break;
        }
        if (validation.maxLength !== undefined && str.length > validation.maxLength) {
          errors[field.id] = `"${field.label}" cannot exceed ${validation.maxLength} characters.`;
          break;
        }
        if (validation.pattern) {
          try {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(str)) {
              errors[field.id] =
                validation.patternMessage || `"${field.label}" format is invalid.`;
              break;
            }
          } catch {
            // invalid regex configuration ignored on server
          }
        }
        sanitizedData[field.id] = str;
        break;
      }

      case 'email': {
        if (typeof rawVal !== 'string') {
          errors[field.id] = `"${field.label}" must be a valid email string.`;
          break;
        }
        const emailStr = rawVal.trim().toLowerCase();
        if (!EMAIL_REGEX.test(emailStr)) {
          errors[field.id] = `Please provide a valid email address for "${field.label}".`;
          break;
        }
        sanitizedData[field.id] = emailStr;
        break;
      }

      case 'number': {
        const num = Number(rawVal);
        if (isNaN(num)) {
          errors[field.id] = `"${field.label}" must be a valid number.`;
          break;
        }
        if (validation.min !== undefined && num < validation.min) {
          errors[field.id] = `"${field.label}" cannot be less than ${validation.min}.`;
          break;
        }
        if (validation.max !== undefined && num > validation.max) {
          errors[field.id] = `"${field.label}" cannot be greater than ${validation.max}.`;
          break;
        }
        sanitizedData[field.id] = num;
        break;
      }

      case 'select':
      case 'radio': {
        if (typeof rawVal !== 'string') {
          errors[field.id] = `"${field.label}" must be a single option value.`;
          break;
        }
        const valStr = rawVal.trim();
        const validOptions = (field.options || []).map((o) => o.value);
        if (validOptions.length > 0 && !validOptions.includes(valStr)) {
          errors[field.id] = `Selected option "${valStr}" is not allowed for "${field.label}".`;
          break;
        }
        sanitizedData[field.id] = valStr;
        break;
      }

      case 'checkbox': {
        if (!Array.isArray(rawVal)) {
          errors[field.id] = `"${field.label}" must be an array of selected options.`;
          break;
        }
        const selectedStrings = rawVal.map((v) => String(v).trim());
        const validOptions = (field.options || []).map((o) => o.value);
        
        // Check membership
        const invalidSelections = selectedStrings.filter((s) => !validOptions.includes(s));
        if (validOptions.length > 0 && invalidSelections.length > 0) {
          errors[field.id] = `Selected options contain invalid choices: ${invalidSelections.join(', ')}`;
          break;
        }

        if (validation.minSelect !== undefined && selectedStrings.length < validation.minSelect) {
          errors[field.id] = `Please select at least ${validation.minSelect} option(s) for "${field.label}".`;
          break;
        }
        if (validation.maxSelect !== undefined && selectedStrings.length > validation.maxSelect) {
          errors[field.id] = `You can select at most ${validation.maxSelect} option(s) for "${field.label}".`;
          break;
        }

        sanitizedData[field.id] = selectedStrings;
        break;
      }

      case 'date': {
        if (typeof rawVal !== 'string') {
          errors[field.id] = `"${field.label}" must be a date string.`;
          break;
        }
        const dateStr = rawVal.trim();
        if (!DATE_REGEX.test(dateStr)) {
          errors[field.id] = `"${field.label}" must be in YYYY-MM-DD date format.`;
          break;
        }
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          errors[field.id] = `"${field.label}" is not a valid calendar date.`;
          break;
        }
        sanitizedData[field.id] = dateStr;
        break;
      }

      default:
        sanitizedData[field.id] = rawVal;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
}
