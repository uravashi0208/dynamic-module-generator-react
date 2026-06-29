import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const toImgSrc   = (v) => (!v || typeof v !== 'string') ? null : v.startsWith('http') ? v : `${API_BASE}${v}`;
const isImageUrl = (url) => url && (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes('/image/upload/') || url.includes('cloudinary'));

/* ── Thumbnail ── */
const Thumbnail = ({ src, name }) => {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="thumbnail-placeholder">
        <i className="ti ti-photo text-muted fs-18px" />
      </div>
    );
  }
  return (
    <img
      src={src} alt={name || 'img'} onError={() => setErr(true)}
      className="thumbnail"
    />
  );
};

/* ── Cell value renderer ── */
const CellValue = ({ value, field }) => {
  const ft = field?.fieldType;

  if (value === null || value === undefined || value === '') {
    return <span className="text-muted cell-text">—</span>;
  }

  if (ft === 'file') {
    const src = toImgSrc(value);
    if (isImageUrl(value)) return <Thumbnail src={src} />;
    const fname = String(value).split('/').pop();
    return (
      <a href={src} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-1 text-primary fs-12px">
        <i className="ti ti-paperclip" />
        {fname.length > 18 ? `${fname.slice(0, 18)}…` : fname}
      </a>
    );
  }

  if (ft === 'checkbox') {
    if (Array.isArray(value)) {
      if (!value.length) return <span className="text-muted cell-text">—</span>;
      return (
        <div className="d-flex flex-wrap gap-1">
          {value.map((v) => (
            <span key={v} className="badge rounded-pill cell-tag">{v}</span>
          ))}
        </div>
      );
    }
    return (
      <span className={`badge rounded-pill fs-10px ${value ? 'text-bg-success' : 'text-bg-secondary'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  if (ft === 'color') return (
    <div className="d-flex align-items-center gap-2">
      <span className="cell-value-color" style={{ background: value }} />
      <code className="cell-code">{value}</code>
    </div>
  );
  if (ft === 'url')      return <a href={value} target="_blank" rel="noreferrer" className="text-primary text-truncate d-block cell-text" style={{ maxWidth: 120 }}>{value}</a>;
  if (ft === 'password') return <span className="text-muted font-monospace cell-text">••••••••</span>;
  if (ft === 'number')   return <span className="fw-semibold cell-text">{Number(value).toLocaleString()}</span>;
  if (ft === 'date')     return <span className="cell-text">{new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
  if (ft === 'datetime-local') return <span className="cell-text">{new Date(value).toLocaleString()}</span>;
  if (ft === 'textarea') {
    const s = String(value);
    return <span className="cell-text">{s.length > 60 ? `${s.slice(0, 60)}…` : s}</span>;
  }
  return <span className="cell-text">{String(value)}</span>;
};

/* ── Filter Modal ── */
const FilterModal = ({ fields, filters, onApply, onClose }) => {
  const [local, setLocal] = useState({ ...filters });
  const textFields = fields.filter((f) => ['text', 'email', 'number', 'select', 'tel', 'url'].includes(f.fieldType));

  return (
    <div className="modal show d-block modal-overlay--soft">
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
                <label className="form-label label-form-sm">{f.fieldLabel}</label>
                {f.fieldType === 'select' ? (
                  <select
                    className="form-select form-select-sm"
                    value={local[f.fieldName] || ''}
                    onChange={(e) => setLocal((p) => ({ ...p, [f.fieldName]: e.target.value }))}
                  >
                    <option value="">All</option>
                    {(f.options || []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={`Filter by ${f.fieldLabel}…`}
                    value={local[f.fieldName] || ''}
                    onChange={(e) => setLocal((p) => ({ ...p, [f.fieldName]: e.target.value }))}
                  />
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

/* ── View Modal ── */
const ViewModal = ({ record, fields, moduleName, onClose, onEdit, canEdit }) => (
  <div className="modal show d-block modal-overlay">
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
                  <span className="text-muted text-uppercase label-field-view">
                    {f.fieldLabel}
                  </span>
                  <CellValue value={record[f.fieldName]} field={f} />
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

/* ── Skeleton Row ── */
const SkeletonRow = ({ hasImage, colCount }) => (
  <tr className="table-skeleton">
    {hasImage && (
      <td><div className="skeleton-cell" style={{ width: 44, height: 44, borderRadius: 6 }} /></td>
    )}
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i}>
        <div className="skeleton-cell" style={{ width: `${55 + (i * 13) % 35}%` }} />
      </td>
    ))}
    <td><div className="skeleton-cell" style={{ width: 40 }} /></td>
  </tr>
);

/* ══════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════ */
const ModuleDataPage = () => {
  const { moduleSlug } = useParams();
  const navigate       = useNavigate();
  const { modules, fetchModules }                                      = useModuleStore();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();

  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(8);
  const [search, setSearch]           = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [selected, setSelected]       = useState([]);
  const [sortField, setSortField]     = useState(null);
  const [sortDir, setSortDir]         = useState('asc');
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [showFilter, setShowFilter]   = useState(false);
  const [viewModal, setViewModal]     = useState(null);
  const [stableRows, setStableRows]   = useState([]);
  const [stablePagination, setStablePagination] = useState(null);
  const prevSlugRef = useRef(null);

  const module      = modules.find((m) => m.moduleSlug === moduleSlug);
  const fields      = module?.fields || [];
  const moduleName  = module?.moduleName || moduleSlug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const firstField  = fields[0]?.fieldName || '_id';
  const imageField  = fields.find((f) => f.fieldType === 'file');
  const colFields   = fields.filter((f) => f.fieldType !== 'file' && f.showInTable !== false);
  const hasImage    = Boolean(imageField);

  const permissions     = module?.permissions || {};
  const canView         = permissions.canView   !== false;
  const canEdit         = permissions.canEdit   !== false;
  const canDelete       = permissions.canDelete !== false;
  const hasAnyAction    = canView || canEdit || canDelete;
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  useEffect(() => { if (!modules.length) fetchModules(); }, []);

  useEffect(() => {
    if (!moduleSlug) return;
    if (prevSlugRef.current !== moduleSlug) {
      setStableRows([]); setStablePagination(null);
      prevSlugRef.current = moduleSlug;
      setPage(1); setSearch(''); setActiveFilters({});
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
    displayed = displayed.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)));
  }
  Object.entries(activeFilters).forEach(([k, v]) => {
    if (v) displayed = displayed.filter((r) => String(r[k] ?? '').toLowerCase().includes(v.toLowerCase()));
  });
  if (sortField) {
    displayed.sort((a, b) => {
      const av = a[sortField] ?? '', bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  const handleSort = (f) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
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
    } finally { setIsDeleting(false); setDeleteModal(null); }
  };

  const handleExcelExport = () => {
    const token   = localStorage.getItem('accessToken') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/${moduleSlug}/export/excel?token=${token}`, '_blank');
  };
  const handlePDFExport = () => {
    const token   = localStorage.getItem('accessToken') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/${moduleSlug}/export/pdf?token=${token}`, '_blank');
  };

  const allSelected = displayed.length > 0 && selected.length === displayed.length;
  const toggleAll   = () => setSelected(allSelected ? [] : displayed.map((r) => r._id));
  const toggleOne   = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const displayPagination = stablePagination || pagination;
  const total      = displayPagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const isFirstLoad = isLoading && stableRows.length === 0;
  const isFading    = isLoading && stableRows.length > 0;
  const paintRows   = isFading ? stableRows : displayed;

  const delta = 1;
  const pageNums = [];
  for (let p = Math.max(1, page - delta); p <= Math.min(totalPages, page + delta); p++) pageNums.push(p);

  return (
    <div>
      {/* Modals */}
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
        <FilterModal
          fields={fields} filters={activeFilters}
          onApply={(f) => { setActiveFilters(f); setShowFilter(false); setPage(1); }}
          onClose={() => setShowFilter(false)}
        />
      )}
      {viewModal && (
        <ViewModal
          record={viewModal} fields={fields} moduleName={module?.moduleName}
          canEdit={canEdit}
          onClose={() => setViewModal(null)}
          onEdit={() => { setViewModal(null); navigate(`/${moduleSlug}/${viewModal._id}/edit`); }}
        />
      )}

      {/* ── Page Header ── */}
      <div className="page-header mb-3">
        <div>
          <h1 className="page-title">{moduleName}</h1>
          <p className="page-subtitle mb-0">Manage your {moduleName?.toLowerCase()} inventory</p>
        </div>
        <button
          onClick={() => navigate(`/${moduleSlug}/new`)}
          className="btn btn-primary d-flex align-items-center gap-2 px-4"
        >
          <i className="ti ti-plus" /> Add {module?.moduleName || 'Record'}
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
        <div className="search-bar">
          <i className="ti ti-search search-bar__icon" />
          <input
            type="text" placeholder="Search records..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-control search-bar__input py-2 me-4"
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {selected.length > 0 && (
            <button
              onClick={() => setDeleteModal({ isBulk: true, ids: selected, count: selected.length })}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            >
              <i className="ti ti-trash" /> Delete ({selected.length})
            </button>
          )}
          <button
            onClick={() => setShowFilter(true)}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2 toolbar-btn"
          >
            <i className="ti ti-filter fs-14px" /> Filter
            {activeFilterCount > 0 && (
              <span className="badge rounded-pill ms-1 filter-badge">{activeFilterCount}</span>
            )}
          </button>
          <button
            onClick={handleExcelExport}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2 toolbar-btn"
          >
            <i className="ti ti-file-spreadsheet fs-14px" /> Excel
          </button>
          <button
            onClick={handlePDFExport}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2 toolbar-btn"
          >
            <i className="ti ti-file-type-pdf fs-14px" /> PDF
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="data-table-wrap">
        <div className="table-responsive">
          <table className="table data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox" className="form-check-input"
                    checked={allSelected} onChange={toggleAll}
                    disabled={isLoading || displayed.length === 0}
                  />
                </th>
                {hasImage && <th>Image</th>}
                {colFields.map((f) => (
                  <th
                    key={f.fieldName}
                    className="sortable"
                    onClick={() => !isLoading && handleSort(f.fieldName)}
                  >
                    {f.fieldLabel ? `${f.fieldLabel.charAt(0).toUpperCase()}${f.fieldLabel.slice(1)}` : ''}
                    {sortField === f.fieldName
                      ? <i className={`ti ti-arrow-${sortDir === 'asc' ? 'up' : 'down'} ms-1 sort-icon--active`} />
                      : <i className="ti ti-arrows-sort ms-1 sort-icon--idle" />
                    }
                  </th>
                ))}
                <th className="text-end">Action</th>
              </tr>
            </thead>

            <tbody>
              {isFirstLoad && Array.from({ length: limit }).map((_, i) => (
                <SkeletonRow key={i} hasImage={hasImage} colCount={colFields.length} />
              ))}

              {!isFirstLoad && paintRows.map((record) => {
                const imgSrc   = imageField ? toImgSrc(record[imageField.fieldName]) : null;
                const isSelected = selected.includes(record._id);
                return (
                  <tr
                    key={record._id}
                    className={isSelected ? 'selected' : ''}
                    style={{ opacity: isFading ? 0.4 : 1 }}
                  >
                    <td>
                      <input
                        type="checkbox" className="form-check-input"
                        checked={isSelected} onChange={() => toggleOne(record._id)}
                      />
                    </td>
                    {hasImage && (
                      <td>
                        <Thumbnail
                          src={isImageUrl(record[imageField?.fieldName]) ? imgSrc : null}
                          name={record[firstField]}
                        />
                      </td>
                    )}
                    {colFields.map((f) => (
                      <td key={f.fieldName} style={{ maxWidth: 180 }}>
                        <CellValue value={record[f.fieldName]} field={f} />
                      </td>
                    ))}
                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                      {!hasAnyAction && <span className="text-muted fs-12px">—</span>}
                      {canView && (
                        <button
                          onClick={() => setViewModal(record)}
                          className="action-btn action-btn--view me-1"
                          title="View"
                        >
                          <i className="ti ti-eye" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/${moduleSlug}/${record._id}/edit`)}
                          className="action-btn action-btn--edit me-1"
                          title="Edit"
                        >
                          <i className="ti ti-edit" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteModal({ id: record._id, label: record[firstField], isBulk: false })}
                          className="action-btn action-btn--delete"
                          title="Delete"
                        >
                          <i className="ti ti-trash" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {!isLoading && displayed.length === 0 && (
                <tr>
                  <td colSpan={colFields.length + (hasImage ? 3 : 2)}>
                    <div className="empty-state">
                      <div className="empty-state__icon">
                        <i className="ti ti-package" style={{ fontSize: 24, color: 'var(--primary)' }} />
                      </div>
                      <p className="empty-state__title">
                        {search || activeFilterCount > 0
                          ? 'No records match your search'
                          : `No ${moduleName} records yet`}
                      </p>
                      <p className="empty-state__sub">
                        {search || activeFilterCount > 0
                          ? 'Try adjusting your filters or search term'
                          : `Add your first ${moduleName?.toLowerCase()} to get started`}
                      </p>
                      {!search && !activeFilterCount && (
                        <button
                          onClick={() => navigate(`/${moduleSlug}/new`)}
                          className="btn btn-primary btn-sm px-4"
                        >
                          <i className="ti ti-plus me-1" /> Add {module?.moduleName || 'Record'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="pagination-wrap">
            <p className="pagination-text text-muted mb-0">
              Showing {moduleName?.toLowerCase() || 'record'} per page
            </p>
            <div className="d-flex align-items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="page-btn"
              >Previous</button>

              {pageNums[0] > 1 && (
                <>
                  <button onClick={() => setPage(1)} className="page-btn">1</button>
                  {pageNums[0] > 2 && <span className="text-muted px-1 fs-13px">…</span>}
                </>
              )}

              {pageNums.map((p) => (
                <button
                  key={p} onClick={() => setPage(p)}
                  className={`page-btn${p === page ? ' active' : ''}`}
                >{p}</button>
              ))}

              {pageNums[pageNums.length - 1] < totalPages && (
                <>
                  {pageNums[pageNums.length - 1] < totalPages - 1 && (
                    <span className="text-muted px-1 fs-13px">…</span>
                  )}
                  <button onClick={() => setPage(totalPages)} className="page-btn">{totalPages}</button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="page-btn"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDataPage;
