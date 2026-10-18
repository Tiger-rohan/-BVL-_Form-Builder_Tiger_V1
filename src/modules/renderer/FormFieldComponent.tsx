import React from 'react';
import { FormField } from '../../types/form.ts';
import { AlertCircle } from 'lucide-react';

interface FormFieldComponentProps {
  field: FormField;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
}

export const FormFieldComponent: React.FC<FormFieldComponentProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const isRequired = !!field.validation?.required;

  return (
    <div className="space-y-1.5" id={`field-container-${field.id}`}>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={field.id}
          className="text-sm font-semibold text-slate-800 flex items-center gap-1"
        >
          <span>{field.label}</span>
          {isRequired && (
            <span className="text-rose-500 font-bold" title="Required field">
              *
            </span>
          )}
        </label>
        {field.validation?.maxLength && (
          <span className="text-[11px] text-slate-400">
            {typeof value === 'string' ? value.length : 0}/{field.validation.maxLength}
          </span>
        )}
      </div>

      {field.helpText && (
        <p className="text-xs text-slate-500 leading-relaxed">{field.helpText}</p>
      )}

      {/* Render field control according to type */}
      <div className="mt-1">
        {field.type === 'text' && (
          <input
            id={field.id}
            type="text"
            disabled={disabled}
            placeholder={field.placeholder || ''}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            } disabled:bg-slate-100 disabled:cursor-not-allowed`}
          />
        )}

        {field.type === 'email' && (
          <input
            id={field.id}
            type="email"
            disabled={disabled}
            placeholder={field.placeholder || 'respondent@example.com'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            } disabled:bg-slate-100 disabled:cursor-not-allowed`}
          />
        )}

        {field.type === 'number' && (
          <input
            id={field.id}
            type="number"
            disabled={disabled}
            placeholder={field.placeholder || ''}
            min={field.validation?.min}
            max={field.validation?.max}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            } disabled:bg-slate-100 disabled:cursor-not-allowed`}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            id={field.id}
            disabled={disabled}
            rows={4}
            placeholder={field.placeholder || ''}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            } disabled:bg-slate-100 disabled:cursor-not-allowed`}
          />
        )}

        {field.type === 'select' && (
          <select
            id={field.id}
            disabled={disabled}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            } disabled:bg-slate-100 disabled:cursor-not-allowed`}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {(field.options || []).map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label || opt.value}
              </option>
            ))}
          </select>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2 pt-1">
            {(field.options || []).map((opt, idx) => {
              const checked = value === opt.value;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    checked
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name={field.id}
                    disabled={disabled}
                    checked={checked}
                    value={opt.value}
                    onChange={() => onChange(opt.value)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-sm font-medium">{opt.label || opt.value}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2 pt-1">
            {(field.options || []).map((opt, idx) => {
              const currentArray: string[] = Array.isArray(value) ? value : [];
              const checked = currentArray.includes(opt.value);
              const toggleOption = () => {
                if (disabled) return;
                if (checked) {
                  onChange(currentArray.filter((v) => v !== opt.value));
                } else {
                  onChange([...currentArray, opt.value]);
                }
              };
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    checked
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={checked}
                    onChange={toggleOption}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-sm font-medium">{opt.label || opt.value}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === 'date' && (
          <input
            id={field.id}
            type="date"
            disabled={disabled}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
            } disabled:bg-slate-100 disabled:cursor-not-allowed`}
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
