import React, { useState } from 'react';
import { FormField, FormOption } from '../../types/form.ts';
import { Settings, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface FieldSettingsModalProps {
  field: FormField | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedField: FormField) => void;
}

export const FieldSettingsModal: React.FC<FieldSettingsModalProps> = ({
  field,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !field) return null;

  const [label, setLabel] = useState(field.label);
  const [name, setName] = useState(field.name);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [helpText, setHelpText] = useState(field.helpText || '');
  const [required, setRequired] = useState(!!field.validation?.required);
  const [min, setMin] = useState<string>(
    field.validation?.min !== undefined ? String(field.validation.min) : ''
  );
  const [max, setMax] = useState<string>(
    field.validation?.max !== undefined ? String(field.validation.max) : ''
  );
  const [minLength, setMinLength] = useState<string>(
    field.validation?.minLength !== undefined ? String(field.validation.minLength) : ''
  );
  const [maxLength, setMaxLength] = useState<string>(
    field.validation?.maxLength !== undefined ? String(field.validation.maxLength) : ''
  );
  const [pattern, setPattern] = useState(field.validation?.pattern || '');
  const [patternMessage, setPatternMessage] = useState(field.validation?.patternMessage || '');
  const [minSelect, setMinSelect] = useState<string>(
    field.validation?.minSelect !== undefined ? String(field.validation.minSelect) : ''
  );
  const [maxSelect, setMaxSelect] = useState<string>(
    field.validation?.maxSelect !== undefined ? String(field.validation.maxSelect) : ''
  );

  const [options, setOptions] = useState<FormOption[]>(
    field.options && field.options.length > 0
      ? field.options
      : [
          { label: 'Option 1', value: 'option_1' },
          { label: 'Option 2', value: 'option_2' },
        ]
  );

  const handleAddOption = () => {
    const num = options.length + 1;
    setOptions([...options, { label: `Option ${num}`, value: `option_${num}` }]);
  };

  const handleUpdateOption = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [key]: val };
    // Auto-update value if label changed and value was default
    if (key === 'label' && (!updated[index].value || updated[index].value.startsWith('option_'))) {
      updated[index].value = val.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: FormField = {
      ...field,
      label: label.trim() || 'Untitled Question',
      name: name.trim() || field.name,
      placeholder: placeholder.trim() || undefined,
      helpText: helpText.trim() || undefined,
      validation: {
        required,
        min: min !== '' ? Number(min) : undefined,
        max: max !== '' ? Number(max) : undefined,
        minLength: minLength !== '' ? Number(minLength) : undefined,
        maxLength: maxLength !== '' ? Number(maxLength) : undefined,
        pattern: pattern.trim() || undefined,
        patternMessage: patternMessage.trim() || undefined,
        minSelect: minSelect !== '' ? Number(minSelect) : undefined,
        maxSelect: maxSelect !== '' ? Number(maxSelect) : undefined,
      },
      options: ['select', 'radio', 'checkbox'].includes(field.type) ? options : undefined,
    };

    onSave(updated);
    onClose();
  };

  const isChoiceType = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Question</h3>
              <p className="text-xs text-slate-500">Type: {field.type.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
          {/* Label */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Question Title / Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Programmatic Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Data Field Key (Programmatic Name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. household_income"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Identifier used in CSV exports, REST APIs, and webhook payloads.
            </p>
          </div>

          {/* Help Text */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Instruction / Help Text</label>
            <input
              type="text"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Provide context or guidance for respondents..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Placeholder */}
          {!isChoiceType && field.type !== 'date' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Placeholder Text</label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Hint shown inside empty field"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Mandatory Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
              />
              <span className="font-semibold text-slate-800">Mandatory (Required Field)</span>
            </label>
          </div>

          {/* Choice Options Manager */}
          {isChoiceType && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Response Options</span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-medium text-[11px] transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                      placeholder="Option label"
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => handleUpdateOption(idx, 'value', e.target.value)}
                      placeholder="Value code"
                      className="w-32 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={options.length <= 1}
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Number Range Constraints */}
          {field.type === 'number' && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Value</label>
                <input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Value</label>
                <input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Text String Length Constraints */}
          {(field.type === 'text' || field.type === 'textarea') && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Characters</label>
                  <input
                    type="number"
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Characters</label>
                  <input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Regex Pattern Guard
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. ^[A-Z]{2}[0-9]{4}$"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              {pattern && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Regex Failure Message
                  </label>
                  <input
                    type="text"
                    value={patternMessage}
                    onChange={(e) => setPatternMessage(e.target.value)}
                    placeholder="e.g. Must start with 2 uppercase letters followed by 4 digits"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Checkbox Multiple Select Limits */}
          {field.type === 'checkbox' && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Selections</label>
                <input
                  type="number"
                  min="0"
                  value={minSelect}
                  onChange={(e) => setMinSelect(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Selections</label>
                <input
                  type="number"
                  min="1"
                  value={maxSelect}
                  onChange={(e) => setMaxSelect(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
