import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle, Paperclip, X, Image } from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';
import clsx from 'clsx';

// ── File Input with preview ───────────────────────────────────────────────────
// Cloudinary URLs are full https:// — API_BASE only used for legacy local uploads
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const FileInput = ({ field, register, rules, error, existingUrl, setValue }) => {
  // Cloudinary image URLs may end with .png/.jpg OR have /image/upload/ in path
  const isImageUrl = (url) =>
    url && (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) || url.includes('/image/upload/'));

  // newFile  = File object user just picked (null = not picked yet)
  // cleared  = user explicitly removed the existing file
  const [newFile,  setNewFile]  = useState(null);
  const [cleared,  setCleared]  = useState(false);

  const { ref, onChange, ...rest } = register(field.fieldName, rules);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFile(file);
    setCleared(false);
    onChange(e);
  };

  const handleClear = (e) => {
    e.preventDefault();
    setNewFile(null);
    setCleared(true);
    // clear RHF value so no file is sent
    setValue(field.fieldName, null);
  };

  // What to show as preview
  const showExisting = !cleared && !newFile && existingUrl;
  const showNewImage = newFile && newFile.type.startsWith('image/');
  const [newPreview, setNewPreview] = useState(null);

  useEffect(() => {
    if (!newFile) { setNewPreview(null); return; }
    if (!newFile.type.startsWith('image/')) { setNewPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setNewPreview(ev.target.result);
    reader.readAsDataURL(newFile);
    return () => reader.abort();
  }, [newFile]);

  const existingFullUrl = existingUrl
    ? (existingUrl.startsWith('http') ? existingUrl : `${API_BASE}${existingUrl}`)
    : null;

  return (
    <div className="space-y-2">
      {/* Upload trigger */}
      <label className={clsx(
        'flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all',
        error
          ? 'border-red-300 bg-red-50'
          : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
      )}>
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Paperclip className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          {newFile ? (
            <p className="text-sm font-medium text-slate-700 truncate">{newFile.name}</p>
          ) : showExisting ? (
            <>
              <p className="text-sm font-medium text-slate-700 truncate">
                {existingUrl.split('/').pop()}
              </p>
              <p className="text-xs text-indigo-500">Click to replace</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-600">Click to upload file</p>
              <p className="text-xs text-slate-400">PNG, JPG, PDF, DOC up to 10MB</p>
            </>
          )}
        </div>
        {(newFile || showExisting) && (
          <button type="button" onClick={handleClear}
            className="w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        )}
        <input type="file" className="sr-only" {...rest} ref={ref} onChange={handleChange} />
      </label>

      {/* Existing image preview */}
      {showExisting && isImageUrl(existingUrl) && (
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img src={existingFullUrl} alt="current" className="w-full max-h-48 object-contain" />
          <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">Current</span>
          <button type="button" onClick={handleClear}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* New image preview */}
      {showNewImage && newPreview && (
        <div className="relative w-full rounded-xl overflow-hidden border border-indigo-200 bg-slate-50">
          <img src={newPreview} alt="new" className="w-full max-h-48 object-contain" />
          <span className="absolute top-2 left-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">New</span>
        </div>
      )}
    </div>
  );
};

// ── Dynamic field renderer ────────────────────────────────────────────────────
const DynamicField = ({ field, register, errors, watch, setValue, existingValues }) => {
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
        // If options defined → render multiple checkboxes (multi-select)
        if (field.options && field.options.length > 0) {
          return (
            <div className="space-y-2 pt-1">
              {field.options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.value}
                    {...register(field.fieldName)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          );
        }
        // No options → single boolean checkbox
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
      case 'file':
        return (
          <FileInput
            field={field}
            register={register}
            rules={rules}
            error={error}
            existingUrl={existingValues?.[field.fieldName] || undefined}
            setValue={setValue}
            key={`${field.fieldName}-${existingValues?.[field.fieldName] || 'empty'}`}
          />
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
      {!(field.fieldType === 'checkbox' && !(field.options && field.options.length > 0)) && (
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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm({ mode: 'onBlur' });
  const [existingValues, setExistingValues] = useState({});

  useEffect(() => {
    if (!modules.length) fetchModules();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setIsLoadingRecord(true);
      fetchRecord(moduleSlug, id).then((record) => {
        if (record) {
          // Store the raw record immediately — so file fields (Cloudinary URLs)
          // are always available in existingValues regardless of fields load timing
          setExistingValues(record);

          // Build form defaults — apply date formatting if fields are loaded
          const defaults = {};
          if (fields.length > 0) {
            fields.forEach((f) => {
              if (record[f.fieldName] !== undefined) {
                // NEVER set file input values via reset — browser blocks it for security
                // File fields use existingValues separately for preview
                if (f.fieldType === 'file') return;
                if (f.fieldType === 'datetime-local' && record[f.fieldName])
                  defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 16);
                else if (f.fieldType === 'date' && record[f.fieldName])
                  defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 10);
                else
                  defaults[f.fieldName] = record[f.fieldName];
              }
            });
          } else {
            // fields not yet loaded — copy non-file fields only
            Object.keys(record).forEach((key) => {
              const f = fields.find(fi => fi.fieldName === key);
              if (!f || f.fieldType !== 'file') defaults[key] = record[key];
            });
          }
          reset(defaults);
        }
        setIsLoadingRecord(false);
      });
    }
  }, [id, module]);

  // Re-apply date formatting once fields load (edge case: fields arrive after record)
  useEffect(() => {
    if (!isEdit || !fields.length || !Object.keys(existingValues).length) return;
    const defaults = {};
    fields.forEach((f) => {
      if (existingValues[f.fieldName] !== undefined) {
        if (f.fieldType === 'file') return; // skip — file inputs managed separately
        if (f.fieldType === 'datetime-local' && existingValues[f.fieldName])
          defaults[f.fieldName] = new Date(existingValues[f.fieldName]).toISOString().slice(0, 16);
        else if (f.fieldType === 'date' && existingValues[f.fieldName])
          defaults[f.fieldName] = new Date(existingValues[f.fieldName]).toISOString().slice(0, 10);
        else
          defaults[f.fieldName] = existingValues[f.fieldName];
      }
    });
    reset(defaults);
  }, [fields.length]);

  const onSubmit = async (formData) => {
    const hasFileField = fields.some((f) => f.fieldType === 'file');

    if (hasFileField) {
      const fd = new FormData();
      fields.forEach((f) => {
        if (f.fieldType === 'file') {
          // fileList is a FileList from <input type="file">
          const fileList = formData[f.fieldName];
          // fileList should always be FileList or undefined — never a string now
          // (file fields excluded from reset())
          const hasNewFile = (fileList instanceof FileList && fileList.length > 0) ||
                             (fileList && fileList[0] instanceof File);

          if (hasNewFile) {
            const fileObj = fileList instanceof FileList ? fileList[0] : fileList[0];
            fd.append(f.fieldName, fileObj);
          } else {
            // No new file — preserve existing Cloudinary URL as plain text field
            const existing = existingValues[f.fieldName];
            if (existing) fd.append(f.fieldName, existing);
            // If no existing either — skip, backend will leave DB value unchanged
          }
        } else if (f.fieldType === 'checkbox') {
          const val = formData[f.fieldName];
          const arr = Array.isArray(val) ? val : (val ? [val] : []);
          arr.forEach((v) => fd.append(f.fieldName, v));
        } else if (f.fieldType === 'number' || f.fieldType === 'range') {
          const v = formData[f.fieldName];
          if (v !== undefined && v !== '') fd.append(f.fieldName, String(v));
        } else {
          const v = formData[f.fieldName];
          if (v !== undefined && v !== '') fd.append(f.fieldName, v);
        }
      });
      const result = isEdit
        ? await updateRecord(moduleSlug, id, fd, true)
        : await createRecord(moduleSlug, fd, true);
      if (result.success) navigate(`/${moduleSlug}`);
      return;
    }

    // No file fields — send plain JSON
    const payload = {};
    fields.forEach((f) => {
      if (f.fieldType === 'checkbox') {
        const val = formData[f.fieldName];
        payload[f.fieldName] = Array.isArray(val) ? val : (val ? [val] : []);
        return;
      }
      payload[f.fieldName] = formData[f.fieldName] ?? '';
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
                  setValue={setValue}
                  existingValues={existingValues}
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