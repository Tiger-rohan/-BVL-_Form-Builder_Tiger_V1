import React, { useState } from 'react';
import { FormDefinition, FormField } from '../../types/form.ts';
import { FormFieldComponent } from './FormFieldComponent.tsx';
import { CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Send } from 'lucide-react';

interface FormRendererProps {
  schema: FormDefinition;
  title: string;
  description?: string;
  version?: number;
  settings?: any;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isPreview?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  title,
  description,
  version,
  settings,
  onSubmit,
  isPreview = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    schema.fields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        init[f.id] = f.defaultValue;
      } else if (f.type === 'checkbox') {
        init[f.id] = [];
      } else {
        init[f.id] = '';
      }
    });
    return init;
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};

    for (const field of schema.fields) {
      const val = formData[field.id];
      const validation = field.validation || {};

      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0);

      if (validation.required && isEmpty) {
        errors[field.id] = `"${field.label}" is required.`;
        continue;
      }

      if (isEmpty) continue;

      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          errors[field.id] = 'Please enter a valid email address.';
        }
      }

      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors[field.id] = 'Must be a valid number.';
        } else if (validation.min !== undefined && num < validation.min) {
          errors[field.id] = `Minimum allowed value is ${validation.min}.`;
        } else if (validation.max !== undefined && num > validation.max) {
          errors[field.id] = `Maximum allowed value is ${validation.max}.`;
        }
      }

      if (field.type === 'text' || field.type === 'textarea') {
        const str = String(val).trim();
        if (validation.minLength && str.length < validation.minLength) {
          errors[field.id] = `Must be at least ${validation.minLength} characters.`;
        }
        if (validation.maxLength && str.length > validation.maxLength) {
          errors[field.id] = `Cannot exceed ${validation.maxLength} characters.`;
        }
      }

      if (field.type === 'checkbox') {
        const arr = Array.isArray(val) ? val : [];
        if (validation.minSelect && arr.length < validation.minSelect) {
          errors[field.id] = `Please select at least ${validation.minSelect} option(s).`;
        }
        if (validation.maxSelect && arr.length > validation.maxSelect) {
          errors[field.id] = `You may select at most ${validation.maxSelect} option(s).`;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (fieldId: string, val: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClient()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(fieldErrors)[0];
      if (firstErrorKey) {
        document.getElementById(`field-container-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err: any) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      setServerError(err.message || 'Submission failed. Please check the inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const init: Record<string, any> = {};
    schema.fields.forEach((f) => {
      init[f.id] = f.defaultValue !== undefined ? f.defaultValue : f.type === 'checkbox' ? [] : '';
    });
    setFormData(init);
    setFieldErrors({});
    setSubmitted(false);
    setServerError(null);
  };

  const submitButtonText = settings?.submitButtonText || 'Submit Response';
  const confirmationMessage =
    settings?.confirmationMessage || 'Thank you! Your response has been securely recorded.';

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-5 animate-fade-in my-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Submission Received</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
          {confirmationMessage}
        </p>

        {version && (
          <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
            Recorded against Form Schema v{version}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Submit Another Response</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden my-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8">
        {isPreview && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-300/40 text-amber-200 rounded-md text-xs font-medium mb-3">
            <span>Live Builder Preview Mode</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-emerald-100 text-sm leading-relaxed">{description}</p>
            )}
          </div>
          {version && (
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
              v{version}
            </span>
          )}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {serverError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <div className="font-semibold">Unable to submit response</div>
              <div className="text-xs text-rose-700 mt-0.5">{serverError}</div>
            </div>
          </div>
        )}

        {schema.fields.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">This form has no active fields defined yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {schema.fields.map((field) => (
              <FormFieldComponent
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(val) => handleFieldChange(field.id, val)}
                error={fieldErrors[field.id]}
                disabled={submitting}
              />
            ))}
          </div>
        )}

        {schema.fields.length > 0 && (
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="text-rose-500 font-bold">*</span> Indicates mandatory field
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm hover:shadow disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{submitButtonText}</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
