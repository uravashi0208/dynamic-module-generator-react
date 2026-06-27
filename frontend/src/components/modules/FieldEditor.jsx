import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FIELD_TYPES, getFieldTypeIcon } from '../../utils/fieldTypes';

const TYPES_WITH_OPTIONS = ['select', 'radio', 'checkbox'];

/* ── Field Card ── */
const FieldCard = ({ index, onRemove }) => {
  const [expanded, setExpanded]             = useState(true);
  const [showValidations, setShowValidations] = useState(false);
  const [optionInput, setOptionInput]       = useState('');
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  const fieldType     = watch(`fields.${index}.fieldType`);
  const fieldLabel     = watch(`fields.${index}.fieldLabel`);
  const options        = watch(`fields.${index}.options`) || [];
  const showInTable    = watch(`fields.${index}.showInTable`);
  const selectionType  = watch(`fields.${index}.selectionType`) || 'multiple';
  const fieldErrors    = errors?.fields?.[index];
  const hasError       = Object.keys(fieldErrors || {}).length > 0;
  const isCheckbox      = fieldType === 'checkbox';

  const addOption = () => {
    if (!optionInput.trim()) return;
    setValue(`fields.${index}.options`, [...options, {
      label: optionInput.trim(),
      value: optionInput.trim().toLowerCase().replace(/\s+/g, '_'),
    }]);
    setOptionInput('');
  };
  const removeOption = (i) => setValue(`fields.${index}.options`, options.filter((_, idx) => idx !== i));

  return (
    <div className={`card mb-3${hasError ? ' border-danger' : ''}`}>
      {/* Card header */}
      <div className="card-header d-flex align-items-center gap-2 py-2 px-3"
        style={{ background: expanded ? 'var(--gray-50)' : '#fff', cursor:'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <i className="ti ti-grip-vertical text-muted" style={{ fontSize:14 }} />
        <span className="d-flex align-items-center justify-content-center rounded-circle bg-light text-muted fw-bold"
          style={{ width:18, height:18, fontSize:9, flexShrink:0 }}>{index + 1}</span>
        <div className="icon-shape rounded-2 flex-shrink-0"
          style={{ width:28, height:28, background:'rgba(230,98,57,.12)', color:'var(--primary)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          <i className={getFieldTypeIcon(fieldType)} style={{ fontSize:13 }} />
        </div>
        <div className="flex-grow-1 min-width-0">
          <p className="fw-semibold mb-0 text-truncate" style={{ fontSize:13 }}>
            {fieldLabel || <span className="text-muted fst-italic fw-normal">Untitled Field</span>}
          </p>
          <span className="badge rounded-pill text-bg-light border" style={{ fontSize:9 }}>
            {FIELD_TYPES.find((t) => t.value === fieldType)?.label || 'Text'}
          </span>
          {showInTable !== false ? (
            <span className="badge rounded-pill text-bg-light border ms-1" style={{ fontSize:9, color:'#16a34a', borderColor:'#bbf7d0' }}>
              <i className="ti ti-table me-1" style={{ fontSize:9 }} />In table
            </span>
          ) : (
            <span className="badge rounded-pill text-bg-light border ms-1" style={{ fontSize:9, color:'#9ca3af' }}>
              <i className="ti ti-eye-off me-1" style={{ fontSize:9 }} />Hidden in table
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-1">
          {hasError && <i className="ti ti-alert-circle text-danger" style={{ fontSize:14 }} />}
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="btn btn-light btn-icon rounded-2 text-danger" style={{ width:26, height:26 }}>
            <i className="ti ti-trash" style={{ fontSize:13 }} />
          </button>
          <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'} text-muted`} style={{ fontSize:13 }} />
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div className="card-body p-3">
          {/* Row 1: Label + Type */}
          <div className="row g-3 mb-3">
            <div className="col-sm-6">
              <label className="form-label" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>
                Field Label <span className="text-danger">*</span>
              </label>
              <input {...register(`fields.${index}.fieldLabel`)} placeholder="e.g. First Name"
                className={`form-control form-control-sm${fieldErrors?.fieldLabel ? ' is-invalid' : ''}`} />
              {fieldErrors?.fieldLabel && <div className="invalid-feedback">{fieldErrors.fieldLabel.message}</div>}
            </div>
            <div className="col-sm-6">
              <label className="form-label" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>
                Field Type <span className="text-danger">*</span>
              </label>
              <select {...register(`fields.${index}.fieldType`)}
                className={`form-select form-select-sm${fieldErrors?.fieldType ? ' is-invalid' : ''}`}>
                {Object.entries(FIELD_TYPES.reduce((acc, ft) => { if (!acc[ft.category]) acc[ft.category] = []; acc[ft.category].push(ft); return acc; }, {}))
                  .map(([cat, types]) => (
                    <optgroup key={cat} label={`── ${cat}`}>
                      {types.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </optgroup>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 1b: Show in table + Checkbox selection type */}
          <div className="row g-3 mb-3">
            <div className={isCheckbox ? 'col-sm-6' : 'col-sm-12'}>
              <label className="d-flex align-items-center gap-2 border rounded-2 px-3 py-2 mb-0"
                style={{ cursor:'pointer', background: showInTable !== false ? 'rgba(34,197,94,.06)' : '#fff', borderColor: showInTable !== false ? '#86efac' : 'var(--gray-300, #e5e5e5)' }}>
                <input type="checkbox" className="form-check-input mt-0" {...register(`fields.${index}.showInTable`)} />
                <div className="flex-grow-1">
                  <p className="fw-semibold mb-0" style={{ fontSize:12 }}><i className="ti ti-table me-1" />Show in Table</p>
                  <p className="text-muted mb-0" style={{ fontSize:10 }}>Display this field as a column in the records table</p>
                </div>
              </label>
            </div>
            {isCheckbox && (
              <div className="col-sm-6">
                <label className="form-label" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>
                  <i className="ti ti-list-check me-1" />Selection Type
                </label>
                <select {...register(`fields.${index}.selectionType`)} className="form-select form-select-sm" defaultValue={selectionType}>
                  <option value="multiple">Multiple selection (check many)</option>
                  <option value="single">Single selection (check one only)</option>
                </select>
              </div>
            )}
          </div>

          {/* Row 2: Placeholder + Default */}
          <div className="row g-3 mb-3">
            {!['checkbox','radio','file','color','range','date','datetime-local'].includes(fieldType) && (
              <div className="col-sm-6">
                <label className="form-label" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>Placeholder</label>
                <input {...register(`fields.${index}.placeholder`)} placeholder="Hint text…" className="form-control form-control-sm" />
              </div>
            )}
            {!['file','password','checkbox'].includes(fieldType) && (
              <div className="col-sm-6">
                <label className="form-label" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>Default Value</label>
                <input {...register(`fields.${index}.defaultValue`)} placeholder="Pre-filled value" className="form-control form-control-sm" />
              </div>
            )}
          </div>

          {/* Options */}
          {TYPES_WITH_OPTIONS.includes(fieldType) && (
            <div className="rounded-2 border p-3 mb-3 bg-light">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>
                  <i className="ti ti-list me-1" />Options
                </span>
                <span className="text-muted" style={{ fontSize:11 }}>{options.length} option{options.length!==1?'s':''}</span>
              </div>
              {options.length > 0 && (
                <div className="mb-2 d-flex flex-column gap-1">
                  {options.map((opt, oi) => (
                    <div key={oi} className="d-flex align-items-center gap-2 bg-white rounded-2 border px-3 py-2">
                      <div className="rounded-circle flex-shrink-0" style={{ width:6, height:6, background:'var(--primary)' }} />
                      <span className="flex-grow-1 fw-semibold" style={{ fontSize:13 }}>{opt.label}</span>
                      <code className="text-muted bg-light rounded px-1" style={{ fontSize:10 }}>{opt.value}</code>
                      <button type="button" onClick={() => removeOption(oi)}
                        className="btn p-0 border-0 text-muted" style={{ lineHeight:1 }}>
                        <i className="ti ti-x" style={{ fontSize:12 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="d-flex gap-2">
                <input value={optionInput} onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key==='Enter') { e.preventDefault(); addOption(); } }}
                  placeholder="Type option, press Enter" className="form-control form-control-sm flex-grow-1" />
                <button type="button" onClick={addOption} disabled={!optionInput.trim()}
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                  <i className="ti ti-plus" /> Add
                </button>
              </div>
            </div>
          )}

          {/* Validations accordion */}
          <div className="border rounded-2 overflow-hidden">
            <button type="button" onClick={() => setShowValidations(!showValidations)}
              className="w-100 d-flex align-items-center justify-content-between px-3 py-2 bg-light border-0 text-start"
              style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>
              <span><i className="ti ti-adjustments me-1" />Validation Rules</span>
              <i className={`ti ${showValidations ? 'ti-chevron-up' : 'ti-chevron-down'} text-muted`} style={{ fontSize:12 }} />
            </button>
            {showValidations && (
              <div className="p-3 bg-white">
                <div className="row g-2">
                  <div className="col-sm-6 col-md-3">
                    <div className="form-check d-flex align-items-center gap-2 border rounded-2 p-2 bg-light">
                      <input {...register(`fields.${index}.validations.required`)} type="checkbox" className="form-check-input mt-0" />
                      <div>
                        <p className="fw-semibold mb-0" style={{ fontSize:12 }}>Required</p>
                        <p className="text-muted mb-0" style={{ fontSize:10 }}>Must fill this</p>
                      </div>
                    </div>
                  </div>
                  {['text','email','password','textarea','url','tel'].includes(fieldType) && <>
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize:10, fontWeight:600 }}>Min Length</label>
                      <input {...register(`fields.${index}.validations.minLength`, { valueAsNumber:true })} type="number" min="0" placeholder="0" className="form-control form-control-sm" />
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize:10, fontWeight:600 }}>Max Length</label>
                      <input {...register(`fields.${index}.validations.maxLength`, { valueAsNumber:true })} type="number" min="0" placeholder="255" className="form-control form-control-sm" />
                    </div>
                  </>}
                  {['number','range'].includes(fieldType) && <>
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize:10, fontWeight:600 }}>Min</label>
                      <input {...register(`fields.${index}.validations.min`, { valueAsNumber:true })} type="number" placeholder="0" className="form-control form-control-sm" />
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize:10, fontWeight:600 }}>Max</label>
                      <input {...register(`fields.${index}.validations.max`, { valueAsNumber:true })} type="number" placeholder="100" className="form-control form-control-sm" />
                    </div>
                  </>}
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
  const { fields, append, remove } = useFieldArray({ control, name:'fields' });

  const addField = () => append({
    fieldLabel:'', fieldType:'text', placeholder:'', defaultValue:'',
    options:[], validations:{ required:false }, isVisible:true,
    showInTable:true, selectionType:'multiple', colSpan:'full', order: fields.length + 1,
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
            style={{ width:22, height:22, fontSize:11, background:'var(--primary)', flexShrink:0 }}>{fields.length}</span>
          <p className="fw-semibold mb-0" style={{ fontSize:13 }}>
            {fields.length === 0 ? 'No fields yet' : `${fields.length} field${fields.length!==1?'s':''} defined`}
          </p>
        </div>
        <button type="button" onClick={addField} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <i className="ti ti-plus" /> Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <button type="button" onClick={addField}
          className="w-100 border-0 bg-transparent p-0">
          <div className="rounded-3 border p-5 text-center"
            style={{ borderStyle:'dashed', borderColor:'var(--gray-300)', cursor:'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.background='rgba(230,98,57,.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor='var(--gray-300)'; e.currentTarget.style.background='transparent'; }}>
            <div className="icon-shape icon-md rounded-3 bg-light mx-auto mb-3">
              <i className="ti ti-cursor-text fs-5 text-muted" />
            </div>
            <p className="fw-bold mb-1" style={{ fontSize:14 }}>Add your first field</p>
            <p className="text-muted small mb-3">Text, email, dropdowns, date pickers and more</p>
            <span className="btn btn-primary btn-sm"><i className="ti ti-plus me-1" />Add Field</span>
          </div>
        </button>
      ) : (
        <>
          {fields.map((field, index) => (
            <FieldCard key={field.id} index={index} onRemove={() => remove(index)} />
          ))}
          <button type="button" onClick={addField}
            className="w-100 border-0 bg-transparent p-0 mt-1">
            <div className="rounded-3 border py-3 text-center text-muted"
              style={{ borderStyle:'dashed', borderColor:'var(--gray-300)', cursor:'pointer', fontSize:13, fontWeight:500 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor='var(--gray-300)'; e.currentTarget.style.color=''; }}>
              <i className="ti ti-plus me-2" />Add another field
            </div>
          </button>
        </>
      )}
    </div>
  );
};

export default FieldEditor;