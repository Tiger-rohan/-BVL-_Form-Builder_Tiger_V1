import React, { useEffect, useState } from 'react';
import { FormVersionItem } from '../../types/form.ts';
import { api } from '../../lib/api.ts';
import { History, Calendar, CheckCircle, FileText, Code2, AlertCircle } from 'lucide-react';

interface VersionHistoryModalProps {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
  currentVersion: number;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  formId,
  isOpen,
  onClose,
  currentVersion,
}) => {
  const [versions, setVersions] = useState<FormVersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    api
      .getVersions(formId)
      .then((res) => {
        setVersions(res.versions);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load version history.');
      })
      .finally(() => setLoading(false));
  }, [formId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Schema Version History</h3>
              <p className="text-xs text-slate-500">Immutable snapshots of published definitions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <div>Retrieving version records...</div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No published version snapshots recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => {
                const isCurrent = ver.version_number === currentVersion;
                return (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Version {ver.version_number}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            Current Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ver.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-2">
                      {ver.changelog || 'Published iteration snapshot.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100/80">
                      <span>Submissions linked: {ver.submission_count || 0}</span>
                      <span className="text-slate-400 font-mono text-[10px]">ID: {ver.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
