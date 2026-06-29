import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useModuleStore from '../context/moduleStore';
import { format } from '../utils/dateUtils';
import { FIELD_TYPES } from '../utils/fieldTypes';

const FieldPreview = ({ field, index }) => {
  const fieldTypeMeta = FIELD_TYPES.find((t) => t.value === field.fieldType);

  const renderPreview = () => {
    switch (field.fieldType) {
      case 'checkbox': {
        const isSingle = field.selectionType === 'single';
        return (
          <div className="mt-2">
            {(field.options?.length
              ? field.options
              : [{ label: field.fieldLabel, value: field.fieldName }]
            ).map((opt) => (
              <div key={opt.value} className="form-check mb-1">
                <input
                  type={field.options?.length && isSingle ? 'radio' : 'checkbox'}
                  className="form-check-input"
                  disabled
                />
                <label className="form-check-label text-muted small">{opt.label}</label>
              </div>
            ))}
            {field.options?.length > 0 && (
              <span className="badge rounded-pill text-bg-light border field-type-badge">
                {isSingle ? 'Single selection' : 'Multiple selection'}
              </span>
            )}
          </div>
        );
      }
      case 'radio':
        return (
          <div className="mt-2">
            {(field.options?.length
              ? field.options
              : [{ label: 'Option 1', value: 'opt1' }, { label: 'Option 2', value: 'opt2' }]
            ).map((opt) => (
              <div key={opt.value} className="form-check mb-1">
                <input type="radio" className="form-check-input" disabled />
                <label className="form-check-label text-muted small">{opt.label}</label>
              </div>
            ))}
          </div>
        );
      case 'select':
        return (
          <select className="form-select form-select-sm mt-2" disabled>
            <option>{field.placeholder || `Select ${field.fieldLabel.toLowerCase()}…`}</option>
            {field.options?.map((opt) => (
              <option key={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            rows={2}
            className="form-control form-control-sm mt-2"
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}…`}
            disabled
          />
        );
      default:
        return (
          <input
            type="text"
            className="form-control form-control-sm mt-2"
            placeholder={field.placeholder || `Enter ${field.fieldLabel.toLowerCase()}…`}
            disabled
          />
        );
    }
  };

  return (
    <div className="field-preview-card">
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="field-preview-card__num">{index + 1}</span>
          <div>
            <p className="field-preview-card__label">
              {field.fieldLabel}
              {field.validations?.required && <span className="text-danger ms-1">*</span>}
            </p>
            <code className="field-preview-card__slug">{field.fieldName}</code>
          </div>
        </div>
        <span className="badge rounded-pill text-bg-light border field-type-badge">
          {fieldTypeMeta?.label || field.fieldType}
        </span>
      </div>

      {field.showInTable === false && (
        <span
          className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-1 mb-2"
          style={{ fontSize: 9, color: '#9ca3af', width: 'fit-content' }}
        >
          <i className="ti ti-eye-off fs-9px" /> Hidden in table
        </span>
      )}

      <div style={{ pointerEvents: 'none' }}>{renderPreview()}</div>

      {field.validations && Object.values(field.validations).some(Boolean) && (
        <div className="d-flex flex-wrap gap-1 mt-2 pt-2 border-top">
          {field.validations.required  && <span className="badge text-bg-danger  rounded-pill fs-9px">Required</span>}
          {field.validations.minLength && <span className="badge text-bg-warning rounded-pill fs-9px">Min {field.validations.minLength} chars</span>}
          {field.validations.maxLength && <span className="badge text-bg-warning rounded-pill fs-9px">Max {field.validations.maxLength} chars</span>}
          {field.validations.min !== undefined && <span className="badge text-bg-warning rounded-pill fs-9px">Min {field.validations.min}</span>}
          {field.validations.max !== undefined && <span className="badge text-bg-warning rounded-pill fs-9px">Max {field.validations.max}</span>}
        </div>
      )}
    </div>
  );
};

const INFO_STATS = (module) => [
  { icon: 'ti-layout-grid', label: 'Fields',  value: `${module.fields?.length || 0} field${module.fields?.length !== 1 ? 's' : ''}` },
  { icon: 'ti-toggle-right', label: 'Status', value: module.isActive ? 'Active' : 'Inactive' },
  { icon: 'ti-calendar',     label: 'Created', value: format(new Date(module.createdAt), 'MMM d, yyyy') },
  { icon: 'ti-user',         label: 'By',      value: module.createdBy?.name || 'Super Admin' },
];

const ModuleDetailPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { fetchModule, currentModule, deleteModule, toggleStatus, isLoading } = useModuleStore();

  useEffect(() => { fetchModule(id); }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Delete "${currentModule.moduleName}"? This cannot be undone.`)) {
      const result = await deleteModule(id);
      if (result.success) navigate('/modules');
    }
  };

  if (isLoading || !currentModule) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  const fieldCount = currentModule.fields?.length || 0;

  return (
    <div className="module-detail animate-slide-up">
      {/* ── Header ── */}
      <div className="detail-header">
        <div className="detail-header__left">
          <button
            onClick={() => navigate('/modules')}
            className="btn btn-light btn-icon btn-sm rounded-2"
          >
            <i className="ti ti-arrow-left" />
          </button>
          <div className="d-flex align-items-center gap-3">
            <div className="detail-header__icon">
              <i className="ti ti-box fs-5" />
            </div>
            <div>
              <h1 className="detail-header__title">{currentModule.moduleName}</h1>
              <code className="detail-header__slug">/{currentModule.moduleSlug}</code>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={() => toggleStatus(id)}
            className={`btn btn-sm d-flex align-items-center gap-1 ${currentModule.isActive ? 'btn-outline-success' : 'btn-outline-secondary'}`}
          >
            <i className={`ti ${currentModule.isActive ? 'ti-toggle-right' : 'ti-toggle-left'}`} />
            {currentModule.isActive ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => navigate(`/modules/${id}/edit`)}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          >
            <i className="ti ti-edit" /> Edit
          </button>
          <button onClick={handleDelete} className="btn btn-outline-danger btn-sm">
            <i className="ti ti-trash" />
          </button>
        </div>
      </div>

      {/* ── Info Card ── */}
      <div className="card overflow-hidden mb-4">
        <div className="info-card-accent" />
        <div className="row g-0">
          {INFO_STATS(currentModule).map((s) => (
            <div key={s.label} className="col-6 col-sm-3 border-end">
              <div className="info-stat">
                <div className="info-stat__icon">
                  <i className={`ti ${s.icon} fs-14px`}/>
                </div>
                <div>
                  <p className="info-stat__label">{s.label}</p>
                  <p className="info-stat__value">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {currentModule.description && (
          <div className="px-4 py-3 border-top">
            <p className="text-muted small mb-0">{currentModule.description}</p>
          </div>
        )}
      </div>

      {/* ── Fields Preview ── */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="fs-6 fw-bold mb-0">Fields Preview</h2>
          <p className="text-muted mb-0 fs-12px">
            {fieldCount} field{fieldCount !== 1 ? 's' : ''} defined
          </p>
        </div>
        <button
          onClick={() => navigate(`/modules/${id}/edit`)}
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
        >
          <i className="ti ti-edit" /> Edit Fields
        </button>
      </div>

      {fieldCount > 0 ? (
        <div className="row g-3">
          {currentModule.fields.map((f, i) => (
            <div key={f._id} className="col-md-6">
              <FieldPreview field={f} index={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center p-5 border-dashed-gray">
          <div className="icon-shape icon-md bg-light rounded-3 mx-auto mb-3">
            <i className="ti ti-box-seam fs-5 text-muted" />
          </div>
          <p className="fw-semibold mb-1">No fields defined yet</p>
          <p className="text-muted small mb-3">Add fields to start collecting data.</p>
          <div>
            <button
              onClick={() => navigate(`/modules/${id}/edit`)}
              className="btn btn-primary btn-sm"
            >
              <i className="ti ti-plus me-1" /> Add Fields
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDetailPage;
