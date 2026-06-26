/**
 * feFileGenerator.js
 *
 * Generates FE JSX page files when a module is created/updated/deleted.
 * Works in BOTH local development and production (Render persistent disk).
 *
 * Path resolution order:
 *   1. FE_SRC_DIR env variable (set by Render with persistent disk path)
 *   2. Sibling fe/ or frontend/ folder (local development)
 */

const fs     = require('fs');
const path   = require('path');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Path to fe/src/pages/modules — resolved from env or filesystem
const findFePagesDir = () => {
  // 1. Production: use env variable (Render persistent disk)
  if (process.env.FE_SRC_DIR) {
    const dir = path.join(process.env.FE_SRC_DIR, 'pages', 'modules');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  // 2. Local: walk up from __dirname to find fe/frontend sibling
  const candidates = [
    path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'pages', 'modules'),
    path.join(__dirname, '..', '..', '..', 'fe',       'src', 'pages', 'modules'),
    path.join(__dirname, '..', '..', 'fe',             'src', 'pages', 'modules'),
    path.join(__dirname, '..', '..', 'frontend',       'src', 'pages', 'modules'),
  ];
  for (const c of candidates) {
    const parent = path.dirname(c);
    if (fs.existsSync(parent)) {
      fs.mkdirSync(c, { recursive: true });
      return c;
    }
  }
  return null;
};

// rebuildFrontend — no-op in production (generic ModuleDataPage handles all modules)
// FE file generation is for local dev only — static files committed to git
const rebuildFrontend = () => {};

const toPascal = (str) =>
  str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
     .replace(/^(.)/, (c) => c.toUpperCase());

// ── List Page template ────────────────────────────────────────────────────────
const makeListPage = (moduleName, moduleSlug, fields) => {
  const Pascal = toPascal(moduleName);

  const colHeaders = fields.map(f =>
    `              <th\n` +
    `                className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"\n` +
    `                onClick={() => handleSort('${f.fieldName}')}\n` +
    `              >\n` +
    `                <div className="flex items-center gap-1">\n` +
    `                  ${f.fieldLabel}\n` +
    `                  <ChevronsUpDown className="w-3 h-3 text-slate-400" />\n` +
    `                </div>\n` +
    `              </th>`
  ).join('\n');

  const colCells = fields.map(f =>
    `                    <td className="px-4 py-4">\n` +
    `                      <CellValue value={record.${f.fieldName}} fieldType="${f.fieldType}" />\n` +
    `                    </td>`
  ).join('\n');

  const firstField = fields[0]?.fieldName || '_id';

  return `/**
 * ${Pascal}ListPage.jsx  —  AUTO-GENERATED (${new Date().toISOString()})
 * Module: ${moduleName}  |  Slug: ${moduleSlug}
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

const MODULE_SLUG = '${moduleSlug}';
const MODULE_NAME = '${moduleName}';

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

const ActionMenu = ({ onEdit, onDelete }) => {
  const [open, setOpen]     = useState(false);
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

const ${Pascal}ListPage = () => {
  const navigate = useNavigate();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();
  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(10);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState('asc');

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
    ].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = MODULE_SLUG + '.csv'; a.click();
    URL.revokeObjectURL(url);
  };

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
  const toggleAll  = () => setSelected(allSelected ? [] : displayed.map(r => r._id));
  const toggleOne  = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const pageStart  = ((page - 1) * perPage) + 1;
  const pageEnd    = Math.min(page * perPage, total);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{MODULE_NAME} List</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage and track all {MODULE_NAME.toLowerCase()} records.</p>
      </div>

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
            <button onClick={() => navigate('/${moduleSlug}/new')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add {MODULE_NAME}
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-100">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
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
              <button onClick={() => navigate('/${moduleSlug}/new')}
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
${colHeaders}
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">Created At</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayed.map((record) => (
                  <tr key={record._id}
                    className={clsx('transition-colors hover:bg-slate-50/80 group', selected.includes(record._id) && 'bg-indigo-50/40')}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.includes(record._id)} onChange={() => toggleOne(record._id)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                    </td>
${colCells}
                    <td className="px-4 py-4 text-right text-sm text-slate-500 whitespace-nowrap">
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <ActionMenu
                        onEdit={() => navigate('/${moduleSlug}/' + record._id + '/edit')}
                        onDelete={() => handleDelete(record._id, record.${firstField})}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">Showing {pageStart} to {pageEnd} of {total}</p>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer">
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={clsx('w-8 h-8 text-sm rounded-lg font-medium transition-colors',
                      pg === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50')}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ${Pascal}ListPage;
`;
};

// ── Form Page ────────────────────────────────────────────────────────────────
const makeFormPage = (moduleName, moduleSlug, fields) => {
  const Pascal = toPascal(moduleName);

  const fieldBlocks = fields.map(f => {
    const isFullWidth = ['textarea','file','checkbox','radio'].includes(f.fieldType);
    const reqRule = f.validations?.required ? `{ required: '${f.fieldLabel} is required' }` : '{}';

    let input = '';
    switch (f.fieldType) {
      case 'textarea':
        input = `<textarea {...register('${f.fieldName}', ${reqRule})} rows={4} placeholder="${f.placeholder || `Enter ${f.fieldLabel}...`}" className={clsx('input-field resize-none', errors.${f.fieldName} && 'input-field-error')} />`;
        break;
      case 'checkbox': {
        // Multi-checkbox: each option is its own checkbox; value stored as array of strings
        if (f.options && f.options.length > 0) {
          const checkOpts = f.options.map(o =>
            `              <label key="${o.value}" className="flex items-center gap-3 py-2 cursor-pointer group">\n` +
            `                <input type="checkbox" value="${o.value}" {...register('${f.fieldName}')} className="w-4 h-4 accent-brand-600 rounded border-slate-300 cursor-pointer" />\n` +
            `                <span className="text-sm text-slate-700 group-hover:text-slate-900">${o.label}</span>\n` +
            `              </label>`
          ).join('\n');
          input = `<div className="space-y-0.5 pt-1">\n${checkOpts}\n            </div>`;
        } else {
          input = `<div className="flex items-center gap-3 pt-1"><input type="checkbox" id="${f.fieldName}" value="true" {...register('${f.fieldName}')} className="w-4 h-4 accent-brand-600 rounded" /><label htmlFor="${f.fieldName}" className="text-sm text-slate-700 cursor-pointer">${f.fieldLabel}</label></div>`;
        }
        break;
      }
      case 'radio': {
        if (f.options && f.options.length > 0) {
          const radioOpts = f.options.map(o =>
            `              <label key="${o.value}" className="flex items-center gap-3 py-2 cursor-pointer group">\n` +
            `                <input type="radio" value="${o.value}" {...register('${f.fieldName}', ${reqRule})} className="w-4 h-4 accent-brand-600 cursor-pointer" />\n` +
            `                <span className="text-sm text-slate-700 group-hover:text-slate-900">${o.label}</span>\n` +
            `              </label>`
          ).join('\n');
          input = `<div className="space-y-0.5 pt-1">\n${radioOpts}\n            </div>`;
        } else {
          input = `<input type="radio" {...register('${f.fieldName}', ${reqRule})} className={clsx('input-field', errors.${f.fieldName} && 'input-field-error')} />`;
        }
        break;
      }
      case 'select': {
        const opts = (f.options||[]).map(o => `              <option value="${o.value}">${o.label}</option>`).join('\n');
        input = `<select {...register('${f.fieldName}', ${reqRule})} className={clsx('input-field', errors.${f.fieldName} && 'input-field-error')}>\n              <option value="">Select ${f.fieldLabel}...</option>\n${opts}\n            </select>`;
        break;
      }
      case 'number':
        input = `<input type="number" {...register('${f.fieldName}', { ...${reqRule}, valueAsNumber: true })} placeholder="${f.placeholder || `Enter ${f.fieldLabel}...`}" className={clsx('input-field', errors.${f.fieldName} && 'input-field-error')} />`;
        break;
      case 'color':
        input = `<input type="color" {...register('${f.fieldName}', ${reqRule})} className="h-10 w-20 rounded-lg border border-slate-200 cursor-pointer bg-white p-1" />`;
        break;
      default:
        input = `<input type="${f.fieldType}" {...register('${f.fieldName}', ${reqRule})} placeholder="${f.placeholder || `Enter ${f.fieldLabel}...`}" className={clsx('input-field', errors.${f.fieldName} && 'input-field-error')} />`;
    }

    const labelJsx = f.fieldType !== 'checkbox'
      ? `<label className="label">${f.fieldLabel}${f.validations?.required ? '<span className="text-red-500 ml-0.5">*</span>' : ''}</label>\n          ` : '';

    return `
          {/* ${f.fieldLabel} */}
          <div className="${isFullWidth ? 'sm:col-span-2' : ''}">
            ${labelJsx}${input}
            {errors.${f.fieldName} && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.${f.fieldName}.message}</p>
            )}
          </div>`;
  }).join('\n');

  return `/**
 * ${Pascal}FormPage.jsx  —  AUTO-GENERATED (${new Date().toISOString()})
 * Module: ${moduleName}  |  Slug: ${moduleSlug}
 * Safe to edit — regenerated only when module is deleted + recreated.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import useModuleDataStore from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = '${moduleSlug}';
const MODULE_NAME = '${moduleName}';

const ${Pascal}FormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { fetchRecord, createRecord, updateRecord, isSubmitting } = useModuleDataStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: 'onBlur' });
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchRecord(MODULE_SLUG, id).then((record) => {
        if (record) reset(record);
        setLoading(false);
      });
    }
  }, [id]);

  const onSubmit = async (data) => {
    const result = isEdit
      ? await updateRecord(MODULE_SLUG, id, data)
      : await createRecord(MODULE_SLUG, data);
    if (result.success) navigate('/${moduleSlug}');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/${moduleSlug}')} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow-sm">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit' : 'New'} {MODULE_NAME}</h1>
            <p className="text-xs text-slate-400 font-mono">{isEdit ? 'Update record' : 'Create record'}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
${fieldBlocks}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/${moduleSlug}')} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ${Pascal}FormPage;
`;
};

// ── Registry updater ──────────────────────────────────────────────────────────
const updateRegistry = (pagesDir) => {
  const registryPath = path.join(pagesDir, '_registry.js');
  const files = fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir) : [];

  const modules = files
    .filter(f => f.endsWith('ListPage.jsx'))
    .map(f => {
      const Pascal = f.replace('ListPage.jsx', '');
      const slug = Pascal
        .replace(/([A-Z])/g, (c, offset) => (offset === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`))
        .replace(/^-+/, '');
      return { Pascal, slug };
    });

  const imports = modules.map(m =>
    `import ${m.Pascal}ListPage from './${m.Pascal}ListPage';\nimport ${m.Pascal}FormPage from './${m.Pascal}FormPage';`
  ).join('\n');

  const entries = modules.map(m =>
    `  { slug: '${m.slug}', ListPage: ${m.Pascal}ListPage, FormPage: ${m.Pascal}FormPage },`
  ).join('\n');

  fs.writeFileSync(registryPath,
`/**
 * _registry.js — AUTO-MANAGED by backend on every module create/delete.
 * DO NOT remove the [MODULES_START] / [MODULES_END] markers.
 */

// [MODULES_START]
${imports}
// [MODULES_END]

const registry = [
${entries}
];
export default registry;
`, 'utf8');
};

// ── Public API ────────────────────────────────────────────────────────────────
const generateModulePages = (moduleName, moduleSlug, fields) => {
  // Production: skip file generation — ModuleDataPage (generic) handles all modules
  if (process.env.NODE_ENV === 'production') return;
  try {
    const pagesDir = findFePagesDir();
    if (!pagesDir) { console.warn('[feFileGenerator] FE dir not found — skipping.'); return; }
    const Pascal = toPascal(moduleName);
    fs.writeFileSync(path.join(pagesDir, `${Pascal}ListPage.jsx`), makeListPage(moduleName, moduleSlug, fields), 'utf8');
    fs.writeFileSync(path.join(pagesDir, `${Pascal}FormPage.jsx`), makeFormPage(moduleName, moduleSlug, fields), 'utf8');
    updateRegistry(pagesDir);
    console.log(`[feFileGenerator] Generated ${Pascal}ListPage + ${Pascal}FormPage`);
  } catch (e) {
    console.warn('[feFileGenerator] generateModulePages failed (non-fatal):', e.message);
  }
};

const deleteModulePages = (moduleName) => {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const pagesDir = findFePagesDir();
    if (!pagesDir) return;
    const Pascal = toPascal(moduleName);
    [path.join(pagesDir, `${Pascal}ListPage.jsx`), path.join(pagesDir, `${Pascal}FormPage.jsx`)]
      .forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch(_) {} });
    updateRegistry(pagesDir);
    console.log(`[feFileGenerator] Deleted ${Pascal}ListPage + ${Pascal}FormPage`);
  } catch (e) {
    console.warn('[feFileGenerator] deleteModulePages failed (non-fatal):', e.message);
  }
};

module.exports = { generateModulePages, deleteModulePages };