import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useModuleStore from '../context/moduleStore';
import useModuleDataStore from '../context/moduleDataStore';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

/* ── File Input ── */
const FileInput = ({ field, register, rules, error, existingUrl, setValue }) => {
  const isImageUrl = (url) => url && (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) || url.includes('/image/upload/'));
  const [newFile, setNewFile] = useState(null);
  const [cleared, setCleared] = useState(false);
  const { ref, onChange, ...rest } = register(field.fieldName, rules);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewFile(f); setCleared(false); onChange(e);
  };
  const handleClear = (e) => {
    e.preventDefault();
    setNewFile(null); setCleared(true); setValue(field.fieldName, null);
  };

  const showExisting = !cleared && !newFile && existingUrl;
  const [newPreview, setNewPreview] = useState(null);

  useEffect(() => {
    if (!newFile || !newFile.type.startsWith('image/')) { setNewPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setNewPreview(ev.target.result);
    reader.readAsDataURL(newFile);
    return () => reader.abort();
  }, [newFile]);

  const existingFullUrl = existingUrl
    ? (existingUrl.startsWith('http') ? existingUrl : `${API_BASE}${existingUrl}`)
    : null;

  return (
    <div>
      <label className={`file-drop-zone${error ? ' file-drop-zone--error' : ''}`}>
        <div className="file-drop-zone__icon">
          <i className="ti ti-paperclip text-muted fs-16px" />
        </div>
        <div className="flex-grow-1 text-truncate">
          {newFile ? (
            <p className="file-drop-zone__name mb-0 text-truncate">{newFile.name}</p>
          ) : showExisting ? (
            <>
              <p className="file-drop-zone__name mb-0 text-truncate">{existingUrl.split('/').pop()}</p>
              <p className="file-drop-zone__hint mb-0">Click to replace</p>
            </>
          ) : (
            <>
              <p className="file-drop-zone__hint mb-0 fs-13px">Click to upload file</p>
              <p className="file-drop-zone__hint mb-0">PNG, JPG, PDF, DOC up to 10MB</p>
            </>
          )}
        </div>
        {(newFile || showExisting) && (
          <button type="button" onClick={handleClear} className="file-clear-btn">
            <i className="ti ti-x fs-12px" />
          </button>
        )}
        <input type="file" className="d-none" {...rest} ref={ref} onChange={handleChange} />
      </label>

      {showExisting && isImageUrl(existingUrl) && (
        <div className="file-preview">
          <img src={existingFullUrl} alt="current" className="file-preview__img" />
          <span className="file-preview__badge">Current</span>
          <button type="button" onClick={handleClear} className="file-preview__remove">
            <i className="ti ti-x fs-11px" />
          </button>
        </div>
      )}
      {newFile && newPreview && (
        <div className="file-preview">
          <img src={newPreview} alt="new" className="file-preview__img" />
          <span className="file-preview__badge file-preview__badge--new">New</span>
        </div>
      )}
    </div>
  );
};

/* ── Dynamic Field ── */
const DynamicField = ({ field, register, errors, watch, setValue, existingValues }) => {
  const error       = errors?.[field.fieldName];
  const validations = field.validations || {};
  const rules = {
    required: validations.required ? `${field.fieldLabel} is required` : false,
    ...(validations.minLength ? { minLength: { value: validations.minLength, message: `Min ${validations.minLength} chars` } } : {}),
    ...(validations.maxLength ? { maxLength: { value: validations.maxLength, message: `Max ${validations.maxLength} chars` } } : {}),
    ...(validations.min !== undefined ? { min: { value: validations.min, message: `Min value: ${validations.min}` } } : {}),
    ...(validations.max !== undefined ? { max: { value: validations.max, message: `Max value: ${validations.max}` } } : {}),
    ...(field.fieldType === 'email' ? { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } } : {}),
  };
  const cls = `form-control${error ? ' is-invalid' : ''}`;

  const renderInput = () => {
    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            {...register(field.fieldName, rules)}
            rows={4}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}…`}
            className={cls}
            style={{ resize: 'none' }}
          />
        );

      case 'checkbox':
        if (field.options?.length) {
          const isSingle   = field.selectionType === 'single';
          const currentVal = watch(field.fieldName) || [];
          const handleSingleCheck = (optValue) => {
            const checked = Array.isArray(currentVal) ? currentVal.includes(optValue) : currentVal === optValue;
            if (isSingle) setValue(field.fieldName, checked ? [] : [optValue], { shouldDirty: true });
          };
          return (
            <div>
              {field.options.map((opt) => {
                const checked = Array.isArray(currentVal) ? currentVal.includes(opt.value) : currentVal === opt.value;
                return (
                  <div key={opt.value} className="form-check">
                    {isSingle ? (
                      <input
                        type="checkbox" checked={checked}
                        onChange={() => handleSingleCheck(opt.value)}
                        className="form-check-input"
                        id={`${field.fieldName}_${opt.value}`}
                      />
                    ) : (
                      <input
                        type="checkbox" value={opt.value}
                        {...register(field.fieldName)}
                        className="form-check-input"
                        id={`${field.fieldName}_${opt.value}`}
                      />
                    )}
                    <label htmlFor={`${field.fieldName}_${opt.value}`} className="form-check-label fs-13px">
                      {opt.label}
                    </label>
                  </div>
                );
              })}
              {isSingle && (
                <p className="text-muted mb-0 mt-1 fs-10px">
                  <i className="ti ti-info-circle me-1" />Single selection — choose only one
                </p>
              )}
            </div>
          );
        }
        return (
          <div className="form-check">
            <input type="checkbox" id={field.fieldName} {...register(field.fieldName)} className="form-check-input" />
            <label htmlFor={field.fieldName} className="form-check-label fs-13px">{field.fieldLabel}</label>
          </div>
        );

      case 'radio':
        return (
          <div>
            {(field.options || []).map((opt) => (
              <div key={opt.value} className="form-check">
                <input
                  type="radio" value={opt.value}
                  {...register(field.fieldName, rules)}
                  className="form-check-input"
                  id={`${field.fieldName}_${opt.value}`}
                />
                <label htmlFor={`${field.fieldName}_${opt.value}`} className="form-check-label fs-13px">
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'select':
        return (
          <select {...register(field.fieldName, rules)} className={`form-select${error ? ' is-invalid' : ''}`}>
            <option value="">Select {field.fieldLabel}…</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'file':
        return (
          <FileInput
            field={field} register={register} rules={rules} error={error}
            existingUrl={existingValues?.[field.fieldName] || undefined}
            setValue={setValue}
            key={`${field.fieldName}-${existingValues?.[field.fieldName] || 'empty'}`}
          />
        );

      case 'color':
        return (
          <input
            type="color"
            {...register(field.fieldName, rules)}
            className="form-control form-control-color"
            style={{ width: 80, height: 40 }}
          />
        );

      case 'range': {
        const min = validations.min ?? 0;
        const max = validations.max ?? 100;
        const val = watch(field.fieldName) ?? Math.floor((min + max) / 2);
        return (
          <div>
            <input
              type="range"
              {...register(field.fieldName, { ...rules, valueAsNumber: true })}
              min={min} max={max}
              className="form-range"
            />
            <div className="range-labels">
              <span>{min}</span>
              <span className="range-value">{val}</span>
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
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}…`}
            className={cls}
          />
        );

      default:
        return (
          <input
            type={field.fieldType}
            {...register(field.fieldName, rules)}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}…`}
            defaultValue={field.defaultValue || ''}
            className={cls}
          />
        );
    }
  };

  const isWide = ['textarea', 'file', 'checkbox', 'radio'].includes(field.fieldType) ||
    (field.fieldType === 'select' && (field.options || []).length > 4);
  const colClass = isWide ? 'col-12' : (field.colSpan === 'half' ? 'col-md-6' : 'col-12');

  return (
    <div className={colClass}>
      {(field.fieldType !== 'checkbox' || (field.options && field.options.length > 0)) && (
        <label className="form-label d-flex align-items-center gap-1 label-form">
          {field.fieldLabel ? `${field.fieldLabel.charAt(0).toUpperCase()}${field.fieldLabel.slice(1)}` : ''}
          {validations.required && <span className="text-danger">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <div className="invalid-feedback d-block">{error.message}</div>}
    </div>
  );
};

/* ── Main Form Page ── */
const ModuleDataFormPage = () => {
  const { moduleSlug, id } = useParams();
  const navigate           = useNavigate();
  const isEdit             = Boolean(id);

  const { modules, fetchModules }                              = useModuleStore();
  const { createRecord, updateRecord, fetchRecord, isSubmitting } = useModuleDataStore();
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [existingValues, setExistingValues]   = useState({});

  const module     = modules.find((m) => m.moduleSlug === moduleSlug || m.moduleName?.toLowerCase().replace(/\s+/g, '-') === moduleSlug);
  const fields     = module?.fields || [];
  const moduleName = module?.moduleName || moduleSlug;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({ mode: 'onBlur' });

  useEffect(() => { if (!modules.length) fetchModules(); }, []);

  useEffect(() => {
    if (isEdit && id) {
      setIsLoadingRecord(true);
      fetchRecord(moduleSlug, id).then((record) => {
        if (record) {
          setExistingValues(record);
          const defaults = {};
          if (fields.length > 0) {
            fields.forEach((f) => {
              if (record[f.fieldName] !== undefined) {
                if (f.fieldType === 'file') return;
                if (f.fieldType === 'datetime-local' && record[f.fieldName])
                  defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 16);
                else if (f.fieldType === 'date' && record[f.fieldName])
                  defaults[f.fieldName] = new Date(record[f.fieldName]).toISOString().slice(0, 10);
                else defaults[f.fieldName] = record[f.fieldName];
              }
            });
          } else {
            Object.keys(record).forEach((key) => {
              const f = fields.find((fi) => fi.fieldName === key);
              if (!f || f.fieldType !== 'file') defaults[key] = record[key];
            });
          }
          reset(defaults);
        }
        setIsLoadingRecord(false);
      });
    }
  }, [id, module]);

  useEffect(() => {
    if (!isEdit || !fields.length || !Object.keys(existingValues).length) return;
    const defaults = {};
    fields.forEach((f) => {
      if (existingValues[f.fieldName] !== undefined) {
        if (f.fieldType === 'file') return;
        if (f.fieldType === 'datetime-local' && existingValues[f.fieldName])
          defaults[f.fieldName] = new Date(existingValues[f.fieldName]).toISOString().slice(0, 16);
        else if (f.fieldType === 'date' && existingValues[f.fieldName])
          defaults[f.fieldName] = new Date(existingValues[f.fieldName]).toISOString().slice(0, 10);
        else defaults[f.fieldName] = existingValues[f.fieldName];
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
          const fileList  = formData[f.fieldName];
          const hasNewFile = (fileList instanceof FileList && fileList.length > 0) || (fileList && fileList[0] instanceof File);
          if (hasNewFile) fd.append(f.fieldName, fileList instanceof FileList ? fileList[0] : fileList[0]);
          else { const existing = existingValues[f.fieldName]; if (existing) fd.append(f.fieldName, existing); }
        } else if (f.fieldType === 'checkbox') {
          const val = formData[f.fieldName];
          const arr = Array.isArray(val) ? val : (val ? [val] : []);
          arr.forEach((v) => fd.append(f.fieldName, v));
        } else if (f.fieldType === 'number' || f.fieldType === 'range') {
          const v = formData[f.fieldName]; if (v !== undefined && v !== '') fd.append(f.fieldName, String(v));
        } else {
          const v = formData[f.fieldName]; if (v !== undefined && v !== '') fd.append(f.fieldName, v);
        }
      });
      const result = isEdit
        ? await updateRecord(moduleSlug, id, fd, true)
        : await createRecord(moduleSlug, fd, true);
      if (result.success) navigate(`/${moduleSlug}`);
      return;
    }

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
    <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  return (
    <div className="form-page animate-slide-up">
      {/* ── Header ── */}
      <div className="form-page__header">
        <button
          onClick={() => navigate(`/${moduleSlug}`)}
          className="btn btn-light btn-icon btn-sm rounded-2"
        >
          <i className="ti ti-arrow-left" />
        </button>
        <div className="d-flex align-items-center gap-3">
          <div className="form-page__icon">
            <i className="ti ti-database fs-5" />
          </div>
          <div>
            <h1 className="form-page__title">{isEdit ? 'Edit' : 'New'} {moduleName}</h1>
            <p className="form-page__sub">{isEdit ? 'Update record' : 'Create record'}</p>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="card p-4">
        {fields.length === 0 ? (
          <div className="text-center py-4">
            <div className="icon-shape icon-md bg-warning bg-opacity-10 text-warning rounded-3 mx-auto mb-3">
              <i className="ti ti-alert-triangle fs-5" />
            </div>
            <p className="fw-semibold mb-1">No fields defined</p>
            <p className="text-muted small">Go to the module configuration to add fields first.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-4 mb-4">
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
            <div className="form-footer">
              <button
                type="button"
                onClick={() => navigate(`/${moduleSlug}`)}
                disabled={isSubmitting}
                className="btn btn-outline-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary d-flex align-items-center gap-2"
              >
                {isSubmitting
                  ? <><span className="spinner-border spinner-border-sm" /> Saving…</>
                  : <><i className="ti ti-device-floppy" /> {isEdit ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModuleDataFormPage;
