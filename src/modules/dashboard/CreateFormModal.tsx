import React, { useState } from 'react';
import { api } from '../../lib/api.ts';
import { Plus, FileText, AlertCircle } from 'lucide-react';

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newFormId: string) => void;
}

export const CreateFormModal: React.FC<CreateFormModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Form title is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.createForm(title, description);
      setTitle('');
      setDescription('');
      onClose();
      onCreated(res.form.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Create New Form Project</h3>
            <p className="text-xs text-slate-500">Design schemas, deploy surveys & collect data</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Form Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Household Health & Nutrition Survey 2026"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description / Research Purpose (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the questionnaire objective..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
