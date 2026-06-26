import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit2, Loader2, Database,
  ChevronLeft, ChevronRight, Search, Download,
  SlidersHorizontal, ChevronsUpDown, MoreHorizontal,
} from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import clsx from 'clsx';

// ── Cell renderer ─────────────────────────────────────────────────────────────
const CellValue = ({ value, fieldType }) => {
  if (value === null || value === undefined || value === '')
    return <span className="text-slate-300 italic text-sm">—</span>;

  if (fieldType === 'checkbox') {
    // Array = multi-select checkbox options
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-300 italic text-sm">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              {v}
            </span>
          ))}
        </div>
      );
    }
    // Boolean single checkbox
    return (
      <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  if (fieldType === 'color')
    return (
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded border border-slate-200 inline-block flex-shrink-0"
          style={{ backgroundColor: value }} />
        <span className="text-sm font-mono text-slate-600">{value}</span>
      </div>
    );
  if (fieldType === 'url')
    return (
      <a href={value} target="_blank" rel="noreferrer"
        className="text-indigo-600 hover:underline text-sm truncate max-w-[160px] block">
        {value}
      </a>
    );
  if (fieldType === 'password')
    return <span className="font-mono text-slate-400 text-sm">••••••••</span>;
  if (fieldType === 'date')
    return <span className="text-sm text-slate-600">
      {new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
    </span>;
  if (fieldType === 'datetime-local')
    return <span className="text-sm text-slate-600">{new Date(value).toLocaleString()}</span>;
  if (fieldType === 'number')
    return <span className="text-sm text-slate-700 font-medium">{Number(value).toLocaleString()}</span>;
  if (fieldType === 'textarea') {
    const s = String(value);
    return <span className="text-sm text-slate-600 line-clamp-2">
      {s.length > 80 ? s.slice(0, 80) + '…' : s}
    </span>;
  }
  if (fieldType === 'file') {
    if (!value || value === '') return <span className="text-xs text-slate-400">—</span>;
    // Cloudinary returns full https:// URL — use directly
    // Fallback for legacy local uploads
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value) || value.includes('cloudinary');
    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    const src = value.startsWith('http') ? value : `${API_BASE}${value}`;
    if (isImage) return (
      <a href={src} target="_blank" rel="noreferrer"
        className="block w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-400 transition-all flex-shrink-0 bg-slate-50">
        <img
          src={src}
          alt="file"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style=\"font-size:10px;color:#94a3b8;padding:2px\">err</span>'; }}
        />
      </a>
    );
    const fname = value.split('/').pop();
    return (
      <a href={src} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {fname.length > 20 ? fname.slice(0, 20) + '…' : fname}
      </a>
    );
  }
  return <span className="text-sm text-slate-700">{String(value)}</span>;
};

// ── Action menu ───────────────────────────────────────────────────────────────
const ActionMenu = ({ onEdit, onDelete }) => {
  const [open, setOpen]       = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const ref                   = useRef(null);
  const btnRef                = useRef(null);

  useEffect(() => {
    const closeMenu = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuH = 90;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < menuH) {
        setMenuPos({ top: rect.top - menuH, left: rect.right - 144 });
      } else {
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref}>
      <button ref={btnRef} onClick={handleOpen}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1">
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Edit
          </button>
          <div className="h-px bg-slate-100 mx-2 my-1" />
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── Delete confirmation modal ─────────────────────────────────────────────────
const DeleteModal = ({ label, count, isDeleting, onConfirm, onCancel }) => {
  const isBulk = count > 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center animate-[fadeUp_0.18s_ease]">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          {isBulk ? `Delete ${count} records?` : 'Delete record?'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {isBulk
            ? `${count} records will be permanently deleted and cannot be recovered.`
            : <>{label && <><span className="font-medium text-slate-700">"{label}"</span> </>}will be permanently deleted and cannot be recovered.</>
          }
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200
              rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500
              hover:bg-red-600 disabled:opacity-80 disabled:cursor-not-allowed rounded-xl
              transition-colors flex items-center justify-center gap-2">
            {isDeleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
              : <><Trash2 className="w-4 h-4" /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = ({ colCount, index }) => (
  <tr className="border-b border-slate-50">
    <td className="px-4 py-[18px]">
      <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
    </td>
    {Array.from({ length: colCount }).map((_, j) => (
      <td key={j} className="px-4 py-[18px]">
        <div
          className="h-4 bg-slate-100 rounded animate-pulse"
          style={{ width: `${55 + ((index * 3 + j * 7) % 35)}%`, animationDelay: `${j * 40}ms` }}
        />
      </td>
    ))}
    <td className="px-4 py-[18px]">
      <div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" />
    </td>
    <td className="px-4 py-[18px]">
      <div className="w-6 h-6 bg-slate-100 rounded animate-pulse" />
    </td>
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ModuleDataPage = () => {
  const { moduleSlug } = useParams();
  const navigate       = useNavigate();

  const { modules, fetchModules }                                      = useModuleStore();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();

  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState('asc');

  const [stableRows, setStableRows]             = useState([]);
  const [stablePagination, setStablePagination] = useState(null);
  const [stableCount, setStableCount]           = useState(10);
  const prevModuleSlug                          = useRef(null);

  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);

  const module     = modules.find(
    (m) => m.moduleSlug === moduleSlug ||
           m.moduleName?.toLowerCase().replace(/\s+/g, '-') === moduleSlug
  );
  const fields     = module?.fields || [];
  const moduleName = module?.moduleName || moduleSlug;
  const firstField = fields[0]?.fieldName || '_id';

  useEffect(() => {
    if (!modules.length) fetchModules();
  }, []);

  useEffect(() => {
    if (!moduleSlug) return;
    if (prevModuleSlug.current !== moduleSlug) {
      setStableRows([]);
      setStablePagination(null);
      setStableCount(limit);
      prevModuleSlug.current = moduleSlug;
    }
    setSelected([]);
    fetchRecords(moduleSlug, page, limit);
  }, [moduleSlug, page, limit]);

  useEffect(() => {
    if (!isLoading) {
      if (records.length > 0) {
        setStableRows(records);
        setStableCount(records.length);
      }
      if (pagination) setStablePagination(pagination);
      if (records.length === 0 && pagination) setStableRows([]);
    }
  }, [isLoading, records, pagination]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = (id, label) => setDeleteModal({ id, label, isBulk: false });

  const handleBulkDelete = () => {
    if (!selected.length) return;
    setDeleteModal({ isBulk: true, ids: selected, count: selected.length });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.isBulk) {
        for (const id of deleteModal.ids) await deleteRecord(moduleSlug, id);
        setSelected([]);
      } else {
        await deleteRecord(moduleSlug, deleteModal.id);
      }
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  };

  const handleExport = () => {
    if (!records.length) return;
    const headers = Object.keys(records[0]).filter(k => !k.startsWith('_') && k !== '__v');
    const csv = [
      headers.join(','),
      ...records.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${moduleSlug}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const displayPagination = stablePagination || pagination;
  const total      = displayPagination?.total ?? 0;
  const perPage    = displayPagination?.limit || limit;
  const totalPages = Math.ceil(total / perPage) || 1;
  const pageStart  = ((page - 1) * perPage) + 1;
  const pageEnd    = Math.min(page * perPage, total);

  let displayed = search.trim()
    ? records.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : [...records];

  if (sortField) {
    displayed.sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  const allSelected = displayed.length > 0 && selected.length === displayed.length;
  const toggleAll   = () => setSelected(allSelected ? [] : displayed.map(r => r._id));
  const toggleOne   = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const isFirstLoad = isLoading && stableRows.length === 0;
  const isFading    = isLoading && stableRows.length > 0;
  const isLoaded    = !isLoading;
  const rowsToPaint = isFading ? stableRows : displayed;

  return (
    <div className="space-y-5">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {deleteModal && (
        <DeleteModal
          label={deleteModal.label}
          count={deleteModal.count}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => !isDeleting && setDeleteModal(null)}
        />
      )}

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{moduleName} List</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage and track all {moduleName.toLowerCase()} records.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-wrap">
          <div>
            <p className="font-semibold text-slate-800">{moduleName} List</p>
            <p className="text-xs text-slate-400 mt-0.5">Track and manage all your records.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.length > 0 && (
              <button onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selected.length})
              </button>
            )}
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => navigate(`/${moduleSlug}/new`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add {moduleName}
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-100">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              {isFading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={isLoading || displayed.length === 0}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-30"
                  />
                </th>
                {fields.map((f) => (
                  <th key={f.fieldName}
                    onClick={() => !isLoading && handleSort(f.fieldName)}
                    className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {f.fieldLabel}
                      <ChevronsUpDown className={clsx('w-3 h-3 transition-colors',
                        sortField === f.fieldName ? 'text-indigo-500' : 'text-slate-300')} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">
                  Created At
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>

            <tbody>
              {/* State 1: First load skeleton */}
              {isFirstLoad && Array.from({ length: stableCount }).map((_, i) => (
                <SkeletonRow key={i} index={i} colCount={fields.length} />
              ))}

              {/* State 2 & 3: Faded old rows OR live rows */}
              {!isFirstLoad && rowsToPaint.map((record) => (
                <tr key={record._id}
                  className={clsx(
                    'border-b border-slate-50 transition-all',
                    isFading
                      ? 'opacity-40 pointer-events-none'
                      : clsx('hover:bg-slate-50/80 group', selected.includes(record._id) && 'bg-indigo-50/40')
                  )}>
                  <td className="px-4 py-[18px]">
                    {isFading
                      ? <div className="w-4 h-4 border-2 border-slate-200 rounded" />
                      : <input type="checkbox"
                          checked={selected.includes(record._id)}
                          onChange={() => toggleOne(record._id)}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                    }
                  </td>
                  {fields.map((f) => (
                    <td key={f.fieldName} className="px-4 py-[18px] max-w-[200px]">
                      <CellValue value={record[f.fieldName]} fieldType={f.fieldType} />
                    </td>
                  ))}
                  <td className="px-4 py-[18px] text-left text-sm text-slate-500 whitespace-nowrap">
                    {record.createdAt
                      ? new Date(record.createdAt).toLocaleDateString('en-US', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-[18px]">
                    {!isFading && (
                      <ActionMenu
                        onEdit={() => navigate(`/${moduleSlug}/${record._id}/edit`)}
                        onDelete={() => handleDelete(record._id, record[firstField])}
                      />
                    )}
                  </td>
                </tr>
              ))}

              {/* State 4: Empty */}
              {isLoaded && displayed.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 3}>
                    <div className="text-center py-16">
                      <Database className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-500">
                        {search ? 'No records match your search.' : 'No records yet.'}
                      </p>
                      {!search && (
                        <button onClick={() => navigate(`/${moduleSlug}/new`)}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                          <Plus className="w-4 h-4" /> Add {moduleName}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                Showing {pageStart} to {pageEnd} of {total}
              </p>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer">
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                  text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    disabled={isLoading}
                    className={clsx('w-8 h-8 text-sm rounded-lg font-medium transition-colors',
                      pg === page
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60')}>
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                  text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ModuleDataPage;