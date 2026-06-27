import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * FormPreviewPanel — Editable live form preview
 * - Drag to reorder fields
 * - Click width toggle (half / full)
 * - Updates field order in react-hook-form
 */

/* ── Field preview renderer ── */
const PreviewField = ({ field }) => {
  const { fieldLabel, fieldType, placeholder, defaultValue, options = [], validations = {}, selectionType } = field;
  const isRequired = validations?.required;

  const labelEl = (
    <label className="d-block mb-1 fw-semibold" style={{ fontSize: 12, color: '#374151' }}>
      {fieldLabel || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Untitled Field</span>}
      {isRequired && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
  );

  const inp = {
    fontSize: 12, border: '1.5px solid #e5e7eb', borderRadius: 7,
    padding: '7px 10px', width: '100%', background: '#fff', color: '#374151', outline: 'none',
  };

  switch (fieldType) {
    case 'textarea':
      return <div>{labelEl}<textarea readOnly rows={2} placeholder={placeholder || `Enter ${fieldLabel || 'value'}…`} style={{ ...inp, resize: 'none' }} /></div>;

    case 'select':
      return (
        <div>
          {labelEl}
          <div style={{ position: 'relative' }}>
            <select disabled style={{ ...inp, appearance: 'none', paddingRight: 28, cursor: 'not-allowed', background: '#fafafa' }}>
              <option>Select {fieldLabel || 'option'}…</option>
              {options.map((o, i) => <option key={i}>{o.label}</option>)}
            </select>
            <i className="ti ti-chevron-down" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', pointerEvents: 'none' }} />
          </div>
          {!options.length && <p style={{ fontSize: 10, color: '#f59e0b', margin: '3px 0 0' }}><i className="ti ti-alert-circle me-1" />Add options in editor</p>}
        </div>
      );

    case 'radio':
      return (
        <div>
          {labelEl}
          {!options.length
            ? <p style={{ fontSize: 10, color: '#f59e0b', margin: '3px 0 0' }}><i className="ti ti-alert-circle me-1" />Add options in editor</p>
            : <div className="d-flex flex-wrap gap-1 mt-1">
                {options.map((o, i) => (
                  <label key={i} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', border:'1.5px solid #e5e7eb', borderRadius:20, fontSize:11, cursor:'default', background:'#fafafa' }}>
                    <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid #d1d5db', display:'inline-block', flexShrink:0 }} />{o.label}
                  </label>
                ))}
              </div>
          }
        </div>
      );

    case 'checkbox':
      if (options.length) return (
        <div>
          {labelEl}
          <div className="d-flex flex-wrap gap-1 mt-1">
            {options.map((o, i) => (
              <label key={i} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:11, cursor:'default', background:'#fafafa' }}>
                <span style={{ width:12, height:12, border:'2px solid #d1d5db', borderRadius:3, display:'inline-block', flexShrink:0 }} />{o.label}
              </label>
            ))}
          </div>
          {selectionType === 'single' && <p style={{ fontSize:10, color:'#9ca3af', marginTop:3 }}>Single selection only</p>}
        </div>
      );
      return <div><label style={{ display:'inline-flex', alignItems:'center', gap:7, cursor:'default' }}><span style={{ width:14, height:14, border:'2px solid #d1d5db', borderRadius:3, display:'inline-block', flexShrink:0 }} /><span style={{ fontSize:12, color:'#374151' }}>{fieldLabel || <span style={{ color:'#9ca3af', fontStyle:'italic' }}>Checkbox label</span>}{isRequired && <span style={{ color:'#EF4444', marginLeft:3 }}>*</span>}</span></label></div>;

    case 'file':
      return <div>{labelEl}<div style={{ border:'1.5px dashed #d1d5db', borderRadius:7, padding:'14px 10px', textAlign:'center', background:'#fafafa' }}><i className="ti ti-cloud-upload" style={{ fontSize:18, color:'#9ca3af', display:'block', marginBottom:3 }} /><p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>Click to upload</p></div></div>;

    case 'color':
      return <div>{labelEl}<div style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ width:32, height:32, borderRadius:7, border:'1.5px solid #e5e7eb', background: defaultValue||'#E66239', flexShrink:0 }} /><span style={{ ...inp, width:'auto', flex:1, color:'#9ca3af', fontSize:11 }}>{defaultValue||'#E66239'}</span></div></div>;

    case 'range':
      return <div>{labelEl}<input type="range" readOnly min={validations?.min??0} max={validations?.max??100} defaultValue={defaultValue||50} style={{ width:'100%', accentColor:'var(--primary)' }} /><div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9ca3af' }}><span>{validations?.min??0}</span><span>{validations?.max??100}</span></div></div>;

    case 'password':
      return <div>{labelEl}<div style={{ position:'relative' }}><input type="password" readOnly placeholder={placeholder||'Enter password…'} style={inp} /><i className="ti ti-eye" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#9ca3af' }} /></div></div>;

    case 'date':
      return <div>{labelEl}<div style={{ position:'relative' }}><input type="text" readOnly placeholder="MM / DD / YYYY" style={{ ...inp, paddingRight:30 }} /><i className="ti ti-calendar" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#9ca3af' }} /></div></div>;

    case 'datetime-local':
      return <div>{labelEl}<div style={{ position:'relative' }}><input type="text" readOnly placeholder="MM / DD / YYYY  --:-- --" style={{ ...inp, paddingRight:30 }} /><i className="ti ti-calendar-time" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#9ca3af' }} /></div></div>;

    case 'number':
      return <div>{labelEl}<input type="number" readOnly placeholder={placeholder||'0'} defaultValue={defaultValue} style={inp} /></div>;

    case 'email':
      return <div>{labelEl}<div style={{ position:'relative' }}><i className="ti ti-mail" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }} /><input type="text" readOnly placeholder={placeholder||'you@example.com'} style={{ ...inp, paddingLeft:26 }} /></div></div>;

    case 'url':
      return <div>{labelEl}<div style={{ position:'relative' }}><i className="ti ti-link" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }} /><input type="text" readOnly placeholder={placeholder||'https://…'} style={{ ...inp, paddingLeft:26 }} /></div></div>;

    case 'tel':
      return <div>{labelEl}<div style={{ position:'relative' }}><i className="ti ti-phone" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }} /><input type="text" readOnly placeholder={placeholder||'+1 (555) 000-0000'} style={{ ...inp, paddingLeft:26 }} /></div></div>;

    default:
      return <div>{labelEl}<input type="text" readOnly placeholder={placeholder||`Enter ${fieldLabel||'value'}…`} defaultValue={defaultValue} style={inp} /></div>;
  }
};

/* ── Main Preview Panel ── */
const FormPreviewPanel = () => {
  const { watch, setValue, getValues } = useFormContext();
  const fields     = watch('fields') || [];
  const moduleName = watch('moduleName');

  const [dragIdx, setDragIdx]     = useState(null);
  const [overIdx, setOverIdx]     = useState(null);
  const dragNodeRef = useRef(null);

  const visibleFields = fields.filter(f => f.isVisible !== false);

  // Width stored directly in fields[].colSpan ('full' | 'half')
  const getWidth = (f) => f.colSpan || 'full';
  const toggleWidth = (f) => {
    const allFields = getValues('fields');
    const idx = allFields.findIndex(af => (af.fieldName && af.fieldName === f.fieldName) || (af.id && af.id === f.id));
    if (idx === -1) return;
    const newSpan = (allFields[idx].colSpan || 'full') === 'half' ? 'full' : 'half';
    const updated = [...allFields];
    updated[idx] = { ...updated[idx], colSpan: newSpan };
    setValue('fields', updated, { shouldDirty: true });
  };

  /* Drag handlers */
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
      const currentFields = [...fields];
      const [moved] = currentFields.splice(dragIdx, 1);
      currentFields.splice(overIdx, 0, moved);
      setValue('fields', currentFields, { shouldDirty: true });
    }
    setDragIdx(null);
    setOverIdx(null);
    dragNodeRef.current = null;
  };
  const onDragOver  = (e) => e.preventDefault();

  /* Group fields into rows based on widths */
  const buildRows = () => {
    const rows = [];
    let i = 0;
    while (i < visibleFields.length) {
      const f = visibleFields[i];
      const origIdx = fields.indexOf(f);
      const w = getWidth(f);
      if (w === 'half' && i + 1 < visibleFields.length && getWidth(visibleFields[i+1]) === 'half') {
        rows.push([{ field: f, origIdx }, { field: visibleFields[i+1], origIdx: fields.indexOf(visibleFields[i+1]) }]);
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
    <div style={{ borderRadius: 16, border: '1.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Panel header */}
      <div style={{ padding: '12px 16px', borderBottom: '1.5px solid #e5e7eb', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(230,98,57,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-eye" style={{ fontSize: 13, color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Form Preview</p>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Drag to reorder · Click ⊞ for half-width</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, background: visibleFields.length > 0 ? 'rgba(230,98,57,.1)' : '#f3f4f6', color: visibleFields.length > 0 ? 'var(--primary)' : '#9ca3af', borderRadius: 20, padding: '2px 8px' }}>
          {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mock browser chrome */}
      <div style={{ padding: '8px 12px 0', background: '#f9fafb', flexShrink: 0 }}>
        <div style={{ background: '#f3f4f6', borderRadius: 7, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ flex: 1, fontSize: 10, color: '#9ca3af', textAlign: 'center', background: '#fff', borderRadius: 4, padding: '2px 8px' }}>
            {moduleName ? `/${moduleName.toLowerCase().replace(/\s+/g, '-')}/new` : '/module/new'}
          </span>
        </div>
      </div>

      {/* Form card */}
      <div style={{ padding: '10px 12px 14px', flex: 1 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>

          {/* Form title */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1.5px solid #f9fafb' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#111827' }}>
              {moduleName || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Module Name</span>}
            </h3>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Fill in all required fields to continue</p>
          </div>

          {/* Fields area */}
          <div style={{ padding: '14px 16px' }}>
            {visibleFields.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <i className="ti ti-layout-grid" style={{ fontSize: 18, color: '#d1d5db' }} />
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Add fields to see preview</p>
                <p style={{ fontSize: 10, color: '#d1d5db', margin: '3px 0 0' }}>Fields appear here as you add them →</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    {row.map(({ field, origIdx }) => {
                      const w = getWidth(field);
                      const isOver = overIdx === origIdx;
                      return (
                        <div
                          key={origIdx}
                          draggable
                          onDragStart={(e) => onDragStart(e, origIdx)}
                          onDragEnter={() => onDragEnter(origIdx)}
                          onDragEnd={onDragEnd}
                          onDragOver={onDragOver}
                          style={{
                            flex: w === 'half' ? '0 0 calc(50% - 5px)' : '1 1 100%',
                            position: 'relative',
                            borderRadius: 8,
                            border: isOver ? '2px dashed var(--primary)' : '2px dashed transparent',
                            padding: 4,
                            cursor: 'grab',
                            transition: 'border-color .15s',
                            background: isOver ? 'rgba(230,98,57,.03)' : 'transparent',
                          }}
                        >
                          {/* Toolbar */}
                          <div
                            style={{
                              position: 'absolute', top: 2, right: 6,
                              display: 'flex', gap: 3, zIndex: 2,
                              opacity: 0,
                            }}
                            className="field-preview-toolbar"
                          >
                            <button
                              type="button"
                              title={w === 'half' ? 'Make full width' : 'Make half width'}
                              onClick={(e) => { e.stopPropagation(); toggleWidth(field); }}
                              style={{
                                width: 20, height: 20, borderRadius: 4, border: '1px solid #e5e7eb',
                                background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: '#6b7280',
                              }}
                            >
                              {w === 'half' ? '⬜' : '▬'}
                            </button>
                            <span style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}>
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

          {/* Submit */}
          {visibleFields.length > 0 && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ borderTop: '1.5px solid #f9fafb', paddingTop: 12, display: 'flex', gap: 8 }}>
                <button type="button" disabled style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'default', opacity: 0.8 }}>Submit</button>
                <button type="button" disabled style={{ padding: '8px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 12, color: '#6b7280', cursor: 'default' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        {visibleFields.length > 0 && (
          <p style={{ fontSize: 10, color: '#b0b8c4', textAlign: 'center', marginTop: 8, margin: '8px 0 0' }}>
            <i className="ti ti-drag-drop me-1" />Drag fields to reorder · Click ▬/⬜ to change width
          </p>
        )}
      </div>

      <style>{`
        [draggable]:hover .field-preview-toolbar { opacity: 1 !important; transition: opacity .15s; }
      `}</style>
    </div>
  );
};

export default FormPreviewPanel;