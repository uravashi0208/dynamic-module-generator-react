import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit2, ArrowLeft, Loader2, Database,
  ChevronLeft, ChevronRight, Search, RefreshCw, Eye,
} from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import clsx from 'clsx';

/** Render a cell value based on field type */
const CellValue = ({ value, fieldType }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300 italic text-xs">—</span>;
  }
  if (fieldType === 'checkbox') {
    return (
      <span className={clsx('badge', value ? 'badge-success' : 'badge-danger')}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }
  if (fieldType === 'color') {
    return (
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded border border-slate-200 inline-block" style={{ backgroundColor: value }} />
        <span className="text-xs font-mono text-slate-600">{value}</span>
      </div>
    );
  }
  if (fieldType === 'url') {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs truncate max-w-[140px] block">
        {value}
      </a>
    );
  }
  if (fieldType === 'password') {
    return <span className="font-mono text-slate-400 text-xs">••••••••</span>;
  }
  if (fieldType === 'date') {
    try { return <span className="text-xs text-slate-700">{new Date(value).toLocaleDateString()}</span>; }
    catch { return <span className="text-xs text-slate-700">{String(value)}</span>; }
  }
  if (fieldType === 'datetime-local') {
    try { return <span className="text-xs text-slate-700">{new Date(value).toLocaleString()}</span>; }
    catch { return <span className="text-xs text-slate-700">{String(value)}</span>; }
  }
  if (fieldType === 'textarea') {
    const str = String(value);
    return <span className="text-xs text-slate-700 line-clamp-2">{str.length > 80 ? str.slice(0, 80) + '…' : str}</span>;
  }
  return <span className="text-xs text-slate-700 truncate max-w-[140px] block">{String(value)}</span>;
};

const ModuleDataPage = () => {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();

  const { modules, fetchModules } = useModuleStore();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Find module definition from store
  const module = modules.find(
    (m) => m.moduleSlug === moduleSlug || m.moduleName?.toLowerCase() === moduleSlug?.toLowerCase()
  );

  useEffect(() => {
    if (!modules.length) fetchModules();
  }, []);

  useEffect(() => {
    if (moduleSlug) {
      fetchRecords(moduleSlug, page);
    }
  }, [moduleSlug, page]);

  const handleDelete = async (id, label) => {
    if (window.confirm(`Delete this record${label ? ` "${label}"` : ''}? This cannot be undone.`)) {
      await deleteRecord(moduleSlug, id);
    }
  };

  const getFirstLabelValue = (record) => {
    if (!module?.fields?.length) return null;
    const first = module.fields[0];
    return record[first.fieldName] ? String(record[first.fieldName]) : null;
  };

  const filteredRecords = search.trim()
    ? records.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : records;

  const fields = module?.fields || [];
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/modules')} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {module?.moduleName || moduleSlug}
              </h1>
              <p className="text-xs text-slate-400 font-mono">{moduleSlug}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecords(moduleSlug, page)}
            className="btn-ghost"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/data/${moduleSlug}/new`)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New Record
          </button>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span className="badge badge-info">{pagination?.total ?? records.length} total records</span>
        <span className="badge bg-slate-50 text-slate-600 border border-slate-200">{fields.length} fields</span>
      </div>

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9 pr-3"
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No records yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {search ? 'No records match your search.' : 'Create the first record for this module.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate(`/data/${moduleSlug}/new`)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" /> New Record
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  {fields.map((f) => (
                    <th
                      key={f.fieldName}
                      className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {f.fieldLabel}
                      {f.validations?.required && <span className="text-red-400 ml-0.5">*</span>}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((record, idx) => (
                  <tr
                    key={record._id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {((page - 1) * (pagination?.limit || 20)) + idx + 1}
                    </td>
                    {fields.map((f) => (
                      <td key={f.fieldName} className="px-4 py-3 max-w-[200px]">
                        <CellValue value={record[f.fieldName]} fieldType={f.fieldType} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/data/${moduleSlug}/${record._id}/edit`)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(record._id, getFirstLabelValue(record))}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {pagination?.total} records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost py-1.5 px-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={clsx(
                    'w-8 h-8 text-xs rounded-lg font-medium transition-colors',
                    pg === page
                      ? 'bg-brand-600 text-white shadow-glow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost py-1.5 px-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDataPage;
