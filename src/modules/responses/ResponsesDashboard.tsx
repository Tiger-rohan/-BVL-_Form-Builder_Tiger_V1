import React, { useEffect, useState, useTransition } from 'react';
import { FormDefinition, SubmissionItem } from '../../types/form.ts';
import { api } from '../../lib/api.ts';
import { ResponseDetailDrawer } from './ResponseDetailDrawer.tsx';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Layers,
  Inbox,
  Eye,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface ResponsesDashboardProps {
  formId: string;
  onBack: () => void;
  onOpenBuilder: (formId: string) => void;
}

export const ResponsesDashboard: React.FC<ResponsesDashboardProps> = ({
  formId,
  onBack,
  onOpenBuilder,
}) => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [schema, setSchema] = useState<FormDefinition | null>(null);
  const [responses, setResponses] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected for drawer
  const [selectedResponse, setSelectedResponse] = useState<SubmissionItem | null>(null);

  const loadData = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getResponses(formId, {
        search: search.trim() || undefined,
        version: selectedVersion ? Number(selectedVersion) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: targetPage,
        limit: 50,
      });

      setFormTitle(res.formTitle);
      setSchema(res.schema);
      setResponses(res.responses);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch response records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [formId, selectedVersion, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedVersion('');
    setStartDate('');
    setEndDate('');
  };

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      await api.downloadCsv(formId, formTitle || 'form');
    } catch (err: any) {
      alert('Failed to download CSV: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      await api.deleteResponse(formId, id);
      setResponses(responses.filter((r) => r.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert('Failed to delete response: ' + err.message);
    }
  };

  // Extract up to 4 key question columns for concise table display
  const tableColumns = schema?.fields.slice(0, 4) || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {formTitle || 'Form Responses'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {total} Submissions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit, search, inspect individual answers, and export to CSV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenBuilder(formId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <span>Edit Form Schema</span>
            </button>

            <button
              type="button"
              disabled={downloading || total === 0}
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Exporting...' : 'Export to CSV'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search response values..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </form>

          {/* Form Version Select */}
          <div className="relative">
            <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700"
            >
              <option value="">All Schema Versions</option>
              <option value="1">Version 1</option>
              <option value="2">Version 2</option>
              <option value="3">Version 3</option>
              <option value="4">Version 4</option>
            </select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-700"
            />
          </div>

          {/* Refresh & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(page)}
              className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Responses Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Fetching submissions...</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No responses recorded yet</h4>
            <p className="text-xs max-w-sm mx-auto text-slate-400">
              Publish your form and share the public URL or embed it on your website to start receiving field submissions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-3">Ver</th>
                  {tableColumns.map((col) => (
                    <th key={col.id} className="py-3 px-4 max-w-[200px] truncate">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        v{row.formVersion}
                      </span>
                    </td>
                    {tableColumns.map((col) => {
                      const val =
                        row.data[col.id] !== undefined
                          ? row.data[col.id]
                          : row.data[col.name];

                      return (
                        <td key={col.id} className="py-3.5 px-4 max-w-[200px] truncate text-slate-900">
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-slate-300 italic">—</span>
                          ) : Array.isArray(val) ? (
                            val.join(', ')
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedResponse(row)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Inspect Response"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this submission?')) {
                              handleDeleteResponse(row.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Response"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({total} total submissions)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => loadData(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => loadData(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response Detail Drawer */}
      <ResponseDetailDrawer
        response={selectedResponse}
        schema={schema}
        formTitle={formTitle}
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        onDelete={handleDeleteResponse}
      />
    </div>
  );
};
