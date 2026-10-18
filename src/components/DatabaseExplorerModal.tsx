import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Table,
  Layers,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Server,
  FileCode,
} from 'lucide-react';
import { api } from '../lib/api.ts';

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseExplorerModal: React.FC<DatabaseExplorerModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [activeTable, setActiveTable] = useState<string>('forms');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const diag = await api.getDatabaseDiagnostics();
      setDiagnostics(diag);
    } catch (err: any) {
      setDiagnostics({
        connected: false,
        error: err.message || 'Failed to connect to database',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRows = async (table: string) => {
    setRowsLoading(true);
    try {
      const res = await api.getTableRows(table);
      setTableRows(res.rows || []);
    } catch {
      setTableRows([]);
    } finally {
      setRowsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
      fetchRows(activeTable);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTable) {
      fetchRows(activeTable);
    }
  }, [activeTable]);

  if (!isOpen) return null;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Database Inspector & Connection Center</h2>
                {diagnostics?.connected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Inspect live database tables, verify connection target, and view recorded rows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchDiagnostics();
                fetchRows(activeTable);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${loading || rowsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Diagnostic Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-500 block text-[10px]">ACTIVE ENGINE</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-600" />
                {diagnostics?.engine === 'external-postgresql'
                  ? 'External PostgreSQL / Supabase'
                  : 'Embedded PostgreSQL (PGlite)'}
              </span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">STORAGE LOCATION / HOST</span>
              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {diagnostics?.target || 'Checking...'}
              </span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px]">ROUNDTRIP LATENCY</span>
              <span className="font-semibold text-emerald-700">
                {diagnostics?.latencyMs ?? 1} ms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Migrated (0 Manual SQL Queries)</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Table Selector Sidebar */}
          <div className="w-full sm:w-56 bg-slate-50/70 border-r border-slate-200 p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider hidden sm:block">
              Database Tables
            </span>
            {[
              { id: 'forms', label: 'forms', count: diagnostics?.stats?.forms ?? 0 },
              { id: 'submissions', label: 'submissions', count: diagnostics?.stats?.submissions ?? 0 },
              { id: 'users', label: 'users', count: diagnostics?.stats?.users ?? 0 },
              { id: 'form_versions', label: 'form_versions', count: diagnostics?.stats?.form_versions ?? 0 },
            ].map((tbl) => (
              <button
                key={tbl.id}
                onClick={() => setActiveTable(tbl.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  activeTable === tbl.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5" />
                  <span>{tbl.label}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTable === tbl.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tbl.count}
                </span>
              </button>
            ))}

            {/* Help Callout */}
            <div className="mt-auto hidden sm:block p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
              <span className="font-bold block">💡 Where is data stored?</span>
              <p className="text-[10px] text-blue-800 leading-tight">
                {diagnostics?.engine === 'external-postgresql'
                  ? 'Connected to your external PostgreSQL database.'
                  : 'Currently stored in local disk (./data/postgres). To point to Supabase, set DATABASE_URL in .env.'}
              </p>
            </div>
          </div>

          {/* Table Data Viewer */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <span>Table: <span className="font-mono text-emerald-700">{activeTable}</span></span>
                </h3>
                <p className="text-xs text-slate-500">
                  Showing latest {tableRows.length} rows recorded in database
                </p>
              </div>

              {diagnostics?.engine !== 'external-postgresql' && (
                <button
                  onClick={() => {
                    copy(
                      'DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres',
                      'env_example'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                  title="Copy example connection string"
                >
                  {copiedText === 'env_example' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'env_example' ? 'Copied Example!' : 'How to connect external DB'}</span>
                </button>
              )}
            </div>

            {rowsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs">Querying database rows...</span>
              </div>
            ) : tableRows.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Table className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-800">
                  No records in table `{activeTable}` yet
                </span>
                <p className="text-xs text-slate-500 max-w-sm">
                  {activeTable === 'forms'
                    ? 'Click "+ New Form" on the dashboard to create your first form in the database!'
                    : activeTable === 'submissions'
                    ? 'Submit a published form to see live submission rows populate here!'
                    : 'Records will appear here as you use the application.'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-mono text-[10px]">
                      <tr>
                        {Object.keys(tableRows[0] || {}).map((col) => (
                          <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tableRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          {Object.entries(row).map(([k, val], cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3 py-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap max-w-xs truncate"
                              title={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            >
                              {typeof val === 'object' && val !== null
                                ? JSON.stringify(val)
                                : String(val ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Guidance on connecting external database */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                Want to connect your own Supabase or external PostgreSQL database?
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Add <code>DATABASE_URL</code> to your <code>.env</code> file:
              </p>
              <pre className="p-2.5 bg-slate-950 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto">
{`DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"`}
              </pre>
              <p className="text-[10px] text-slate-400">
                FormForge will automatically connect, auto-create all tables in your external database on boot, and route all queries there!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
