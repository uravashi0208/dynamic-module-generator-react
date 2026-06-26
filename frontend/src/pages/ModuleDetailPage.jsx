import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, Layers, ToggleLeft, ToggleRight,
  Clock, User, Loader2, Hash, CheckSquare, Circle, ChevronDown,
  AlignLeft, Type, Calendar, Palette, Sliders, Link, Phone,
  Mail, Lock, Paperclip, CalendarClock,
} from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import { format } from '../utils/dateUtils';
import { FIELD_TYPES, getFieldTypeIcon } from '../utils/fieldTypes';
import clsx from 'clsx';

/* ── badge color per field type ── */
const TYPE_BADGE = {
  text: 'bg-blue-50 text-blue-600 border-blue-100',
  email: 'bg-violet-50 text-violet-600 border-violet-100',
  password: 'bg-slate-100 text-slate-600 border-slate-200',
  number: 'bg-amber-50 text-amber-600 border-amber-100',
  textarea: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  checkbox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  radio: 'bg-purple-50 text-purple-600 border-purple-100',
  select: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  date: 'bg-orange-50 text-orange-600 border-orange-100',
  'datetime-local': 'bg-orange-50 text-orange-600 border-orange-100',
  file: 'bg-pink-50 text-pink-600 border-pink-100',
  url: 'bg-teal-50 text-teal-600 border-teal-100',
  tel: 'bg-lime-50 text-lime-600 border-lime-100',
  color: 'bg-rose-50 text-rose-600 border-rose-100',
  range: 'bg-sky-50 text-sky-600 border-sky-100',
};

/* ── Field preview card ── */
const FieldPreview = ({ field, index }) => {
  const Icon = getFieldTypeIcon(field.fieldType);
  const fieldTypeMeta = FIELD_TYPES.find((t) => t.value === field.fieldType);
  const badgeClass = TYPE_BADGE[field.fieldType] || 'bg-slate-100 text-slate-600 border-slate-200';

  const renderPreview = () => {
    switch (field.fieldType) {

      case 'checkbox':
        return (
          <div className="space-y-2 pt-1">
            {(field.options?.length
              ? field.options
              : [{ label: field.fieldLabel, value: field.fieldName }]
            ).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-default">
                <span className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0 bg-white" />
                <span className="text-sm text-slate-600">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2 pt-1">
            {(field.options?.length
              ? field.options
              : [{ label: 'Option 1', value: 'opt1' }, { label: 'Option 2', value: 'opt2' }]
            ).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-default">
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0 bg-white" />
                <span className="text-sm text-slate-600">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <div className="relative mt-1">
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-400 appearance-none pointer-events-none" disabled>
              <option>{field.placeholder || `Select ${field.fieldLabel.toLowerCase()}...`}</option>
              {field.options?.map((opt) => <option key={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}...`}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none text-slate-400 mt-1"
            disabled
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-3 mt-1">
            <div className="h-9 w-14 rounded-lg border border-slate-200 bg-gradient-to-br from-indigo-400 to-purple-500" />
            <span className="text-xs text-slate-400 font-mono">#6366f1</span>
          </div>
        );

      case 'range': {
        const min = field.validations?.min ?? 0;
        const max = field.validations?.max ?? 100;
        return (
          <div className="space-y-1.5 mt-1">
            <div className="relative h-2 bg-slate-200 rounded-full">
              <div className="absolute left-0 top-0 h-2 w-2/5 bg-brand-500 rounded-full" />
              <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-4 h-4 bg-white border-2 border-brand-500 rounded-full shadow-sm" />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{min}</span><span className="font-semibold text-brand-600">40</span><span>{max}</span>
            </div>
          </div>
        );
      }

      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}...`}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-400 mt-1"
            disabled
          />
        );
    }
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-glow-sm transition-all duration-200">
      {/* Field header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* index badge */}
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-slate-500">{index + 1}</span>
          </div>
          <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-800">{field.fieldLabel}</p>
              {field.validations?.required && (
                <span className="text-red-500 text-xs font-bold">*</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{field.fieldName}</p>
          </div>
        </div>
        <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', badgeClass)}>
          {fieldTypeMeta?.label || field.fieldType}
        </span>
      </div>

      {/* Preview */}
      <div className="pointer-events-none">
        {renderPreview()}
      </div>

      {/* Options chips for checkbox/radio/select */}
      {['checkbox', 'radio', 'select'].includes(field.fieldType) && field.options?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 mr-1 self-center">Options:</span>
          {field.options.map((opt) => (
            <span key={opt.value} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {opt.label}
            </span>
          ))}
        </div>
      )}

      {/* Validation badges */}
      {field.validations && Object.values(field.validations).some(Boolean) && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {field.validations.required && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">Required</span>
          )}
          {field.validations.minLength && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">Min {field.validations.minLength} chars</span>
          )}
          {field.validations.maxLength && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">Max {field.validations.maxLength} chars</span>
          )}
          {field.validations.min !== undefined && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">Min {field.validations.min}</span>
          )}
          {field.validations.max !== undefined && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">Max {field.validations.max}</span>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-4 p-4">
    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);

/* ── Main page ── */
const ModuleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchModule, currentModule, deleteModule, toggleStatus, isLoading } = useModuleStore();

  useEffect(() => { fetchModule(id); }, [id]);

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

  const fieldCount = currentModule.fields?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/modules')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-600 rounded-2xl flex items-center justify-center shadow-glow-sm">
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
            className={clsx(
              'h-9 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
              currentModule.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            )}
          >
            {currentModule.isActive
              ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
              : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>
            }
          </button>
          <button onClick={() => navigate(`/modules/${id}/edit`)} className="btn-secondary">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Info card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-brand-400 to-indigo-400" />
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          <StatCard
            icon={Hash}
            label="Fields"
            value={`${fieldCount} field${fieldCount !== 1 ? 's' : ''}`}
            accent="bg-brand-600"
          />
          <StatCard
            icon={currentModule.isActive ? ToggleRight : ToggleLeft}
            label="Status"
            value={currentModule.isActive ? 'Active' : 'Inactive'}
            accent={currentModule.isActive ? 'bg-emerald-500' : 'bg-slate-400'}
          />
          <StatCard
            icon={Clock}
            label="Created"
            value={format(new Date(currentModule.createdAt), 'MMM d, yyyy')}
            accent="bg-violet-500"
          />
          <StatCard
            icon={User}
            label="Created by"
            value={currentModule.createdBy?.name || 'Super Admin'}
            accent="bg-amber-500"
          />
        </div>
        {currentModule.description && (
          <div className="px-5 pb-4 pt-1 border-t border-slate-100">
            <p className="text-sm text-slate-500">{currentModule.description}</p>
          </div>
        )}
      </div>

      {/* ── Fields Preview ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Fields Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">{fieldCount} field{fieldCount !== 1 ? 's' : ''} defined</p>
          </div>
          <button
            onClick={() => navigate(`/modules/${id}/edit`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors border border-brand-200"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Fields
          </button>
        </div>

        {fieldCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentModule.fields.map((field, idx) => (
              <FieldPreview key={field._id} field={field} index={idx} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No fields defined yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Add fields to start collecting data with this module.</p>
            <button onClick={() => navigate(`/modules/${id}/edit`)} className="btn-primary">
              <Edit2 className="w-4 h-4" /> Add Fields
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetailPage;