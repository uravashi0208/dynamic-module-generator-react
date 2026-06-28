/**
 * GenericListPage — shared renderer for all auto-generated module list pages.
 * Auto-generated *Page files are thin wrappers:
 *   const BasicFormListPage = () => <GenericListPage slug="basic-form" name="Basic Form" fields={FIELDS} />;
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useModuleDataStore from '../../context/moduleDataStore';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

/* ── CellValue ── */
const CellValue = ({ value, fieldType }) => {
  if (value === null || value === undefined || value === '')
    return <span className="text-muted cell-text">—</span>;

  if (fieldType === 'checkbox')
    return (
      <span className={`badge rounded-pill ${value ? 'text-bg-success' : 'text-bg-secondary'}`} style={{ fontSize: 10 }}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  if (fieldType === 'color')
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="cell-value-color" style={{ background: value }} />
        <code className="cell-code">{value}</code>
      </div>
    );
  if (fieldType === 'url')
    return <a href={value} target="_blank" rel="noreferrer" className="text-primary text-truncate d-block cell-text" style={{ maxWidth: 140 }}>{value}</a>;
  if (fieldType === 'password')
    return <span className="font-monospace text-muted cell-text">••••••••</span>;
  if (fieldType === 'date')
    return <span className="cell-text">{new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
  if (fieldType === 'datetime-local')
    return <span className="cell-text">{new Date(value).toLocaleString()}</span>;
  if (fieldType === 'number')
    return <span className="fw-semibold cell-text">{Number(value).toLocaleString()}</span>;
  if (fieldType === 'textarea') {
    const s = String(value);
    return <span className="cell-text">{s.length > 80 ? `${s.slice(0, 80)}…` : s}</span>;
  }
  return <span className="cell-text">{String(value)}</span>;
};

/* ── GenericListPage ── */
const GenericListPage = ({ slug, name, fields = [] }) => {
  const navigate = useNavigate();
  const { records, pagination, isLoading, fetchRecords, deleteRecord } = useModuleDataStore();

  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(10);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState('asc');
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);

  useEffect(() => { setSelected([]); fetchRecords(slug, page, limit); }, [slug, page, limit]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.isBulk) {
        for (const id of deleteModal.ids) await deleteRecord(slug, id);
        setSelected([]);
      } else {
        await deleteRecord(slug, deleteModal.id);
      }
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  };

  const handleExport = () => {
    if (!records.length) return;
    const headers = Object.keys(records[0]).filter((k) => !k.startsWith('_') && k !== '__v');
    const csv = [
      headers.join(','),
      ...records.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${slug}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  let displayed = search.trim()
    ? records.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(search.toLowerCase())))
    : [...records];

  if (sortField) {
    displayed.sort((a, b) => {
      const av = a[sortField] ?? '', bv = b[sortField] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  const total      = pagination?.total ?? records.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const pageStart  = ((page - 1) * limit) + 1;
  const pageEnd    = Math.min(page * limit, total);
  const allSelected = displayed.length > 0 && selected.length === displayed.length;
  const toggleAll   = () => setSelected(allSelected ? [] : displayed.map((r) => r._id));
  const toggleOne   = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const firstField  = fields[0]?.fieldName || '_id';

  // Build page numbers (max 5 visible)
  const pageNums = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let p = start; p <= Math.min(start + 4, totalPages); p++) pageNums.push(p);

  return (
    <div className="animate-slide-up">
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

      {/* ── Header ── */}
      <div className="page-header mb-3">
        <div>
          <h1 className="page-title">{name}</h1>
          <p className="page-subtitle mb-0">Manage and track all {name.toLowerCase()} records.</p>
        </div>
        <button
          onClick={() => navigate(`/${slug}/new`)}
          className="btn btn-primary d-flex align-items-center gap-2 px-4"
        >
          <i className="ti ti-plus" /> Add {name}
        </button>
      </div>

      {/* ── Card ── */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="d-flex align-items-center justify-content-between gap-3 px-4 py-3 border-bottom flex-wrap">
          <div className="search-bar py-2">
            <i className="ti ti-search search-bar__icon" />
            <input
              type="text"
              placeholder="Search records…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-control search-bar__input"
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            {selected.length > 0 && (
              <button
                onClick={() => setDeleteModal({ isBulk: true, ids: selected, count: selected.length })}
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
              >
                <i className="ti ti-trash" /> Delete ({selected.length})
              </button>
            )}
            <button
              onClick={handleExport}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 toolbar-btn"
            >
              <i className="ti ti-download" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="ti ti-database fs-4 text-muted" />
            </div>
            <p className="empty-state__title">{search ? 'No records match your search.' : 'No records yet.'}</p>
            {!search && (
              <button onClick={() => navigate(`/${slug}/new`)} className="btn btn-primary btn-sm px-4">
                <i className="ti ti-plus me-1" /> Add {name}
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  {fields.map((f) => (
                    <th
                      key={f.fieldName}
                      className="sortable"
                      onClick={() => handleSort(f.fieldName)}
                    >
                      {f.fieldLabel}
                      {sortField === f.fieldName
                        ? <i className={`ti ti-arrow-${sortDir === 'asc' ? 'up' : 'down'} ms-1 sort-icon--active`} />
                        : <i className="ti ti-arrows-sort ms-1 sort-icon--idle" />}
                    </th>
                  ))}
                  <th className="text-end" style={{ whiteSpace: 'nowrap' }}>Created At</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {displayed.map((record) => (
                  <tr key={record._id} className={selected.includes(record._id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.includes(record._id)}
                        onChange={() => toggleOne(record._id)}
                      />
                    </td>
                    {fields.map((f) => (
                      <td key={f.fieldName} style={{ maxWidth: 200 }}>
                        <CellValue value={record[f.fieldName]} fieldType={f.fieldType} />
                      </td>
                    ))}
                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                      <span className="cell-text text-muted">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          onClick={() => navigate(`/${slug}/${record._id}/edit`)}
                          className="btn btn-light btn-icon btn-sm rounded-2"
                          title="Edit"
                        >
                          <i className="ti ti-edit" style={{ fontSize: 14 }} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ id: record._id, label: record[firstField], isBulk: false })}
                          className="btn btn-light btn-icon btn-sm rounded-2 text-danger"
                          title="Delete"
                        >
                          <i className="ti ti-trash" style={{ fontSize: 14 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: 12 }}>
                Showing {pageStart}–{pageEnd} of {total}
              </span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="form-select form-select-sm w-auto"
              >
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item${page <= 1 ? ' disabled' : ''}`}>
                  <button className="page-link rounded-2" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                </li>
                {pageNums.map((p) => (
                  <li key={p} className={`page-item${p === page ? ' active' : ''}`}>
                    <button className="page-link rounded-2" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item${page >= totalPages ? ' disabled' : ''}`}>
                  <button className="page-link rounded-2" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericListPage;
