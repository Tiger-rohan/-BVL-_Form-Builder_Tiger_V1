import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FieldType, FormDefinition } from '../../types/form.ts';
import { api } from '../../lib/api.ts';
import { FieldPalette, PALETTE_ITEMS } from './FieldPalette.tsx';
import { FieldSettingsModal } from './FieldSettingsModal.tsx';
import { FormPreviewModal } from './FormPreviewModal.tsx';
import { VersionHistoryModal } from './VersionHistoryModal.tsx';
import {
  Save,
  Rocket,
  Eye,
  History,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Settings2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Code2,
  Sliders,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface FormBuilderProps {
  formId: string;
  onBack: () => void;
  onViewResponses: (formId: string) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  formId,
  onBack,
  onViewResponses,
}) => {
  const [form, setForm] = useState<FormItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field editing state
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Tab: 'builder' | 'settings' | 'json'
  const [activeTab, setActiveTab] = useState<'builder' | 'settings' | 'json'>('builder');

  // Form Metadata & Settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('Submit Response');
  const [confirmationMessage, setConfirmationMessage] = useState(
    'Thank you! Your submission has been securely recorded.'
  );

  const loadForm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getForm(formId);
      const f = res.form;
      setForm(f);
      setTitle(f.title);
      setDescription(f.description || '');
      setFields(f.schema?.fields || []);
      setSubmitButtonText(f.settings?.submitButtonText || 'Submit Response');
      setConfirmationMessage(
        f.settings?.confirmationMessage || 'Thank you! Your submission has been securely recorded.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load form.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [formId]);

  const handleAddField = (type: FieldType) => {
    const fieldCount = fields.length + 1;
    const typeMeta = PALETTE_ITEMS.find((p) => p.type === type);
    const newField: FormField = {
      id: crypto.randomUUID(),
      name: `field_${fieldCount}_${type}`,
      label: `Untitled ${typeMeta?.label || 'Question'}`,
      type,
      validation: { required: false },
      options: ['select', 'radio', 'checkbox'].includes(type)
        ? [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ]
        : undefined,
    };

    setFields([...fields, newField]);
    setEditingField(newField);
    setIsSettingsOpen(true);
  };

  const handleSaveField = (updated: FormField) => {
    setFields(fields.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDuplicateField = (index: number) => {
    const src = fields[index];
    const clone: FormField = {
      ...JSON.parse(JSON.stringify(src)),
      id: crypto.randomUUID(),
      name: `${src.name}_copy`,
      label: `${src.label} (Copy)`,
    };
    const next = [...fields];
    next.splice(index + 1, 0, clone);
    setFields(next);
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...fields];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setFields(next);
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError('Form title cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const schemaPayload: FormDefinition = {
        version: form?.current_version || 1,
        fields,
        settings: { submitButtonText, confirmationMessage },
      };

      const settingsPayload = {
        submitButtonText,
        confirmationMessage,
      };

      await api.updateForm(formId, {
        title,
        description,
        schema: schemaPayload,
        settings: settingsPayload,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      // First save draft state
      await handleSaveDraft();

      const res = await api.publishForm(formId, changelog);
      setIsPublishModalOpen(false);
      setChangelog('');
      await loadForm();
    } catch (err: any) {
      setError(err.message || 'Failed to publish form.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading form builder workspace...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-rose-200 text-center my-12">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Form Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'This form does not exist or access was denied.'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentSchemaObject: FormDefinition = {
    version: form.current_version,
    fields,
    settings: { submitButtonText, confirmationMessage },
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header / Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter Form Title..."
                  className="text-lg sm:text-xl font-extrabold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none px-1 py-0.5 rounded transition"
                />
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    form.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : form.status === 'archived'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {form.status} (v{form.current_version})
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 pl-1">
                <span>Slug: <span className="font-mono text-slate-600">{form.slug}</span></span>
                <span>•</span>
                <span>{fields.length} Questions</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVersionsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            <button
              type="button"
              onClick={() => onViewResponses(form.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <span>Responses</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-sm transition disabled:opacity-50"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? 'Saved' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Publish Form</span>
            </button>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex border-b border-slate-200/80 mt-5 -mb-1 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('builder')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'builder'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Form Canvas & Questions
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Form Settings & Copy</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>JSON Schema Definition</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Question Palette (Left / 1 column) */}
          <div className="lg:col-span-1">
            <FieldPalette onAddField={handleAddField} />
          </div>

          {/* Builder Canvas (Right / 3 columns) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Form Description Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Form Subtitle / Instructions for Respondents
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give respondents context, instructions, or privacy assurances..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Questions List */}
            {fields.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Your form has no questions yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click any question type from the palette on the left to start assembling your survey.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, idx) => {
                  const typeMeta = PALETTE_ITEMS.find((p) => p.type === field.type);
                  const Icon = typeMeta?.icon || Settings2;

                  return (
                    <div
                      key={field.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:border-slate-300 transition group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Position Badge & Icon */}
                          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                            <span className="text-[11px] font-bold text-slate-400 w-5 text-center">
                              #{idx + 1}
                            </span>
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                                typeMeta?.color || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Field Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800 truncate">
                                {field.label}
                              </h4>
                              {field.validation?.required && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-semibold">
                                  Required
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="capitalize">{field.type}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-500">key: {field.name}</span>
                            </div>

                            {field.helpText && (
                              <p className="text-xs text-slate-500 mt-1 italic">
                                {field.helpText}
                              </p>
                            )}

                            {/* Options Preview for choice types */}
                            {field.options && field.options.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {field.options.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]"
                                  >
                                    {opt.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, 'up')}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === fields.length - 1}
                            onClick={() => handleMoveField(idx, 'down')}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateField(idx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                            title="Duplicate Field"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingField(field);
                              setIsSettingsOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                            title="Field Settings"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Form Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Form Experience & Submission Settings
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submit Button Label
            </label>
            <input
              type="text"
              value={submitButtonText}
              onChange={(e) => setSubmitButtonText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmation Message
            </label>
            <textarea
              rows={3}
              value={confirmationMessage}
              onChange={(e) => setConfirmationMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Displayed immediately to the respondent once their submission passes validation and is safely recorded.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab: JSON Schema Inspector */}
      {activeTab === 'json' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Versioned JSON Definition</h3>
              <p className="text-xs text-slate-400">
                Specification conforms to FormForge Form Schema v{form.current_version}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(currentSchemaObject, null, 2));
                alert('JSON schema copied to clipboard');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px]">
            {JSON.stringify(currentSchemaObject, null, 2)}
          </pre>
        </div>
      )}

      {/* Modals */}
      <FieldSettingsModal
        field={editingField}
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setEditingField(null);
        }}
        onSave={handleSaveField}
      />

      <FormPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        schema={currentSchemaObject}
        title={title}
        description={description}
        version={form.current_version}
        settings={{ submitButtonText, confirmationMessage }}
      />

      <VersionHistoryModal
        formId={form.id}
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        currentVersion={form.current_version}
      />

      {/* Publish Dialog */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Publish Version {form.status === 'published' ? form.current_version + 1 : form.current_version}
                </h3>
                <p className="text-xs text-slate-500">
                  Create an immutable version snapshot & open public submissions
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Version Release Note / Changelog
              </label>
              <input
                type="text"
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="e.g. Added demographic fields and tightened validation"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2"
              >
                {publishing ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Rocket className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
