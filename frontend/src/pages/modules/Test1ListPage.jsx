/**
 * Test1ListPage.jsx  —  AUTO-GENERATED (2026-06-18T05:45:04.946Z)
 * Module: Test1  |  Slug: test1
 *
 * Safe to edit — regenerated only when module is deleted + recreated.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit2, Loader2, Database,
  ChevronLeft, ChevronRight, Search, Download,
  SlidersHorizontal, ChevronsUpDown, MoreHorizontal,
} from 'lucide-react';
import useModuleDataStore from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = 'test1';
const MODULE_NAME = 'Test1';

const CellValue = ({ value, fieldType }) => {
  if (value === null || value === undefined || value === '')
    return <span className="text-slate-300 italic text-sm">—</span>;
  if (fieldType === 'checkbox')
    return (
      <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  if (fieldType === 'color')
    return (
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded border border-slate-200 inline-block flex-shrink-0" style={{ backgroundColor: value }} />
        <span className="text-sm font-mono text-slate-600">{value}</span>
      </div>
    );
  if (fieldType === 'url')
    return <a href={value} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm truncate max-w-[160px] block">{value}</a>;
  if (fieldType === 'password')
    return <span className="font-mono text-slate-400 text-sm">••••••••</span>;
  if (fieldType === 'date')
    return <span className="text-sm text-slate-600">{new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
  if (fieldType === 'datetime-local')
    return <span className="text-sm text-slate-600">{new Date(value).toLocaleString()}</span>;
  if (fieldType === 'number')
    return <span className="text-sm text-slate-700 font-medium">{Number(value).toLocaleString()}</span>;
  if (fieldType === 'textarea') {
    const s = String(value);
    return <span className="text-sm text-slate-600 line-clamp-2">{s.length > 80 ? s.slice(0, 80) + '...' : s}</span>;
  }
  return <span className="text-sm text-slate-700">{String(value)}</span>;
};

// ── Action menu — smart upward/downward positioning ──────────────────────────
const ActionMenu = ({ onEdit, onDelete }) => {
  const [open, setOpen]   = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref    = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 120);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={ref}>
      <button ref={btnRef} onClick={handleOpen}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className={clsx(
          "absolute right-0 z-50 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1",
          dropUp ? "bottom-8" : "top-8"
        )}>
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

const Test1ListPage = () => {
  const navigate = useNavigate();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => { setSelected([]); fetchRecords(MODULE_SLUG, page, limit); }, [page, limit]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = async (id, label) => {
    if (window.confirm('Delete' + (label ? ' "' + label + '"' : ' this record') + '? This cannot be undone.'))
      await deleteRecord(MODULE_SLUG, id);
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (window.confirm('Delete ' + selected.length + ' selected record(s)? This cannot be undone.')) {
      for (const id of selected) await deleteRecord(MODULE_SLUG, id);
      setSelected([]);
    }
  };

  const handleExport = () => {
    if (!records.length) return;
    const headers = Object.keys(records[0]).filter(k => !k.startsWith('_') && k !== '__v');
    const csv = [headers.join(','),
      ...records.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = MODULE_SLUG + '.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Client-side filter + sort
  let displayed = search.trim()
    ? records.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(search.toLowerCase())))
    : [...records];

  if (sortField) {
    displayed.sort((a, b) => {
      const av = a[sortField] ?? ''; const bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  const total      = pagination?.total ?? records.length;
  const perPage    = pagination?.limit || limit;
  const totalPages = Math.ceil(total / perPage);
  const allSelected = displayed.length > 0 && selected.length === displayed.length;

  const toggleAll = () => setSelected(allSelected ? [] : displayed.map(r => r._id));
  const toggleOne = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const pageStart = ((page - 1) * perPage) + 1;
  const pageEnd   = Math.min(page * perPage, total);

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{MODULE_NAME} List</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage and track all {MODULE_NAME.toLowerCase()} records.</p>
      </div>

      {/* ── Card ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-wrap">
          <div>
            <p className="font-semibold text-slate-800">{MODULE_NAME} List</p>
            <p className="text-xs text-slate-400 mt-0.5">Track and manage all your records.</p>
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={() => navigate('/test1/new')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add {MODULE_NAME}
            </button>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-100">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">{search ? 'No records match your search.' : 'No records yet.'}</p>
            {!search && (
              <button onClick={() => navigate('/test1/new')}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg mx-auto transition-colors">
                <Plus className="w-4 h-4" /> Add {MODULE_NAME}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                  </th>
              <th
                className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort('names')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-left">Created At</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayed.map((record, idx) => (
                  <tr key={record._id}
                    className={clsx('transition-colors hover:bg-slate-50/80 group', selected.includes(record._id) && 'bg-indigo-50/40')}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.includes(record._id)} onChange={() => toggleOne(record._id)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                    </td>
                    <td className="px-4 py-4">
                      <CellValue value={record.name} fieldType="text" />
                    </td>
                    <td className="px-4 py-4 text-left text-sm text-slate-500 whitespace-nowrap">
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <ActionMenu
                        record={record}
                        onEdit={() => navigate('/test1/' + record._id + '/edit')}
                        onDelete={() => handleDelete(record._id, record.names)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────── */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-wrap gap-3">
            {/* Left: count + per-page selector */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                Showing {pageStart} to {pageEnd} of {total}
              </p>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            {/* Right: page buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={clsx('w-8 h-8 text-sm rounded-lg font-medium transition-colors',
                      pg === page
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50')}>
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test1ListPage;
