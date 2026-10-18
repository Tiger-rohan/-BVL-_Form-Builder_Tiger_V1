import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { FormDefinition } from '../../types/form.ts';
import { FormRenderer } from '../renderer/FormRenderer.tsx';
import { AlertCircle } from 'lucide-react';

interface EmbedFormPageProps {
  slug: string;
}

export const EmbedFormPage: React.FC<EmbedFormPageProps> = ({ slug }) => {
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
        setError(err.message || 'Form unavailable.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (answers: Record<string, any>) => {
    await api.submitPublicForm(slug, answers, {
      embedded: true,
      referrer: document.referrer || 'direct-embed',
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading embedded form...</p>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="p-8 text-center text-slate-500 max-w-sm mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <div className="text-sm font-semibold text-slate-800">Form Unavailable</div>
        <p className="text-xs mt-1 text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 bg-transparent">
      <FormRenderer
        schema={formData.schema}
        title={formData.title}
        description={formData.description}
        version={formData.version}
        settings={formData.settings}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
