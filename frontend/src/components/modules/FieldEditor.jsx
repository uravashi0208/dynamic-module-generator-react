import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FIELD_TYPES, getFieldTypeIcon } from '../../utils/fieldTypes';

const TYPES_WITH_OPTIONS = ['select', 'radio', 'checkbox'];

/* ── Field Card ── */
const FieldCard = ({ index, onRemove }) => {
  const [expanded, setExpanded]               = useState(true);
  const [showValidations, setShowValidations] = useState(false);
  const [optionInput, setOptionInput]         = useState('');

  const { register, watch, setValue, formState: { errors } } = useFormContext();

  const fieldType     = watch(`fields.${index}.fieldType`);
  const fieldLabel    = watch(`fields.${index}.fieldLabel`);
  const options       = watch(`fields.${index}.options`) || [];
  const showInTable   = watch(`fields.${index}.showInTable`);
  const selectionType = watch(`fields.${index}.selectionType`) || 'multiple';
  const fieldErrors   = errors?.fields?.[index];
  const hasError      = Object.keys(fieldErrors || {}).length > 0;
  const isCheckbox    = fieldType === 'checkbox';

  const addOption = () => {
    if (!optionInput.trim()) return;
    setValue(`fields.${index}.options`, [
      ...options,
      {
        label: optionInput.trim(),
        value: optionInput.trim().toLowerCase().replace(/\s+/g, '_'),
      },
    ]);
    setOptionInput('');
  };
  const removeOption = (i) =>
    setValue(`fields.${index}.options`, options.filter((_, idx) => idx !== i));

  return (
    <div className={`fe-card${expanded ? ' fe-card--expanded' : ''}${hasError ? ' fe-card--error' : ''}`}>
      {/* Header */}
      <div className="fe-card__header" onClick={() => setExpanded(!expanded)}>
        <i className="ti ti-grip-vertical" style={{ fontSize: 13, color: '#cbd5e1' }} />
        <div className="fe-card__num">{index + 1}</div>
        <div className="fe-card__type-icon">
          <i className={getFieldTypeIcon(fieldType)} />
        </div>
        <div className="fe-card__info">
          <p className={`fe-card__name${!fieldLabel ? ' fe-card__name--untitled' : ''}`}>
            {fieldLabel || 'Untitled Field'}
          </p>
          <div className="fe-card__badges">
            <span className="fe-badge fe-badge--type">
              {FIELD_TYPES.find((t) => t.value === fieldType)?.label || 'Text'}
            </span>
            {showInTable !== false ? (
              <span className="fe-badge fe-badge--visible">
                <i className="ti ti-table" style={{ fontSize: 8 }} /> In table
              </span>
            ) : (
              <span className="fe-badge fe-badge--hidden">
                <i className="ti ti-eye-off" style={{ fontSize: 8 }} /> Hidden
              </span>
            )}
          </div>
        </div>
        <div className="fe-card__actions">
          {hasError && <i className="ti ti-alert-circle" style={{ fontSize: 14, color: '#ef4444' }} />}
          <button
            type="button"
            className="fe-del-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <i className="ti ti-trash" />
          </button>
          <i className="ti ti-chevron-down fe-chevron" />
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="fe-card__body">
          {/* Label + Type */}
          <div className="fe-row fe-row--2">
            <div>
              <label className="fe-label">Field Label <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                {...register(`fields.${index}.fieldLabel`)}
                placeholder="e.g. First Name"
                className={`fe-input${fieldErrors?.fieldLabel ? ' fe-input--error' : ''}`}
              />
              {fieldErrors?.fieldLabel && (
                <p className="fe-input-err">{fieldErrors.fieldLabel.message}</p>
              )}
            </div>
            <div>
              <label className="fe-label">Field Type <span style={{ color: '#ef4444' }}>*</span></label>
              <select {...register(`fields.${index}.fieldType`)} className="fe-select">
                {Object.entries(
                  FIELD_TYPES.reduce((acc, ft) => {
                    if (!acc[ft.category]) acc[ft.category] = [];
                    acc[ft.category].push(ft);
                    return acc;
                  }, {})
                ).map(([cat, types]) => (
                  <optgroup key={cat} label={`── ${cat}`}>
                    {types.map((ft) => (
                      <option key={ft.value} value={ft.value}>{ft.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Show in table + Checkbox selection type */}
          <div className={`fe-row${isCheckbox ? ' fe-row--2' : ' fe-row--1'}`} style={{ marginBottom: 12 }}>
            <label className={`fe-toggle-card${showInTable !== false ? ' fe-toggle-card--active' : ''}`}>
              <input
                type="checkbox"
                className="form-check-input mt-0"
                {...register(`fields.${index}.showInTable`)}
              />
              <div>
                <p className="fe-toggle-card__title">
                  <i className="ti ti-table me-1" style={{ color: '#22c55e' }} /> Show in Table
                </p>
                <p className="fe-toggle-card__desc">Display as a column in the records table</p>
              </div>
            </label>
            {isCheckbox && (
              <div>
                <label className="fe-label">
                  <i className="ti ti-list-check me-1" /> Selection Type
                </label>
                <select
                  {...register(`fields.${index}.selectionType`)}
                  className="fe-select"
                  defaultValue={selectionType}
                >
                  <option value="multiple">Multiple selection</option>
                  <option value="single">Single selection only</option>
                </select>
              </div>
            )}
          </div>

          {/* Placeholder + Default */}
          <div className="fe-row fe-row--2" style={{ marginBottom: 12 }}>
            {!['checkbox', 'radio', 'file', 'color', 'range', 'date', 'datetime-local'].includes(fieldType) && (
              <div>
                <label className="fe-label">Placeholder</label>
                <input
                  {...register(`fields.${index}.placeholder`)}
                  placeholder="Hint text…"
                  className="fe-input"
                />
              </div>
            )}
            {!['file', 'password', 'checkbox'].includes(fieldType) && (
              <div>
                <label className="fe-label">Default Value</label>
                <input
                  {...register(`fields.${index}.defaultValue`)}
                  placeholder="Pre-filled value"
                  className="fe-input"
                />
              </div>
            )}
          </div>

          {/* Options */}
          {TYPES_WITH_OPTIONS.includes(fieldType) && (
            <div className="fe-options-box">
              <div className="fe-options-header">
                <span className="fe-options-label">
                  <i className="ti ti-list" /> Options
                </span>
                <span className="fe-options-count">
                  {options.length} option{options.length !== 1 ? 's' : ''}
                </span>
              </div>
              {options.map((opt, oi) => (
                <div key={oi} className="fe-option-item">
                  <div className="fe-option-dot" />
                  <span className="fe-option-label">{opt.label}</span>
                  <code className="fe-option-value">{opt.value}</code>
                  <button type="button" className="fe-option-remove" onClick={() => removeOption(oi)}>
                    <i className="ti ti-x" />
                  </button>
                </div>
              ))}
              <div className="fe-option-add-row">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                  placeholder="Type option, press Enter"
                  className="fe-input"
                  style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={addOption}
                  disabled={!optionInput.trim()}
                  className="fe-option-add-btn"
                >
                  <i className="ti ti-plus" /> Add
                </button>
              </div>
            </div>
          )}

          {/* Validations */}
          <div>
            <button
              type="button"
              className={`fe-val-toggle ${showValidations ? 'fe-val-toggle--open' : 'fe-val-toggle--closed'}`}
              onClick={() => setShowValidations(!showValidations)}
            >
              <span><i className="ti ti-adjustments me-2" />Validation Rules</span>
              <i className={`ti ${showValidations ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 12 }} />
            </button>
            {showValidations && (
              <div className="fe-val-body">
                <div className="fe-val-grid">
                  <label className="fe-req-toggle">
                    <input {...register(`fields.${index}.validations.required`)} type="checkbox" />
                    <div>
                      <p className="fe-req-toggle__title">Required</p>
                      <p className="fe-req-toggle__desc">Must fill this</p>
                    </div>
                  </label>

                  {['text', 'email', 'password', 'textarea', 'url', 'tel'].includes(fieldType) && (
                    <>
                      <div>
                        <label className="fe-label">Min Length</label>
                        <input
                          {...register(`fields.${index}.validations.minLength`, { valueAsNumber: true })}
                          type="number" min="0" placeholder="0"
                          className="fe-input"
                        />
                      </div>
                      <div>
                        <label className="fe-label">Max Length</label>
                        <input
                          {...register(`fields.${index}.validations.maxLength`, { valueAsNumber: true })}
                          type="number" min="0" placeholder="255"
                          className="fe-input"
                        />
                      </div>
                    </>
                  )}

                  {['number', 'range'].includes(fieldType) && (
                    <>
                      <div>
                        <label className="fe-label">Min</label>
                        <input
                          {...register(`fields.${index}.validations.min`, { valueAsNumber: true })}
                          type="number" placeholder="0"
                          className="fe-input"
                        />
                      </div>
                      <div>
                        <label className="fe-label">Max</label>
                        <input
                          {...register(`fields.${index}.validations.max`, { valueAsNumber: true })}
                          type="number" placeholder="100"
                          className="fe-input"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Field Editor ── */
const FieldEditor = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'fields' });

  const addField = () => append({
    fieldLabel: '', fieldType: 'text', placeholder: '', defaultValue: '',
    options: [], validations: { required: false }, isVisible: true,
    showInTable: true, selectionType: 'multiple', colSpan: 'full',
    order: fields.length + 1,
  });

  return (
    <div>
      {/* Header */}
      <div className="fe-editor-header">
        <div className="fe-count-pill">
          <div className="fe-count-badge">{fields.length}</div>
          <p className="fe-count-text mb-0">
            {fields.length === 0
              ? 'No fields yet'
              : `${fields.length} field${fields.length !== 1 ? 's' : ''} defined`}
          </p>
        </div>
        <button type="button" className="fe-add-btn" onClick={addField}>
          <i className="ti ti-plus" /> Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <button type="button" className="fe-empty" onClick={addField}>
          <div className="fe-empty__icon">
            <i className="ti ti-cursor-text" />
          </div>
          <p className="fe-empty__title">Add your first field</p>
          <p className="fe-empty__sub">Text, email, dropdowns, date pickers and more</p>
          <span className="fe-add-btn d-inline-flex">
            <i className="ti ti-plus" /> Add Field
          </span>
        </button>
      ) : (
        <>
          {fields.map((field, index) => (
            <FieldCard key={field.id} index={index} onRemove={() => remove(index)} />
          ))}
          <button type="button" className="fe-add-more" onClick={addField}>
            <i className="ti ti-plus me-2" /> Add another field
          </button>
        </>
      )}
    </div>
  );
};

export default FieldEditor;
