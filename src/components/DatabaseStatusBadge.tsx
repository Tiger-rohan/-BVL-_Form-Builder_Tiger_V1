import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Layers, Table, ExternalLink } from 'lucide-react';
import { api } from '../lib/api.ts';
import { DatabaseExplorerModal } from './DatabaseExplorerModal.tsx';

export const DatabaseStatusBadge: React.FC = () => {
  const [dbState, setDbState] = useState<{
    loading: boolean;
    connected: boolean;
    type: string;
    target: string;
    autoMigrated: boolean;
    latencyMs: number;
    tables: string[];
    stats?: { users: number; forms: number; form_versions: number; submissions: number };
    error?: string;
  }>({
    loading: true,
    connected: true,
    type: 'Embedded PostgreSQL (PGlite)',
    target: './data/postgres',
    autoMigrated: true,
    latencyMs: 1,
    tables: ['users', 'forms', 'form_versions', 'submissions', 'integrations', 'delivery_logs'],
  });

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.getHealth();
      setDbState({
        loading: false,
        connected: res.database?.connected ?? true,
        type: res.database?.type || 'Embedded PostgreSQL (PGlite)',
        target: res.database?.target || './data/postgres',
        autoMigrated: res.database?.autoMigrated ?? true,
        latencyMs: res.database?.latencyMs ?? 1,
        tables: res.database?.tables || [],
        stats: res.database?.stats,
        error: res.database?.error,
      });
    } catch (err: any) {
      setDbState((prev) => ({
        ...prev,
        loading: false,
        connected: false,
        error: err.message || 'Cannot reach database',
      }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const isExternal = dbState.type.toLowerCase().includes('external') || dbState.type.toLowerCase().includes('supabase');

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
            dbState.connected
              ? isExternal
                ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
          }`}
          title="Click to view live database connection & auto-migration status"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dbState.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <Database className="w-3.5 h-3.5 opacity-80" />
          <span className="hidden sm:inline">
            {dbState.connected
              ? isExternal
                ? 'Cloud Database'
                : 'Database Ready'
              : 'DB Offline'}
          </span>
        </button>

        {isPopoverOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsPopoverOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">Database Status</span>
                </div>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                  title="Refresh Status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbState.loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Connection Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      dbState.connected ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {dbState.connected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected ({dbState.latencyMs}ms)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Disconnected</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Database Engine:</span>
                  <span className="font-semibold text-slate-800">{dbState.type}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Location / Host:</span>
                  <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[170px]" title={dbState.target}>
                    {dbState.target}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Manual SQL Required:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    0 Queries (Auto-Migrated)
                  </span>
                </div>

                {dbState.stats && (
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
                    <span>Records in DB:</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {dbState.stats.forms} Forms • {dbState.stats.submissions} Submissions
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setIsExplorerOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition text-xs"
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Database Table Explorer</span>
              </button>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">💡 Why is data in Local PGlite?</span>
                <p className="text-[10px] text-slate-500 leading-snug">
                  By default, FormForge saves data to <code>./data/postgres</code> so you don't need to configure any external DB. To connect your Supabase or Cloud SQL database, set <code>DATABASE_URL</code> in <code>.env</code>.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <DatabaseExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
      />
    </>
  );
};
