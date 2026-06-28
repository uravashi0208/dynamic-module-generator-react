import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/* ── Field preview renderer ── */
const PreviewField = ({ field }) => {
  const {
    fieldLabel, fieldType, placeholder, defaultValue,
    options = [], validations = {}, selectionType,
  } = field;
  const isRequired = validations?.required;

  const Label = () => (
    <label className="fp-label d-block">
      {fieldLabel
        ? fieldLabel
        : <span className="fp-label--placeholder">Untitled Field</span>}
      {isRequired && <span className="fp-required">*</span>}
    </label>
  );

  switch (fieldType) {
    case 'textarea':
      return (
        <div>
          <Label />
          <textarea
            readOnly rows={2}
            placeholder={placeholder || `Enter ${fieldLabel || 'value'}…`}
            className="fp-input"
            style={{ resize: 'none' }}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <select disabled className="fp-input" style={{ appearance: 'none', paddingRight: 28, cursor: 'not-allowed', background: '#fafafa' }}>
              <option>Select {fieldLabel || 'option'}…</option>
              {options.map((o, i) => <option key={i}>{o.label}</option>)}
            </select>
            <i className="ti ti-chevron-down fp-icon-right" />
          </div>
          {!options.length && (
            <p className="fp-no-options"><i className="ti ti-alert-circle me-1" />Add options in editor</p>
          )}
        </div>
      );

    case 'radio':
      return (
        <div>
          <Label />
          {!options.length ? (
            <p className="fp-no-options"><i className="ti ti-alert-circle me-1" />Add options in editor</p>
          ) : (
            <div className="d-flex flex-wrap gap-1 mt-1">
              {options.map((o, i) => (
                <label key={i} className="fp-radio-pill">
                  <span className="fp-radio-dot" /> {o.label}
                </label>
              ))}
            </div>
          )}
        </div>
      );

    case 'checkbox':
      if (options.length) return (
        <div>
          <Label />
          <div className="d-flex flex-wrap gap-1 mt-1">
            {options.map((o, i) => (
              <label key={i} className="fp-checkbox-pill">
                <span className="fp-checkbox-box" /> {o.label}
              </label>
            ))}
          </div>
          {selectionType === 'single' && (
            <p className="fp-single-hint">Single selection only</p>
          )}
        </div>
      );
      return (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'default' }}>
          <span className="fp-checkbox-box" />
          <span className="fp-label mb-0">
            {fieldLabel || <span className="fp-label--placeholder">Checkbox label</span>}
            {isRequired && <span className="fp-required">*</span>}
          </span>
        </label>
      );

    case 'file':
      return (
        <div>
          <Label />
          <div className="fp-file-zone">
            <i className="ti ti-cloud-upload fp-file-icon" />
            <p className="fp-file-text">Click to upload</p>
          </div>
        </div>
      );

    case 'color':
      return (
        <div>
          <Label />
          <div className="fp-color-swatch">
            <span className="fp-color-swatch__box" style={{ background: defaultValue || '#E66239' }} />
            <span className="fp-color-swatch__text">{defaultValue || '#E66239'}</span>
          </div>
        </div>
      );

    case 'range':
      return (
        <div>
          <Label />
          <input
            type="range" readOnly
            min={validations?.min ?? 0}
            max={validations?.max ?? 100}
            defaultValue={defaultValue || 50}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div className="fp-range-labels">
            <span>{validations?.min ?? 0}</span>
            <span>{validations?.max ?? 100}</span>
          </div>
        </div>
      );

    case 'password':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <input type="password" readOnly placeholder={placeholder || 'Enter password…'} className="fp-input" />
            <i className="ti ti-eye fp-icon-right" />
          </div>
        </div>
      );

    case 'date':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <input type="text" readOnly placeholder="MM / DD / YYYY" className="fp-input" style={{ paddingRight: 30 }} />
            <i className="ti ti-calendar fp-icon-right" />
          </div>
        </div>
      );

    case 'datetime-local':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <input type="text" readOnly placeholder="MM / DD / YYYY  --:-- --" className="fp-input" style={{ paddingRight: 30 }} />
            <i className="ti ti-calendar-time fp-icon-right" />
          </div>
        </div>
      );

    case 'number':
      return (
        <div>
          <Label />
          <input type="number" readOnly placeholder={placeholder || '0'} defaultValue={defaultValue} className="fp-input" />
        </div>
      );

    case 'email':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <i className="ti ti-mail fp-icon-left" />
            <input type="text" readOnly placeholder={placeholder || 'you@example.com'} className="fp-input fp-input--icon-left" />
          </div>
        </div>
      );

    case 'url':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <i className="ti ti-link fp-icon-left" />
            <input type="text" readOnly placeholder={placeholder || 'https://…'} className="fp-input fp-input--icon-left" />
          </div>
        </div>
      );

    case 'tel':
      return (
        <div>
          <Label />
          <div className="position-relative">
            <i className="ti ti-phone fp-icon-left" />
            <input type="text" readOnly placeholder={placeholder || '+1 (555) 000-0000'} className="fp-input fp-input--icon-left" />
          </div>
        </div>
      );

    default:
      return (
        <div>
          <Label />
          <input
            type="text" readOnly
            placeholder={placeholder || `Enter ${fieldLabel || 'value'}…`}
            defaultValue={defaultValue}
            className="fp-input"
          />
        </div>
      );
  }
};

/* ── Main Preview Panel ── */
const FormPreviewPanel = () => {
  const { watch, setValue, getValues } = useFormContext();
  const fields     = watch('fields') || [];
  const moduleName = watch('moduleName');

  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragNodeRef           = useRef(null);

  const visibleFields = fields.filter((f) => f.isVisible !== false);

  const getWidth    = (f) => f.colSpan || 'full';
  const toggleWidth = (f) => {
    const allFields = getValues('fields');
    const idx = allFields.findIndex(
      (af) => (af.fieldName && af.fieldName === f.fieldName) || (af.id && af.id === f.id)
    );
    if (idx === -1) return;
    const newSpan = (allFields[idx].colSpan || 'full') === 'half' ? 'full' : 'half';
    const updated = [...allFields];
    updated[idx] = { ...updated[idx], colSpan: newSpan };
    setValue('fields', updated, { shouldDirty: true });
  };

  const onDragStart = (e, i) => {
    setDragIdx(i);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragNodeRef.current) dragNodeRef.current.style.opacity = '0.4'; }, 0);
  };
  const onDragEnter = (i) => setOverIdx(i);
  const onDragEnd   = () => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = '1';
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const curr = [...fields];
      const [moved] = curr.splice(dragIdx, 1);
      curr.splice(overIdx, 0, moved);
      setValue('fields', curr, { shouldDirty: true });
    }
    setDragIdx(null); setOverIdx(null); dragNodeRef.current = null;
  };
  const onDragOver = (e) => e.preventDefault();

  /* Group into rows by width */
  const buildRows = () => {
    const rows = [];
    let i = 0;
    while (i < visibleFields.length) {
      const f      = visibleFields[i];
      const origIdx = fields.indexOf(f);
      const w       = getWidth(f);
      if (w === 'half' && i + 1 < visibleFields.length && getWidth(visibleFields[i + 1]) === 'half') {
        rows.push([
          { field: f, origIdx },
          { field: visibleFields[i + 1], origIdx: fields.indexOf(visibleFields[i + 1]) },
        ]);
        i += 2;
      } else {
        rows.push([{ field: f, origIdx }]);
        i += 1;
      }
    }
    return rows;
  };

  const rows = buildRows();

  return (
    <div className="fp-panel">
      {/* Panel header */}
      <div className="fp-panel__header">
        <div className="fp-panel__header-icon">
          <i className="ti ti-eye" style={{ fontSize: 13, color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p className="fp-panel__title">Form Preview</p>
          <p className="fp-panel__hint">Drag to reorder · Click ⊞ for half-width</p>
        </div>
        <span className={`fp-panel__count ${visibleFields.length > 0 ? 'fp-panel__count--active' : 'fp-panel__count--empty'}`}>
          {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mock browser chrome */}
      <div className="fp-chrome">
        <div className="fp-chrome__bar">
          <span className="fp-chrome__dot--red" />
          <span className="fp-chrome__dot--yellow" />
          <span className="fp-chrome__dot--green" />
          <span className="fp-chrome__url">
            {moduleName
              ? `/${moduleName.toLowerCase().replace(/\s+/g, '-')}/new`
              : '/module/new'}
          </span>
        </div>
      </div>

      {/* Form card */}
      <div className="fp-body">
        <div className="fp-card">
          <div className="fp-card__title-area">
            <h3 className="fp-card__title">
              {moduleName || <span className="fp-card__title--placeholder">Module Name</span>}
            </h3>
            <p className="fp-card__sub">Fill in all required fields to continue</p>
          </div>

          <div className="fp-fields">
            {visibleFields.length === 0 ? (
              <div className="fp-empty-state">
                <div className="fp-empty-state__icon">
                  <i className="ti ti-layout-grid" style={{ fontSize: 18, color: '#d1d5db' }} />
                </div>
                <p className="fp-empty-state__text">Add fields to see preview</p>
                <p className="fp-empty-state__sub">Fields appear here as you add them →</p>
              </div>
            ) : (
              <div className="d-flex flex-column">
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="d-flex gap-2 mb-3">
                    {row.map(({ field, origIdx }) => {
                      const w      = getWidth(field);
                      const isOver = overIdx === origIdx;
                      return (
                        <div
                          key={origIdx}
                          draggable
                          onDragStart={(e) => onDragStart(e, origIdx)}
                          onDragEnter={() => onDragEnter(origIdx)}
                          onDragEnd={onDragEnd}
                          onDragOver={onDragOver}
                          className={`fp-field-wrap${isOver ? ' fp-field-wrap--over' : ''}`}
                          style={{ flex: w === 'half' ? '0 0 calc(50% - 5px)' : '1 1 100%' }}
                        >
                          {/* Toolbar */}
                          <div className="fp-toolbar">
                            <button
                              type="button"
                              title={w === 'half' ? 'Make full width' : 'Make half width'}
                              onClick={(e) => { e.stopPropagation(); toggleWidth(field); }}
                              className="fp-toolbar__btn"
                            >
                              {w === 'half' ? '⬜' : '▬'}
                            </button>
                            <span className="fp-toolbar__drag">
                              <i className="ti ti-grip-vertical" style={{ fontSize: 10, color: '#9ca3af' }} />
                            </span>
                          </div>
                          <PreviewField field={field} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          {visibleFields.length > 0 && (
            <div className="fp-submit-area">
              <button type="button" disabled className="fp-submit-btn">Submit</button>
              <button type="button" disabled className="fp-cancel-btn">Cancel</button>
            </div>
          )}
        </div>

        {visibleFields.length > 0 && (
          <p className="fp-hint">
            <i className="ti ti-drag-drop me-1" />
            Drag fields to reorder · Click ▬/⬜ to change width
          </p>
        )}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
