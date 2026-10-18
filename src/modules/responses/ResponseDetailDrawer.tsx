import React from 'react';
import { SubmissionItem, FormDefinition } from '../../types/form.ts';
import { X, Calendar, Hash, Globe, Trash2, CheckCircle2 } from 'lucide-react';

interface ResponseDetailDrawerProps {
  response: SubmissionItem | null;
  schema: FormDefinition | null;
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const ResponseDetailDrawer: React.FC<ResponseDetailDrawerProps> = ({
  response,
  schema,
  formTitle,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!isOpen || !response) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight">Submission Inspection</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v{response.formVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{formTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Submission ID:</span>
              <span className="font-mono text-slate-800 font-medium">{response.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Submitted At:</span>
              <span className="font-medium text-slate-800">
                {new Date(response.createdAt).toLocaleString()}
              </span>
            </div>
            {response.metadata?.ip && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Respondent IP:</span>
                <span className="font-mono text-slate-800">{response.metadata.ip}</span>
              </div>
            )}
            {response.metadata?.userAgent && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block mb-1">User Agent:</span>
                <span className="text-[11px] font-mono text-slate-600 break-all leading-tight">
                  {response.metadata.userAgent}
                </span>
              </div>
            )}
          </div>

          {/* Form Answers */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recorded Answers
            </h4>

            <div className="space-y-3">
              {schema?.fields.map((field) => {
                const answer =
                  response.data[field.id] !== undefined
                    ? response.data[field.id]
                    : response.data[field.name];

                return (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700">{field.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 capitalize">
                        {field.type}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-slate-900 break-words">
                      {answer === null || answer === undefined || answer === '' ? (
                        <span className="text-xs text-slate-400 italic">No answer provided</span>
                      ) : Array.isArray(answer) ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {answer.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs"
                            >
                              {String(item)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>{String(answer)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this response record permanently?')) {
                await onDelete(response.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Response</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
