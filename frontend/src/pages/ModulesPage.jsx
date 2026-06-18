import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, Eye, ToggleLeft, ToggleRight,
  Layers, ChevronLeft, ChevronRight, Filter, Loader2, AlertTriangle
} from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import { formatDistanceToNow, format } from '../utils/dateUtils';
import { getFieldTypeIcon } from '../utils/fieldTypes';
import clsx from 'clsx';

const DeleteDialog = ({ module, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 text-center">Delete Module</h3>
      <p className="text-sm text-slate-500 text-center mt-2">
        Are you sure you want to delete <span className="font-semibold text-slate-700">"{module.moduleName}"</span>?
        This action cannot be undone.
      </p>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
      </div>
    </div>
  </div>
);

const ModulesPage = () => {
  const navigate = useNavigate();
  const {
    modules, pagination, isLoading, filters,
    fetchModules, deleteModule, toggleStatus, setFilters, setPage,
  } = useModuleStore();

  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchModules();
  }, []);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
    const debounced = setTimeout(() => {
      setFilters({ search: e.target.value });
    }, 400);
    return () => clearTimeout(debounced);
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setFilters({ isActive: val === '' ? undefined : val === 'true' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteModule(deleteTarget._id);
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (module) => {
    await toggleStatus(module._id);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Modules</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pagination?.total ?? 0} module{(pagination?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={() => navigate('/modules/new')} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Module
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchInput}
            onChange={handleSearch}
            placeholder="Search modules..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Layers className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold">No modules found</p>
            <p className="text-slate-400 text-sm mt-1">
              {filters.search ? 'Try a different search term' : 'Create your first module to get started'}
            </p>
            {!filters.search && (
              <button onClick={() => navigate('/modules/new')} className="btn-primary mt-4">
                <Plus className="w-4 h-4" />
                Create Module
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-surface-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Module</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Fields</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((module) => (
                    <tr key={module._id} className="hover:bg-surface-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4.5 h-4.5 text-brand-600" size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{module.moduleName}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                              {module.description || `/${module.moduleSlug}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {module.fields?.slice(0, 3).map((field) => {
                            const Icon = getFieldTypeIcon(field.fieldType);
                            return (
                              <span key={field._id} className="badge badge-info gap-1">
                                <Icon className="w-3 h-3" />
                                {field.fieldLabel}
                              </span>
                            );
                          })}
                          {(module.fields?.length || 0) > 3 && (
                            <span className="badge bg-slate-100 text-slate-600">
                              +{module.fields.length - 3} more
                            </span>
                          )}
                          {(!module.fields || module.fields.length === 0) && (
                            <span className="text-xs text-slate-400">No fields</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div>
                          <p className="text-sm text-slate-700">{format(new Date(module.createdAt), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(module.createdAt), { addSuffix: true })}</p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleStatus(module)}
                          className={clsx(
                            'badge transition-all hover:opacity-80',
                            module.isActive ? 'badge-success' : 'badge-danger'
                          )}
                        >
                          {module.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                          {module.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/modules/${module._id}`)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/modules/${module._id}/edit`)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(module)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-surface-50">
                <p className="text-xs text-slate-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="btn-ghost py-1 px-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={clsx(
                        'w-7 h-7 text-xs font-medium rounded-lg transition-colors',
                        pagination.page === i + 1
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="btn-ghost py-1 px-2 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <DeleteDialog
          module={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ModulesPage;
