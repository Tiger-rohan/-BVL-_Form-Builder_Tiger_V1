import React, { useState } from 'react';
import { FormDefinition } from '../../types/form.ts';
import { FormRenderer } from '../renderer/FormRenderer.tsx';
import { Monitor, Smartphone, X, Eye } from 'lucide-react';

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: FormDefinition;
  title: string;
  description?: string;
  version: number;
  settings?: any;
}

export const FormPreviewModal: React.FC<FormPreviewModalProps> = ({
  isOpen,
  onClose,
  schema,
  title,
  description,
  version,
  settings,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen) return null;

  const handleSimulateSubmit = async (data: Record<string, any>) => {
    // In preview mode, simulate realistic submission delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log('Simulated preview submission payload:', data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-100 rounded-2xl shadow-2xl border border-slate-700/30 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">Interactive Form Preview</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Schema v{version}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Test respondent layout and validations in real time</p>
            </div>
          </div>

          {/* Device Toggles */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                device === 'desktop'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                device === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile (375px)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
          <div
            className={`w-full transition-all duration-300 ${
              device === 'mobile'
                ? 'max-w-[390px] border-[10px] border-slate-900 rounded-[38px] shadow-2xl p-2 bg-slate-900'
                : 'max-w-2xl'
            }`}
          >
            <div className={device === 'mobile' ? 'rounded-[26px] overflow-hidden bg-white max-h-[720px] overflow-y-auto' : ''}>
              <FormRenderer
                schema={schema}
                title={title}
                description={description}
                version={version}
                settings={settings}
                onSubmit={handleSimulateSubmit}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
