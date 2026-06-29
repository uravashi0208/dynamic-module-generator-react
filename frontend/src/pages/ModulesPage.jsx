import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useModuleStore from '../context/moduleStore';
import { formatDistanceToNow, format } from '../utils/dateUtils';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const ModulesPage = () => {
  const navigate = useNavigate();
  const {
    modules, pagination, isLoading, filters,
    fetchModules, deleteModule, toggleStatus, setFilters, setPage, downloadModule,
  } = useModuleStore();

  const [searchInput,  setSearchInput]  = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => { fetchModules(); }, []);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
    const t = setTimeout(() => setFilters({ search: e.target.value }), 400);
    return () => clearTimeout(t);
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setFilters({ isActive: val === '' ? undefined : val === 'true' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteModule(deleteTarget._id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (module) => {
    setDownloadingId(module._id);
    try {
      await downloadModule(module._id, module.moduleSlug);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="animate-slide-up">
      {/* ── Header ── */}
      <div className="page-header pb-4 mb-4 border-bottom">
        <div>
          <h1 className="fs-5 fw-bold mb-0">Modules</h1>
          <p className="text-muted small mb-0">
            {pagination?.total ?? 0} module{(pagination?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => navigate('/modules/new')}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <i className="ti ti-plus" /> New Module
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
        <div className="search-bar">
          <i className="ti ti-search search-bar__icon" />
          <input
            value={searchInput}
            onChange={handleSearch}
            placeholder="Search modules…"
            className="form-control search-bar__input py-2 me-4"
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="form-select w-auto"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : modules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="ti ti-box-seam fs-4 text-muted" />
            </div>
            <p className="empty-state__title">No modules found</p>
            <p className="empty-state__sub">
              {filters.search
                ? 'Try a different search term'
                : 'Create your first module to get started'}
            </p>
            {!filters.search && (
              <button
                onClick={() => navigate('/modules/new')}
                className="btn btn-primary"
              >
                <i className="ti ti-plus me-1" /> Create Module
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover mb-0 modules-table">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-3 py-3 d-none d-md-table-cell">Fields</th>
                    <th className="px-3 py-3 d-none d-lg-table-cell">Created</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module._id}>
                      {/* Module name */}
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="module-row-icon">
                            <i className="ti ti-box text-primary fs-15px" />
                          </div>
                          <div>
                            <p className="module-name">{module.moduleName}</p>
                            <p className="module-desc">
                              {module.description || `/${module.moduleSlug}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Fields */}
                      <td className="px-3 py-3 d-none d-md-table-cell">
                        <div className="d-flex flex-wrap gap-1">
                          {module.fields?.slice(0, 3).map((f) => (
                            <span
                              key={f._id}
                              className="badge rounded-pill text-bg-light border field-tag"
                            >
                              {f.fieldLabel}
                            </span>
                          ))}
                          {(module.fields?.length || 0) > 3 && (
                            <span className="badge rounded-pill bg-light text-muted border field-tag">
                              +{module.fields.length - 3}
                            </span>
                          )}
                          {(!module.fields || module.fields.length === 0) && (
                            <span className="text-muted fs-12px">No fields</span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-3 py-3 d-none d-lg-table-cell">
                        <p className="module-date mb-0">
                          {format(new Date(module.createdAt), 'MMM d, yyyy')}
                        </p>
                        <p className="text-muted mb-0 fs-11px">
                          {formatDistanceToNow(new Date(module.createdAt), { addSuffix: true })}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleStatus(module._id)}
                          className={`status-toggle-btn ${module.isActive ? 'status-toggle-btn--active' : 'status-toggle-btn--inactive'}`}
                        >
                          <i className={`ti ${module.isActive ? 'ti-toggle-right' : 'ti-toggle-left'}`} />
                          {module.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            onClick={() => navigate(`/modules/${module._id}`)}
                            className="btn btn-light btn-icon btn-sm rounded-2"
                            title="View"
                          >
                            <i className="ti ti-eye fs-15px" />
                          </button>
                          <button
                            onClick={() => navigate(`/modules/${module._id}/edit`)}
                            className="btn btn-light btn-icon btn-sm rounded-2"
                            title="Edit"
                          >
                            <i className="ti ti-edit fs-15px" />
                          </button>
                          <button
                            onClick={() => handleDownload(module)}
                            disabled={downloadingId === module._id}
                            className="btn btn-light btn-icon btn-sm rounded-2"
                            title="Download generated files (.zip)"
                          >
                            {downloadingId === module._id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <i className="ti ti-download fs-15px" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(module)}
                            className="btn btn-light btn-icon btn-sm rounded-2 text-danger"
                            title="Delete"
                          >
                            <i className="ti ti-trash fs-15px" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div
                className="d-flex align-items-center justify-content-between px-4 py-3 border-top bg-light fs-12px"
              >
                <span className="text-muted">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <nav>
                  <ul className="pagination pagination-sm mb-0 gap-1">
                    <li className={`page-item${!pagination.hasPrevPage ? ' disabled' : ''}`}>
                      <button
                        className="page-link rounded-2"
                        onClick={() => setPage(pagination.page - 1)}
                      >‹</button>
                    </li>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item${pagination.page === i + 1 ? ' active' : ''}`}
                      >
                        <button
                          className="page-link rounded-2"
                          onClick={() => setPage(i + 1)}
                        >{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item${!pagination.hasNextPage ? ' disabled' : ''}`}>
                      <button
                        className="page-link rounded-2"
                        onClick={() => setPage(pagination.page + 1)}
                      >›</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Module"
          message={<>Delete <strong>"{deleteTarget.moduleName}"</strong>?</>}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => { if (!isDeleting) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
};

export default ModulesPage;
