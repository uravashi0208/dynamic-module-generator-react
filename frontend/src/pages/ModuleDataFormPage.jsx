import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import clsx from 'clsx';

// ── Dynamic field renderer ────────────────────────────────────────────────────
const DynamicField = ({ field, register, errors, watch }) => {
  const error      = errors?.[field.fieldName];
  const validations = field.validations || {};

  const rules = {
    required: validations.required ? `${field.fieldLabel} is required` : false,
    ...(validations.minLength ? { minLength: { value: validations.minLength, message: `Min ${validations.minLength} chars` } } : {}),
    ...(validations.maxLength ? { maxLength: { value: validations.maxLength, message: `Max ${validations.maxLength} chars` } } : {}),
    ...(validations.min !== undefined ? { min: { value: validations.min, message: `Min value: ${validations.min}` } } : {}),
    ...(validations.max !== undefined ? { max: { value: validations.max, message: `Max value: ${validations.max}` } } : {}),
    ...(field.fieldType === 'email' ? { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } } : {}),
  };

  const base = clsx(
    'w-full px-3 py-2 text-sm border rounded-lg bg-white transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
    error ? 'border-red-300 bg-red-50' : 'border-slate-200'
  );

  const renderInput = () => {
    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea {...register(field.fieldName, rules)} rows={4}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}…`}
            className={clsx(base, 'resize-none')} />
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-3 pt-1">
            <input type="checkbox" id={field.fieldName}
              {...register(field.fieldName)}
              className="w-4 h-4 accent-indigo-600 rounded" />
            <label htmlFor={field.fieldName} className="text-sm text-slate-700 cursor-pointer">
              {field.fieldLabel}
            </label>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2 pt-1">
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" value={opt.value}
                  {...register(field.fieldName, rules)}
                  className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'select':
        return (
          <select {...register(field.fieldName, rules)} className={base}>
            <option value="">Select {field.fieldLabel}…</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'color':
        return (
          <input type="color" {...register(field.fieldName, rules)}
            className="h-10 w-20 rounded-lg border border-slate-200 cursor-pointer bg-white p-1" />
        );
      case 'range': {
        const min = validations.min ?? 0;
        const max = validations.max ?? 100;
        const val = watch(field.fieldName) ?? Math.floor((min + max) / 2);
        return (
          <div className="space-y-1">
            <input type="range" {...register(field.fieldName, { ...rules, valueAsNumber: true })}
              min={min} max={max} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{min}</span>
              <span className="font-semibold text-indigo-600">{val}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      }
      case 'number':
        return (
          <input type="number"
            {...register(field.fieldName, { ...rules, valueAsNumber: true })}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}…`}
            className={base} />
        );
      default:
        return (
          <input type={field.fieldType}
            {...register(field.fieldName, rules)}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}…`}
            defaultValue={field.defaultValue || ''}
            className={base} />
        );
    }
  };

  const isFullWidth = ['textarea', 'file', 'checkbox', 'radio'].includes(field.fieldType);

  return (
    <div className={isFullWidth ? 'sm:col-span-2' : ''}>
      {field.fieldType !== 'checkbox' && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {field.fieldLabel}
          {validations.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error.message}
        </p>
      )}
      {field.helpText && !error && (
        <p className="mt-1 text-xs text-slate-400">{field.helpText}</p>
      )}
    </div>
  );
};

// ── Form Page ─────────────────────────────────────────────────────────────────
const ModuleDataFormPage = () => {
  const { moduleSlug, id } = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const { modules, fetchModules }                            = useModuleStore();
  const { fetchRecord, createRecord, updateRecord, isSubmitting } = useModuleDataStore();

  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);

  const module     = modules.find(
    (m) => m.moduleSlug === moduleSlug ||
           m.moduleName?.toLowerCase().replace(/\s+/g, '-') === moduleSlug
  );
  const fields     = module?.fields || [];
  const moduleName = module?.moduleName || moduleSlug;

  const { register, handleSubmit, reset, watch, formState: { errors } } =
    useForm({ mode: 'onBlur' });

  useEffect(() => {
    if (!modules.length) fetchModules();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setIsLoadingRecord(true);
      fetchRecord(moduleSlug, id).then((record) => {
        if (record) {
          const defaults = {};
          fields.forEach((f) => {
            if (record[f.fieldName] !== undefined) {
              if (f.fieldType === 'datetime-local' && record[f.fieldName])
                defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 16);
              else if (f.fieldType === 'date' && record[f.fieldName])
                defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 10);
              else
                defaults[f.fieldName] = record[f.fieldName];
            }
          });
          reset(defaults);
        }
        setIsLoadingRecord(false);
      });
    }
  }, [id, module]);

  const onSubmit = async (formData) => {
    const payload = {};
    fields.forEach((f) => {
      if (f.fieldType === 'file') return;
      payload[f.fieldName] = f.fieldType === 'checkbox'
        ? Boolean(formData[f.fieldName])
        : (formData[f.fieldName] ?? '');
    });

    const result = isEdit
      ? await updateRecord(moduleSlug, id, payload)
      : await createRecord(moduleSlug, payload);

    if (result.success) navigate(`/${moduleSlug}`);
  };

  if (isLoadingRecord) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/${moduleSlug}`)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'Edit' : 'New'} {moduleName}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {isEdit ? 'Update record' : 'Create record'}
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {fields.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No fields defined</p>
            <p className="text-xs text-slate-400 mt-1">
              Go to the module configuration to add fields first.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map((field) => (
                <DynamicField
                  key={field.fieldName}
                  field={field}
                  register={register}
                  errors={errors}
                  watch={watch}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button"
                onClick={() => navigate(`/${moduleSlug}`)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModuleDataFormPage;
