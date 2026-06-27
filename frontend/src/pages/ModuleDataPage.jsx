import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import api from '../utils/api';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

/* ── Resolve image src from any value ── */
const toImgSrc = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('http')) return value;
  return `${API_BASE}${value}`;
};

const isImageUrl = (url) =>
  url && (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes('/image/upload/') || url.includes('cloudinary'));

/* ── Thumbnail cell ── */
const Thumbnail = ({ src, name }) => {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="rounded-2 d-flex align-items-center justify-content-center"
        style={{ width: 44, height: 44, background: '#f5f5f5', flexShrink: 0 }}>
        <i className="ti ti-photo text-muted" style={{ fontSize: 18 }} />
      </div>
    );
  }
  return (
    <img src={src} alt={name || 'img'} onError={() => setErr(true)}
      className="rounded-2 object-fit-cover border"
      style={{ width: 44, height: 44, flexShrink: 0, background: '#f5f5f5' }} />
  );
};

/* ── Cell value renderer ── */
const CellValue = ({ value, field }) => {
  const ft = field?.fieldType;

  if (value === null || value === undefined || value === '')
    return <span className="text-muted" style={{ fontSize: 13 }}>—</span>;

  if (ft === 'file') {
    const src = toImgSrc(value);
    if (isImageUrl(value)) {
      return <Thumbnail src={src} />;
    }
    const fname = String(value).split('/').pop();
    return (
      <a href={src} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-1 text-primary" style={{ fontSize: 12 }}>
        <i className="ti ti-paperclip" />{fname.length > 18 ? fname.slice(0, 18) + '…' : fname}
      </a>
    );
  }
  if (ft === 'checkbox') {
    if (Array.isArray(value)) {
      if (!value.length) return <span className="text-muted" style={{ fontSize: 12 }}>—</span>;
      return (
        <div className="d-flex flex-wrap gap-1">
          {value.map((v) => (
            <span key={v} className="badge rounded-pill" style={{ fontSize: 10, background: '#FEF2F2', color: '#E66239', border: '1px solid #fecaca' }}>{v}</span>
          ))}
        </div>
      );
    }
    return (
      <span className={`badge rounded-pill ${value ? 'text-bg-success' : 'text-bg-secondary'}`} style={{ fontSize: 10 }}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }
  if (ft === 'color') return (
    <div className="d-flex align-items-center gap-2">
      <span className="rounded border" style={{ width: 16, height: 16, display: 'inline-block', background: value }} />
      <code style={{ fontSize: 11 }}>{value}</code>
    </div>
  );
  if (ft === 'url') return (
    <a href={value} target="_blank" rel="noreferrer" className="text-primary text-truncate d-block" style={{ maxWidth: 120, fontSize: 13 }}>{value}</a>
  );
  if (ft === 'password') return <span className="text-muted font-monospace" style={{ fontSize: 13 }}>••••••••</span>;
  if (ft === 'number')   return <span className="fw-semibold" style={{ fontSize: 13 }}>{Number(value).toLocaleString()}</span>;
  if (ft === 'date')     return <span style={{ fontSize: 13 }}>{new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
  if (ft === 'datetime-local') return <span style={{ fontSize: 13 }}>{new Date(value).toLocaleString()}</span>;
  if (ft === 'textarea') {
    const s = String(value);
    return <span style={{ fontSize: 13 }}>{s.length > 60 ? s.slice(0, 60) + '…' : s}</span>;
  }
  return <span style={{ fontSize: 13 }}>{String(value)}</span>;
};

/* ── Filter Modal ── */
const FilterModal = ({ fields, filters, onApply, onClose }) => {
  const [local, setLocal] = useState({ ...filters });
  const textFields = fields.filter(f => ['text','email','number','select','tel','url'].includes(f.fieldType));
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.35)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content rounded-3 border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="ti ti-filter text-primary" /> Filter Records
            </h6>
            <button onClick={onClose} className="btn-close" />
          </div>
          <div className="modal-body pt-3">
            {textFields.length === 0 ? (
              <p className="text-muted small text-center py-3">No filterable fields available.</p>
            ) : textFields.map((f) => (
              <div className="mb-3" key={f.fieldName}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>{f.fieldLabel}</label>
                {f.fieldType === 'select' ? (
                  <select className="form-select form-select-sm" value={local[f.fieldName] || ''}
                    onChange={(e) => setLocal(p => ({ ...p, [f.fieldName]: e.target.value }))}>
                    <option value="">All</option>
                    {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type="text" className="form-control form-control-sm" placeholder={`Filter by ${f.fieldLabel}…`}
                    value={local[f.fieldName] || ''}
                    onChange={(e) => setLocal(p => ({ ...p, [f.fieldName]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer border-0 pt-0 gap-2">
            <button onClick={() => { setLocal({}); onApply({}); }} className="btn btn-outline-secondary btn-sm">Clear All</button>
            <button onClick={() => onApply(local)} className="btn btn-primary btn-sm px-4">Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── View Modal (read-only record details) ── */
const ViewModal = ({ record, fields, moduleName, onClose, onEdit, canEdit }) => (
  <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.45)' }}>
    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 560 }}>
      <div className="modal-content rounded-3 border-0 shadow">
        <div className="modal-header border-0 pb-0">
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="ti ti-eye text-primary" /> View {moduleName || 'Record'}
          </h6>
          <button onClick={onClose} className="btn-close" />
        </div>
        <div className="modal-body pt-3" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {fields.length === 0 ? (
            <p className="text-muted small text-center py-3">No fields defined for this module.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {fields.map((f) => (
                <div key={f.fieldName} className="d-flex flex-column gap-1 pb-2 border-bottom">
                  <span className="text-muted text-uppercase" style={{ fontSize: 10, letterSpacing: '.05em', fontWeight: 600 }}>
                    {f.fieldLabel}
                  </span>
                  {f.fieldType === 'file' ? (
                    isImageUrl(record[f.fieldName]) ? (
                      <Thumbnail src={toImgSrc(record[f.fieldName])} name={f.fieldLabel} />
                    ) : (
                      <CellValue value={record[f.fieldName]} field={f} />
                    )
                  ) : (
                    <CellValue value={record[f.fieldName]} field={f} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer border-0 pt-0 gap-2">
          <button onClick={onClose} className="btn btn-outline-secondary btn-sm">Close</button>
          {canEdit && (
            <button onClick={onEdit} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-edit" /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ── Skeleton row ── */
const SkeletonRow = ({ hasImage, colCount }) => (
  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
    {hasImage && <td className="px-4 py-3"><div className="rounded-2" style={{ width: 44, height: 44, background: '#f5f5f5' }} /></td>}
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="rounded" style={{ height: 13, background: '#f5f5f5', width: `${55 + (i * 13) % 35}%` }} />
      </td>
    ))}
    <td className="px-4 py-3"><div className="rounded" style={{ height: 13, background: '#f5f5f5', width: 40 }} /></td>
  </tr>
);

/* ══════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════ */
const ModuleDataPage = () => {
  const { moduleSlug } = useParams();
  const navigate       = useNavigate();
  const { modules, fetchModules }                                      = useModuleStore();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();

  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(8);
  const [search, setSearch]         = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [selected, setSelected]     = useState([]);
  const [sortField, setSortField]   = useState(null);
  const [sortDir, setSortDir]       = useState('asc');
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [viewModal, setViewModal]   = useState(null);
  const [stableRows, setStableRows] = useState([]);
  const [stablePagination, setStablePagination] = useState(null);
  const prevSlugRef = useRef(null);

  const module     = modules.find((m) => m.moduleSlug === moduleSlug);
  const fields     = module?.fields || [];
  const moduleName = module?.moduleName || moduleSlug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const firstField = fields[0]?.fieldName || '_id';

  // Detect which field is a "image/file" field — first file field shown as thumbnail column
  const imageField = fields.find(f => f.fieldType === 'file');
  // Non-image fields for table columns — only fields explicitly marked to show in table
  // (default true for older modules saved before this setting existed) so the table
  // doesn't need horizontal scrolling.
  const colFields  = fields.filter(f => f.fieldType !== 'file' && f.showInTable !== false);
  const hasImage   = Boolean(imageField);

  // Module-level action permissions — default everything visible for modules
  // created before this setting existed.
  const permissions = module?.permissions || {};
  const canView   = permissions.canView   !== false;
  const canEdit   = permissions.canEdit   !== false;
  const canDelete = permissions.canDelete !== false;
  const hasAnyAction = canView || canEdit || canDelete;

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  useEffect(() => { if (!modules.length) fetchModules(); }, []);

  useEffect(() => {
    if (!moduleSlug) return;
    if (prevSlugRef.current !== moduleSlug) {
      setStableRows([]); setStablePagination(null); prevSlugRef.current = moduleSlug; setPage(1); setSearch(''); setActiveFilters({});
    }
    setSelected([]);
    fetchRecords(moduleSlug, page, limit);
  }, [moduleSlug, page, limit]);

  useEffect(() => {
    if (!isLoading) {
      setStableRows(records);
      if (pagination) setStablePagination(pagination);
    }
  }, [isLoading, records, pagination]);

  // Client-side search + filter + sort
  let displayed = [...records];
  if (search.trim()) {
    const q = search.toLowerCase();
    displayed = displayed.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
  }
  Object.entries(activeFilters).forEach(([k, v]) => {
    if (v) displayed = displayed.filter(r => String(r[k] ?? '').toLowerCase().includes(v.toLowerCase()));
  });
  if (sortField) {
    displayed.sort((a, b) => {
      const av = a[sortField] ?? '', bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  const handleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.isBulk) { for (const id of deleteModal.ids) await deleteRecord(moduleSlug, id); setSelected([]); }
      else await deleteRecord(moduleSlug, deleteModal.id);
    } finally { setIsDeleting(false); setDeleteModal(null); }
  };

  // Export via BE endpoints
  const handleExcelExport = () => {
    const token = localStorage.getItem('accessToken') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/${moduleSlug}/export/excel?token=${token}`, '_blank');
  };
  const handlePDFExport = () => {
    const token = localStorage.getItem('accessToken') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/${moduleSlug}/export/pdf?token=${token}`, '_blank');
  };

  const allSelected = displayed.length > 0 && selected.length === displayed.length;
  const toggleAll   = () => setSelected(allSelected ? [] : displayed.map(r => r._id));
  const toggleOne   = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const displayPagination = stablePagination || pagination;
  const total      = displayPagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const pageStart  = (page - 1) * limit + 1;
  const pageEnd    = Math.min(page * limit, total);
  const isFirstLoad = isLoading && stableRows.length === 0;
  const isFading    = isLoading && stableRows.length > 0;
  const paintRows   = isFading ? stableRows : displayed;

  /* page numbers to show */
  const pageNums = [];
  const delta = 1;
  for (let p = Math.max(1, page - delta); p <= Math.min(totalPages, page + delta); p++) pageNums.push(p);

  return (
    <div>
      {deleteModal && (
        <ConfirmDeleteModal
          title={deleteModal.isBulk ? `Delete ${deleteModal.count} Records?` : 'Delete Record?'}
          message={
            deleteModal.isBulk
              ? <>{deleteModal.count} records will be <strong>permanently deleted</strong>.</>
              : deleteModal.label
                ? <>Record <strong>"{deleteModal.label}"</strong> will be permanently deleted.</>
                : <>This record will be permanently deleted.</>
          }
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => { if (!isDeleting) setDeleteModal(null); }}
        />
      )}
      {showFilter && (
        <FilterModal fields={fields} filters={activeFilters}
          onApply={(f) => { setActiveFilters(f); setShowFilter(false); setPage(1); }}
          onClose={() => setShowFilter(false)} />
      )}
      {viewModal && (
        <ViewModal record={viewModal} fields={fields} moduleName={module?.moduleName}
          canEdit={canEdit}
          onClose={() => setViewModal(null)}
          onEdit={() => { setViewModal(null); navigate(`/${moduleSlug}/${viewModal._id}/edit`); }} />
      )}

      {/* ── Page Header ── */}
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: 22 }}>{moduleName}</h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Manage your {moduleName?.toLowerCase()} inventory</p>
        </div>
        <button onClick={() => navigate(`/${moduleSlug}/new`)}
          className="btn btn-primary d-flex align-items-center gap-2 px-4">
          <i className="ti ti-plus" /> Add {module?.moduleName || 'Record'}
        </button>
      </div>

      {/* ── Search bar row ── */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
        {/* Search */}
        <div className="position-relative" style={{ maxWidth: 280 }}>
          <i className="ti ti-search position-absolute top-50 translate-middle-y text-muted" style={{ left: '0.75rem', fontSize: 15 }} />
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-control ps-5 rounded-3"
            style={{ fontSize: 13, border: '1.5px solid #e5e5e5', background: '#fafafa' }}
          />
        </div>

        {/* Right buttons */}
        <div className="d-flex align-items-center gap-2">
          {selected.length > 0 && (
            <button onClick={() => setDeleteModal({ isBulk: true, ids: selected, count: selected.length })}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-trash" /> Delete ({selected.length})
            </button>
          )}
          <button onClick={() => setShowFilter(true)}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3"
            style={{ borderRadius: 8, fontSize: 13 }}>
            <i className="ti ti-filter" style={{ fontSize: 14 }} /> Filter
            {activeFilterCount > 0 && (
              <span className="badge rounded-pill ms-1" style={{ fontSize: 9, background: 'var(--primary)', color: '#fff' }}>{activeFilterCount}</span>
            )}
          </button>
          <button onClick={handleExcelExport}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3"
            style={{ borderRadius: 8, fontSize: 13 }}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 14 }} /> Excel
          </button>
          <button onClick={handlePDFExport}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3"
            style={{ borderRadius: 8, fontSize: 13 }}>
            <i className="ti ti-file-type-pdf" style={{ fontSize: 14 }} /> PDF
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-3 overflow-hidden" style={{ border: '1.5px solid #f0f0f0' }}>
        <div className="table-responsive">
          <table className="table mb-0" style={{ borderCollapse: 'collapse' }}>
            {/* ── Head ── */}
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ width: 40, padding: '14px 20px' }}>
                  <input type="checkbox" className="form-check-input" checked={allSelected} onChange={toggleAll}
                    disabled={isLoading || displayed.length === 0} />
                </th>
                {hasImage && (
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>Image</th>
                )}
                {colFields.map((f) => (
                  <th key={f.fieldName} onClick={() => !isLoading && handleSort(f.fieldName)}
                    style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                    {f.fieldLabel ? f.fieldLabel.charAt(0).toUpperCase() + f.fieldLabel.slice(1) : ''}
                    {sortField === f.fieldName ? (
                      <i className={`ti ti-arrow-${sortDir === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: 12, color: 'var(--primary)' }} />
                    ) : (
                      <i className="ti ti-arrows-sort ms-1" style={{ fontSize: 11, color: '#ccc' }} />
                    )}
                  </th>
                ))}
                <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody>
              {isFirstLoad && Array.from({ length: limit }).map((_, i) => (
                <SkeletonRow key={i} hasImage={hasImage} colCount={colFields.length} />
              ))}

              {!isFirstLoad && paintRows.map((record, rowIdx) => {
                const imgSrc = imageField ? toImgSrc(record[imageField.fieldName]) : null;
                const isSelected = selected.includes(record._id);

                return (
                  <tr key={record._id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      opacity: isFading ? 0.4 : 1,
                      background: isSelected ? '#FEF9F7' : '#fff',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? '#FEF9F7' : '#fff'; }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '14px 20px' }}>
                      <input type="checkbox" className="form-check-input" checked={isSelected} onChange={() => toggleOne(record._id)} />
                    </td>

                    {/* Image */}
                    {hasImage && (
                      <td style={{ padding: '14px 20px' }}>
                        <Thumbnail src={isImageUrl(record[imageField?.fieldName]) ? imgSrc : null} name={record[firstField]} />
                      </td>
                    )}

                    {/* Data cells */}
                    {colFields.map((f) => (
                      <td key={f.fieldName} style={{ padding: '14px 20px', maxWidth: 180, verticalAlign: 'middle' }}>
                        <CellValue value={record[f.fieldName]} field={f} />
                      </td>
                    ))}

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!hasAnyAction && <span className="text-muted" style={{ fontSize: 12 }}>—</span>}
                      {canView && (
                        <button onClick={() => setViewModal(record)}
                          className="btn p-0 border-0 bg-transparent me-3"
                          title="View"
                          style={{ color: '#a0a0a0', transition: 'color .15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}>
                          <i className="ti ti-eye" style={{ fontSize: 17 }} />
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => navigate(`/${moduleSlug}/${record._id}/edit`)}
                          className="btn p-0 border-0 bg-transparent me-3"
                          title="Edit"
                          style={{ color: '#a0a0a0', transition: 'color .15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}>
                          <i className="ti ti-edit" style={{ fontSize: 17 }} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteModal({ id: record._id, label: record[firstField], isBulk: false })}
                          className="btn p-0 border-0 bg-transparent"
                          title="Delete"
                          style={{ color: '#a0a0a0', transition: 'color .15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}>
                          <i className="ti ti-trash" style={{ fontSize: 17 }} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {!isLoading && displayed.length === 0 && (
                <tr>
                  <td colSpan={colFields.length + (hasImage ? 3 : 2)} className="text-center py-5">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                      style={{ width: 56, height: 56, background: '#FEF2F2' }}>
                      <i className="ti ti-package" style={{ fontSize: 24, color: 'var(--primary)' }} />
                    </div>
                    <p className="fw-semibold mb-1" style={{ fontSize: 14 }}>
                      {search || activeFilterCount > 0 ? 'No records match your search' : `No ${moduleName} records yet`}
                    </p>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                      {search || activeFilterCount > 0
                        ? 'Try adjusting your filters or search term'
                        : `Add your first ${moduleName?.toLowerCase()} to get started`}
                    </p>
                    {!search && !activeFilterCount && (
                      <button onClick={() => navigate(`/${moduleSlug}/new`)} className="btn btn-primary btn-sm px-4">
                        <i className="ti ti-plus me-1" /> Add {module?.moduleName || 'Record'}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ borderTop: '1.5px solid #f0f0f0', background: '#fff' }}>
            {/* Left: showing text */}
            <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
              Showing {moduleName?.toLowerCase() || 'record'} per page
            </p>

            {/* Right: pagination controls */}
            <div className="d-flex align-items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-outline-secondary btn-sm px-3 py-2"
                style={{ borderTopLeftRadius: 6,borderBottomLeftRadius: 6, fontSize: 13, borderColor: '#e5e5e5' }}>
                Previous
              </button>

              {/* First page if gap */}
              {pageNums[0] > 1 && (
                <>
                  <button onClick={() => setPage(1)} className="btn btn-sm px-3 py-2"
                    style={{ borderRadius: 0, fontSize: 13, border: '1px solid #e5e5e5', background: '#fff' }}>1</button>
                  {pageNums[0] > 2 && <span className="text-muted px-1" style={{ fontSize: 13 }}>…</span>}
                </>
              )}

              {pageNums.map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className="btn btn-sm px-3 py-2"
                  style={{
                    borderRadius: 0, fontSize: 13,
                    border: p === page ? 'none' : '1px solid #e5e5e5',
                    background: p === page ? 'var(--primary)' : '#fff',
                    color: p === page ? '#fff' : '#333',
                    fontWeight: p === page ? 600 : 400,
                  }}>
                  {p}
                </button>
              ))}

              {/* Last page if gap */}
              {pageNums[pageNums.length - 1] < totalPages && (
                <>
                  {pageNums[pageNums.length - 1] < totalPages - 1 && <span className="text-muted px-1" style={{ fontSize: 13 }}>…</span>}
                  <button onClick={() => setPage(totalPages)} className="btn btn-sm px-3 py-2"
                    style={{ borderRadius: 0, fontSize: 13, border: '1px solid #e5e5e5', background: '#fff' }}>{totalPages}</button>
                </>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-outline-secondary btn-sm px-3 py-2"
                style={{ borderTopRightRadius: 6,borderBottomRightRadius: 6, fontSize: 13, borderColor: '#e5e5e5' }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDataPage;