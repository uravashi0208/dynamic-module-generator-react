import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Layers, ToggleLeft, ToggleRight, Clock, User, Loader2 } from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import { format } from '../utils/dateUtils';
import { FIELD_TYPES, getFieldTypeIcon } from '../utils/fieldTypes';
import clsx from 'clsx';

const FieldPreview = ({ field }) => {
  const Icon = getFieldTypeIcon(field.fieldType);
  const fieldTypeMeta = FIELD_TYPES.find((t) => t.value === field.fieldType);

  const renderPreview = () => {
    switch (field.fieldType) {
      case 'textarea':
        return <textarea placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}...`} rows={3} className="input-field resize-none" disabled />;
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" disabled />
            <span className="text-sm text-slate-600">{field.fieldLabel}</span>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options?.length ? field.options : [{ label: 'Option 1', value: 'opt1' }]).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="radio" name={field.fieldName} className="w-4 h-4 accent-brand-600" disabled />
                <span className="text-sm text-slate-600">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'select':
        return (
          <select className="input-field" disabled>
            <option value="">{field.placeholder || `Select ${field.fieldLabel.toLowerCase()}...`}</option>
            {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        );
      case 'color':
        return <input type="color" className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer" disabled />;
      case 'range':
        return <input type="range" className="w-full accent-brand-600" min={field.validations?.min || 0} max={field.validations?.max || 100} disabled />;
      default:
        return (
          <input
            type={field.fieldType}
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}...`}
            className="input-field"
            disabled
          />
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-200 hover:shadow-glow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-50 rounded-lg flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{field.fieldLabel}</p>
              {field.validations?.required && (
                <span className="text-red-500 text-xs font-bold">*</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{field.fieldName}</p>
          </div>
        </div>
        <span className="badge badge-info">{fieldTypeMeta?.label || field.fieldType}</span>
      </div>
      <div className="pointer-events-none opacity-70">
        {renderPreview()}
      </div>
      {field.validations && Object.values(field.validations).some(Boolean) && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {field.validations.required && <span className="badge bg-red-50 text-red-600 border border-red-100">Required</span>}
          {field.validations.minLength && <span className="badge badge-warning">Min: {field.validations.minLength}</span>}
          {field.validations.maxLength && <span className="badge badge-warning">Max: {field.validations.maxLength}</span>}
          {field.validations.min !== undefined && <span className="badge badge-warning">Min: {field.validations.min}</span>}
          {field.validations.max !== undefined && <span className="badge badge-warning">Max: {field.validations.max}</span>}
        </div>
      )}
    </div>
  );
};

const ModuleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchModule, currentModule, deleteModule, toggleStatus, isLoading } = useModuleStore();

  useEffect(() => {
    fetchModule(id);
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Delete "${currentModule.moduleName}"? This cannot be undone.`)) {
      const result = await deleteModule(id);
      if (result.success) navigate('/modules');
    }
  };

  if (isLoading || !currentModule) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/modules')} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{currentModule.moduleName}</h1>
              <p className="text-xs text-slate-400 font-mono">/{currentModule.moduleSlug}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleStatus(id)}
            className={clsx('badge transition-all cursor-pointer hover:opacity-80',
              currentModule.isActive ? 'badge-success' : 'badge-danger'
            )}
          >
            {currentModule.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
            {currentModule.isActive ? 'Active' : 'Inactive'}
          </button>
          <button onClick={() => navigate(`/modules/${id}/edit`)} className="btn-secondary">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Fields</p>
            <p className="text-2xl font-bold text-slate-900">{currentModule.fields?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Status</p>
            <p className={clsx('text-sm font-semibold', currentModule.isActive ? 'text-emerald-600' : 'text-slate-400')}>
              {currentModule.isActive ? '● Active' : '● Inactive'}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm text-slate-700">{format(new Date(currentModule.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Created by</p>
              <p className="text-sm text-slate-700 truncate">{currentModule.createdBy?.name || 'Unknown'}</p>
            </div>
          </div>
        </div>
        {currentModule.description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">{currentModule.description}</p>
          </div>
        )}
      </div>

      {/* Fields Preview */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Fields Preview ({currentModule.fields?.length || 0})
        </h2>
        {currentModule.fields?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentModule.fields.map((field) => (
              <FieldPreview key={field._id} field={field} />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-slate-400 text-sm">No fields defined yet.</p>
            <button onClick={() => navigate(`/modules/${id}/edit`)} className="btn-primary mt-4">
              <Edit2 className="w-4 h-4" /> Add Fields
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetailPage;
