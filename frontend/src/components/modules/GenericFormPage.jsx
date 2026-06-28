/**
 * GenericFormPage — shared renderer for all auto-generated module form pages.
 */
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useModuleDataStore from '../../context/moduleDataStore';

const GenericFormPage = ({ slug, name, fields = [] }) => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);
  const { fetchRecord, createRecord, updateRecord, isSubmitting } = useModuleDataStore();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ mode: 'onBlur' });

  useEffect(() => {
    if (isEdit && id) {
      fetchRecord(slug, id).then((record) => { if (record) reset(record); });
    }
  }, [id]);

  const onSubmit = async (data) => {
    const result = isEdit
      ? await updateRecord(slug, id, data)
      : await createRecord(slug, data);
    if (result.success) navigate(`/${slug}`);
  };

  const renderField = (f) => {
    const error = errors?.[f.fieldName];
    const cls   = `form-control${error ? ' is-invalid' : ''}`;
    const rules = {
      required:  f.required  ? `${f.fieldLabel} is required` : false,
      minLength: f.minLength  ? { value: f.minLength, message: `Min ${f.minLength} chars` } : undefined,
      maxLength: f.maxLength  ? { value: f.maxLength, message: `Max ${f.maxLength} chars` } : undefined,
    };

    switch (f.fieldType) {
      case 'textarea':
        return <textarea {...register(f.fieldName, rules)} rows={3} placeholder={`Enter ${f.fieldLabel}…`} className={cls} style={{ resize: 'none' }} />;
      case 'select':
        return (
          <select {...register(f.fieldName, rules)} className={`form-select${error ? ' is-invalid' : ''}`}>
            <option value="">Select {f.fieldLabel}…</option>
            {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'checkbox':
        return (
          <div className="form-check">
            <input type="checkbox" {...register(f.fieldName)} className="form-check-input" id={f.fieldName} />
            <label className="form-check-label small" htmlFor={f.fieldName}>{f.fieldLabel}</label>
          </div>
        );
      case 'radio':
        return (
          <div>
            {(f.options || []).map((o) => (
              <div key={o.value} className="form-check">
                <input type="radio" value={o.value} {...register(f.fieldName, rules)} className="form-check-input" id={`${f.fieldName}_${o.value}`} />
                <label className="form-check-label small" htmlFor={`${f.fieldName}_${o.value}`}>{o.label}</label>
              </div>
            ))}
          </div>
        );
      case 'number':
        return <input type="number" {...register(f.fieldName, { ...rules, valueAsNumber: true })} placeholder={`Enter ${f.fieldLabel}…`} className={cls} />;
      case 'color':
        return <input type="color" {...register(f.fieldName, rules)} className="form-control form-control-color" style={{ width: 80, height: 40 }} />;
      default:
        return <input type={f.fieldType || 'text'} {...register(f.fieldName, rules)} placeholder={`Enter ${f.fieldLabel}…`} className={cls} />;
    }
  };

  return (
    <div className="form-page animate-slide-up">
      {/* Header */}
      <div className="form-page__header">
        <button
          onClick={() => navigate(`/${slug}`)}
          className="btn btn-light btn-icon btn-sm rounded-2"
        >
          <i className="ti ti-arrow-left" />
        </button>
        <div className="d-flex align-items-center gap-3">
          <div className="form-page__icon">
            <i className="ti ti-database fs-5" />
          </div>
          <div>
            <h1 className="form-page__title">{isEdit ? 'Edit' : 'New'} {name}</h1>
            <p className="form-page__sub">{isEdit ? 'Update existing record' : 'Create a new record'}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-4 mb-4">
            {fields.map((f) => (
              <div key={f.fieldName} className={`col-${f.colSpan === 'half' ? 'md-6' : '12'}`}>
                {f.fieldType !== 'checkbox' && (
                  <label className="form-label d-flex align-items-center gap-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    {f.fieldLabel}
                    {f.required && <span className="text-danger">*</span>}
                  </label>
                )}
                {renderField(f)}
                {errors[f.fieldName] && (
                  <div className="invalid-feedback d-block">{errors[f.fieldName].message}</div>
                )}
              </div>
            ))}
          </div>

          <div className="form-footer">
            <button
              type="button"
              onClick={() => navigate(`/${slug}`)}
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
      </div>
    </div>
  );
};

export default GenericFormPage;
