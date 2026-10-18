import React, { useState } from 'react';
import {
  FormSchema,
  FormStorageAdapter,
  FormSubmission,
  validateFormSubmission,
  isFieldVisible,
} from '@formforge/core';
import { FormField } from './FormField.tsx';
import { CheckCircle2, AlertTriangle, Send, RefreshCw } from 'lucide-react';

export interface FormRendererProps {
  /** The versioned JSON form schema */
  schema: FormSchema;
  /** Optional storage adapter (Memory, REST API, Webhook, Postgres, etc.) */
  storageAdapter?: FormStorageAdapter;
  /** Custom submit handler if not using an adapter */
  onSubmit?: (data: Record<string, any>) => Promise<void> | void;
  /** Callback fired after successful submission */
  onSuccess?: (submission: FormSubmission | Record<string, any>) => void;
  /** Callback fired when validation fails */
  onError?: (errors: Record<string, string>) => void;
  /** Initial form values */
  initialValues?: Record<string, any>;
  /** Disable all inputs */
  readOnly?: boolean;
  /** Optional custom CSS classes */
  className?: string;
  /** Hide the header/title bar */
  hideHeader?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  storageAdapter,
  onSubmit,
  onSuccess,
  onError,
  initialValues = {},
  readOnly = false,
  className = '',
  hideHeader = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = { ...initialValues };
    schema.fields.forEach((f) => {
      if (defaults[f.key] === undefined && f.defaultValue !== undefined) {
        defaults[f.key] = f.defaultValue;
      }
    });
    return defaults;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear validation error when user touches field
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || submitting) return;

    setServerError(null);

    // 1. Client-side validation using @formforge/core
    const validation = validateFormSubmission(schema, formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      if (onError) onError(validation.errors);

      // Scroll to first error field
      const firstErrorKey = Object.keys(validation.errors)[0];
      const errorField = schema.fields.find((f) => f.key === firstErrorKey);
      if (errorField) {
        const el = document.getElementById(`field-container-${errorField.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      if (storageAdapter) {
        // Submit using the configured storage adapter
        const saved = await storageAdapter.saveSubmission({
          formId: schema.id,
          formVersion: schema.version,
          data: formData,
          metadata: {
            submittedAt: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          },
        });
        setSubmitted(true);
        if (onSuccess) onSuccess(saved);
      } else if (onSubmit) {
        // Submit using developer custom onSubmit handler
        await onSubmit(formData);
        setSubmitted(true);
        if (onSuccess) onSuccess(formData);
      } else {
        // Standalone preview mode
        setSubmitted(true);
        if (onSuccess) onSuccess(formData);
      }
    } catch (err: any) {
      const message = err.message || 'An unexpected error occurred while submitting.';
      setServerError(message);
      if (onError) onError({ _server: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
    setSubmitted(false);
    setServerError(null);
  };

  if (submitted) {
    return (
      <div className={`p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-5 animate-fade-in ${className}`}>
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Submission Received!
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {schema.settings?.successMessage ||
              'Thank you! Your response has been securely recorded.'}
          </p>
          {storageAdapter && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span>Stored via:</span>
                <span className="font-mono text-emerald-700">{storageAdapter.name}</span>
              </span>
            </div>
          )}
        </div>

        {schema.settings?.allowMultiple !== false && (
          <div className="pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Submit Another Response</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}
      noValidate
    >
      {!hideHeader && (
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {schema.title}
            </h2>
            <span className="text-[11px] font-mono text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              v{schema.version}
            </span>
          </div>
          {schema.description && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {schema.description}
            </p>
          )}
        </div>
      )}

      {/* Global Server Error Banner */}
      {serverError && (
        <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">Submission Failed: </span>
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="p-6 sm:p-8 space-y-6">
        {schema.fields.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            This form has no questions defined yet.
          </div>
        ) : (
          schema.fields.map((field) => {
            if (!isFieldVisible(field, formData)) return null;

            return (
              <FormField
                key={field.id}
                field={field}
                value={formData[field.key]}
                onChange={(val) => handleFieldChange(field.key, val)}
                error={errors[field.key]}
                disabled={readOnly || submitting}
              />
            );
          })
        )}
      </div>

      {/* Form Actions */}
      {!readOnly && schema.fields.length > 0 && (
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by FormForge Engine
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{schema.settings?.submitButtonText || 'Submit Response'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
};
