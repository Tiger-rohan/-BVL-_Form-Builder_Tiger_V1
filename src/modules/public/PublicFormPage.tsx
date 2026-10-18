import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { FormDefinition } from '../../types/form.ts';
import { FormRenderer } from '../renderer/FormRenderer.tsx';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

interface PublicFormPageProps {
  slug: string;
  onGoHome?: () => void;
}

export const PublicFormPage: React.FC<PublicFormPageProps> = ({ slug, onGoHome }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    description: string;
    slug: string;
    version: number;
    schema: FormDefinition;
    settings: any;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getPublicForm(slug)
      .then((res) => {
        setFormData(res.form);
      })
      .catch((err) => {
        setError(err.message || 'Form not found or no longer active.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (answers: Record<string, any>) => {
    await api.submitPublicForm(slug, answers, {
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Form Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'This form could not be located. It may have been archived or unpublished by the creator.'}
          </p>
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go to FormForge</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {onGoHome && (
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>FormForge Platform</span>
            </button>
            <div className="inline-flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secure Respondent Portal</span>
            </div>
          </div>
        )}

        <FormRenderer
          schema={formData.schema}
          title={formData.title}
          description={formData.description}
          version={formData.version}
          settings={formData.settings}
          onSubmit={handleSubmit}
        />

        <div className="text-center text-[11px] text-slate-400 pt-4">
          Powered by <strong className="text-slate-600">FormForge</strong> — Reusable Form Platform
        </div>
      </div>
    </div>
  );
};
