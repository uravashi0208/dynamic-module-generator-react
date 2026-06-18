import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Save, Loader2, Database, AlertCircle,
} from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import clsx from 'clsx';

/** Renders a single dynamic field based on its fieldType */
const DynamicField = ({ field, register, errors, watch }) => {
  const error = errors?.[field.fieldName];
  const validations = field.validations || {};

  const rules = {
    required: validations.required ? `${field.fieldLabel} is required` : false,
    ...(validations.minLength ? { minLength: { value: validations.minLength, message: `Min ${validations.minLength} characters` } } : {}),
    ...(validations.maxLength ? { maxLength: { value: validations.maxLength, message: `Max ${validations.maxLength} characters` } } : {}),
    ...(validations.min !== undefined ? { min: { value: validations.min, message: `Min value is ${validations.min}` } } : {}),
    ...(validations.max !== undefined ? { max: { value: validations.max, message: `Max value is ${validations.max}` } } : {}),
    ...(field.fieldType === 'email' ? {
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
    } : {}),
    ...(field.fieldType === 'url' ? {
      pattern: { value: /^(https?:\/\/)/, message: 'URL must start with http:// or https://' }
    } : {}),
    ...(field.fieldType === 'tel' ? {
      pattern: { value: /^[+\d\s\-()]{7,15}$/, message: 'Enter a valid phone number' }
    } : {}),
  };

  const baseClass = clsx('input-field', error && 'input-field-error');

  const renderInput = () => {
    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            {...register(field.fieldName, rules)}
            rows={4}
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}…`}
            className={clsx(baseClass, 'resize-none')}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id={field.fieldName}
              {...register(field.fieldName)}
              className="w-4 h-4 accent-brand-600 rounded"
            />
            <label htmlFor={field.fieldName} className="text-sm text-slate-700 cursor-pointer">
              {field.fieldLabel}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2 pt-1">
            {(field.options?.length ? field.options : []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  value={opt.value}
                  {...register(field.fieldName, rules)}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select {...register(field.fieldName, rules)} className={baseClass}>
            <option value="">{field.placeholder || `Select ${field.fieldLabel.toLowerCase()}…`}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'color':
        return (
          <input
            type="color"
            {...register(field.fieldName, rules)}
            className="h-10 w-20 rounded-lg border border-slate-200 cursor-pointer bg-white p-1"
          />
        );

      case 'range': {
        const min = validations.min ?? 0;
        const max = validations.max ?? 100;
        const watchVal = watch(field.fieldName) ?? Math.floor((min + max) / 2);
        return (
          <div className="space-y-1">
            <input
              type="range"
              {...register(field.fieldName, { ...rules, valueAsNumber: true })}
              min={min}
              max={max}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{min}</span>
              <span className="font-semibold text-brand-600">{watchVal}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      }

      case 'number':
        return (
          <input
            type="number"
            {...register(field.fieldName, { ...rules, valueAsNumber: true })}
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}…`}
            min={validations.min}
            max={validations.max}
            className={baseClass}
          />
        );

      case 'file':
        return (
          <div className={clsx(
            'flex items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors',
            error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-brand-300 bg-slate-50 hover:bg-brand-50/30'
          )}>
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Database className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500">Click to upload file</span>
              <span className="text-xs text-slate-400">Any file type accepted</span>
              <input
                type="file"
                {...register(field.fieldName, rules)}
                className="hidden"
              />
            </label>
          </div>
        );

      default:
        return (
          <input
            type={field.fieldType}
            {...register(field.fieldName, rules)}
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}…`}
            defaultValue={field.defaultValue || ''}
            className={baseClass}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      {field.fieldType !== 'checkbox' && (
        <label className="label">
          {field.fieldLabel}
          {validations.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="error-message">
          <AlertCircle className="w-3.5 h-3.5" />
          {error.message}
        </p>
      )}
      {field.helpText && !error && (
        <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>
      )}
    </div>
  );
};

const ModuleDataFormPage = () => {
  const { moduleSlug, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { modules, fetchModules } = useModuleStore();
  const { fetchRecord, createRecord, updateRecord, isSubmitting } = useModuleDataStore();

  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);

  const module = modules.find(
    (m) => m.moduleSlug === moduleSlug || m.moduleName?.toLowerCase() === moduleSlug?.toLowerCase()
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  // Load modules list if needed
  useEffect(() => {
    if (!modules.length) fetchModules();
  }, []);

  // Load record for edit
  useEffect(() => {
    if (isEdit && id) {
      setIsLoadingRecord(true);
      fetchRecord(moduleSlug, id).then((record) => {
        if (record) {
          // Convert dates to local input format
          const defaults = {};
          module?.fields?.forEach((f) => {
            if (record[f.fieldName] !== undefined) {
              if (f.fieldType === 'datetime-local' && record[f.fieldName]) {
                defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 16);
              } else if (f.fieldType === 'date' && record[f.fieldName]) {
                defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 10);
              } else {
                defaults[f.fieldName] = record[f.fieldName];
              }
            }
          });
          reset(defaults);
        }
        setIsLoadingRecord(false);
      });
    }
  }, [id, module]);

  const onSubmit = async (formData) => {
    // For file inputs, we only handle text-based fields (no multipart in this version)
    const payload = {};
    module?.fields?.forEach((f) => {
      if (f.fieldType === 'file') return; // skip file upload for now
      if (f.fieldType === 'checkbox') {
        payload[f.fieldName] = Boolean(formData[f.fieldName]);
      } else {
        payload[f.fieldName] = formData[f.fieldName] ?? '';
      }
    });

    const result = isEdit
      ? await updateRecord(moduleSlug, id, payload)
      : await createRecord(moduleSlug, payload);

    if (result.success) {
      navigate(`/data/${moduleSlug}`);
    }
  };

  if (isLoadingRecord) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const fields = module?.fields || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/data/${moduleSlug}`)} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow-sm">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'Edit Record' : 'New Record'}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {module?.moduleName || moduleSlug}
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="card p-6">
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
            {/* Render all fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map((field) => {
                // Full-width fields
                const fullWidth = ['textarea', 'file', 'checkbox', 'radio'].includes(field.fieldType);
                return (
                  <div key={field.fieldName} className={fullWidth ? 'sm:col-span-2' : ''}>
                    <DynamicField
                      field={field}
                      register={register}
                      errors={errors}
                      watch={watch}
                    />
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(`/data/${moduleSlug}`)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" /> {isEdit ? 'Update Record' : 'Create Record'}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModuleDataFormPage;
