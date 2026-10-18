import React, { useEffect, useState } from 'react';
import { FormItem } from '../../types/form.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { CreateFormModal } from './CreateFormModal.tsx';
import { EmbedCodeModal } from '../embed/EmbedCodeModal.tsx';
import {
  Plus,
  FileText,
  Search,
  Copy,
  Archive,
  RefreshCw,
  ExternalLink,
  Code2,
  Trash2,
  Inbox,
  Rocket,
  AlertCircle,
  Eye,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface FormsDashboardProps {
  onOpenBuilder: (formId: string) => void;
  onOpenResponses: (formId: string) => void;
  onOpenPublicView: (slug: string) => void;
}

export const FormsDashboard: React.FC<FormsDashboardProps> = ({
  onOpenBuilder,
  onOpenResponses,
  onOpenPublicView,
}) => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEmbedForm, setSelectedEmbedForm] = useState<FormItem | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listForms();
      setForms(res.forms);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve forms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleDuplicate = async (formId: string) => {
    try {
      await api.duplicateForm(formId);
      await loadForms();
    } catch (err: any) {
      setError('Failed to duplicate form: ' + err.message);
    }
  };

  const handleToggleArchive = async (form: FormItem) => {
    try {
      if (form.status === 'archived') {
        await api.unarchiveForm(form.id);
      } else {
        await api.archiveForm(form.id);
      }
      await loadForms();
    } catch (err: any) {
      setError('Failed to update form status: ' + err.message);
    }
  };

  const handleDelete = async (formId: string, title: string) => {
    try {
      await api.deleteForm(formId);
      setForms(forms.filter((f) => f.id !== formId));
    } catch (err: any) {
      setError('Failed to delete form: ' + err.message);
    }
  };

  // Metrics
  const totalSubmissions = forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);
  const publishedCount = forms.filter((f) => f.status === 'published').length;
  const draftCount = forms.filter((f) => f.status === 'draft').length;

  const filteredForms = forms.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return f.title.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{forms.length}</div>
            <div className="text-xs font-semibold text-slate-500">Total Form Projects</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{publishedCount}</div>
            <div className="text-xs font-semibold text-slate-500">Active Live Surveys</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{draftCount}</div>
            <div className="text-xs font-semibold text-slate-500">Draft Schemas</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{totalSubmissions}</div>
            <div className="text-xs font-semibold text-slate-500">Total Submissions</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Status Filter, Create New Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms by title..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  statusFilter === st
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadForms}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            title="Refresh Forms"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Form</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Forms Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-2">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading form projects...</p>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {forms.length === 0 ? 'No forms created yet' : 'No forms match your search filter'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {forms.length === 0
                ? 'Get started by creating your first survey or data-collection form with our dynamic builder.'
                : 'Try adjusting your search criteria or switching to "All" status filter.'}
            </p>
          </div>
          {forms.length === 0 && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Form</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition flex flex-col overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition truncate">
                      {form.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {form.description || 'No description provided.'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      form.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : form.status === 'archived'
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {form.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                  <span>Version {form.current_version}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {form.submission_count || 0} Submissions
                  </span>
                  <span>•</span>
                  <span>{new Date(form.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Card Actions Bottom Bar */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenBuilder(form.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                  >
                    Edit Form
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenResponses(form.id)}
                    className="px-2.5 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition"
                  >
                    Responses ({form.submission_count || 0})
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedEmbedForm(form)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
                    title="Share, Embed & Hosted Script Tag"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Embed</span>
                  </button>

                  {form.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => onOpenPublicView(form.slug)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Open Public Survey Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDuplicate(form.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Duplicate Form"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(form.id, form.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Form"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => onOpenBuilder(id)}
      />

      <EmbedCodeModal
        form={selectedEmbedForm}
        isOpen={!!selectedEmbedForm}
        onClose={() => setSelectedEmbedForm(null)}
      />
    </div>
  );
};
