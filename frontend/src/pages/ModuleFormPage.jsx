import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useModuleStore from '../context/moduleStore';
import FieldEditor from '../components/modules/FieldEditor';
import FormPreviewPanel from '../components/modules/FormPreviewPanel';
import { MODULE_ICON_OPTIONS } from '../utils/fieldTypes';

const ICON_OPTIONS = MODULE_ICON_OPTIONS;

const schema = z.object({
  moduleName:  z.string().min(2,'Must be at least 2 characters').max(100)
                .regex(/^[a-zA-Z][a-zA-Z0-9\s_-]*$/, 'Must start with a letter'),
  description: z.string().max(500).optional(),
  icon:        z.string().optional(),
  permissions: z.object({
    canView:   z.boolean().optional(),
    canEdit:   z.boolean().optional(),
    canDelete: z.boolean().optional(),
  }).optional(),
  fields:      z.array(z.object({
    fieldLabel:   z.string().min(1,'Field label is required').max(100),
    fieldType:    z.enum(['text','email','password','number','textarea','checkbox','radio','select','date','datetime-local','file','url','tel','color','range'],
                    { errorMap: () => ({ message:'Invalid field type' }) }),
    placeholder:  z.string().optional(),
    defaultValue: z.any().optional(),
    options:      z.array(z.object({ label:z.string(), value:z.string() })).optional(),
    validations:  z.object({ required:z.boolean().optional(), minLength:z.number().optional(), maxLength:z.number().optional(), min:z.number().optional(), max:z.number().optional() }).optional(),
    isVisible:    z.boolean().optional(),
    showInTable:  z.boolean().optional(),
    selectionType:z.enum(['single','multiple']).optional(),
    colSpan:      z.enum(['full','half']).optional(),
    order:        z.number().optional(),
  })).optional(),
});

const ModuleFormPage = () => {
  const { id }      = useParams();
  const isEdit      = Boolean(id);
  const navigate    = useNavigate();
  const { createModule, updateModule, fetchModule, currentModule, isLoading, isSubmitting } = useModuleStore();
  const [selectedIcon, setSelectedIcon] = useState('cube');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const DEFAULT_PERMISSIONS = { canView: true, canEdit: true, canDelete: true };

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: { moduleName:'', description:'', icon:'cube', permissions: DEFAULT_PERMISSIONS, fields:[] },
  });
  const { register, handleSubmit, reset, watch, setValue, setError, formState: { errors, isDirty } } = methods;
  const moduleName  = watch('moduleName');
  const description = watch('description');
  const permissions = watch('permissions') || DEFAULT_PERMISSIONS;

  useEffect(() => {
    if (isEdit) {
      fetchModule(id).then((mod) => {
        if (mod) {
          reset({
            moduleName: mod.moduleName,
            description: mod.description||'',
            icon: mod.icon||'cube',
            permissions: { ...DEFAULT_PERMISSIONS, ...(mod.permissions||{}) },
            fields: (mod.fields||[]).map((f) => ({
              ...f,
              showInTable: f.showInTable !== undefined ? f.showInTable : true,
              selectionType: f.selectionType || 'multiple',
              colSpan: f.colSpan || 'full',
            })),
          });
          setSelectedIcon(mod.icon||'cube');
        }
      });
    }
  }, [id, isEdit]);

  const onSubmit = async (data) => {
    const result = isEdit ? await updateModule(id, data) : await createModule(data);
    if (result.success) { setSubmitSuccess(true); setTimeout(() => navigate('/modules'), 800); }
    else if (result.fieldError) {
      setError(result.fieldError.field, { type:'server', message: result.fieldError.message });
      document.getElementById('moduleName')?.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  };

  const slugPreview = moduleName ? moduleName.toLowerCase().trim().replace(/[\s]+/g,'-').replace(/[^a-z0-9-_]/g,'') : '';

  if (isEdit && isLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height:200 }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-2" />
        <p className="text-muted small">Loading module…</p>
      </div>
    </div>
  );

  return (
    <div className="animate-slide-up" style={{ maxWidth:'fit-content', width:'100%' }}>
      {/* Sticky top bar */}
      <div className="sticky-top bg-white border-bottom mb-4 py-3" style={{ zIndex:20 }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button onClick={() => navigate(-1)} className="btn btn-light btn-icon btn-sm rounded-2">
              <i className="ti ti-arrow-left" />
            </button>
            <div>
              <h1 className="fs-6 fw-bold mb-0">{isEdit ? 'Edit Module' : 'Create Module'}</h1>
              {isEdit && currentModule && <p className="text-muted mb-0" style={{ fontSize:11 }}>{currentModule.moduleName}</p>}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm d-none d-sm-inline-flex">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || (!isDirty && isEdit) || submitSuccess}
              className={`btn btn-sm d-inline-flex align-items-center gap-2 ${submitSuccess ? 'btn-success' : 'btn-primary'}`}>
              {submitSuccess ? <><i className="ti ti-check" /> Saved!</>
               : isSubmitting ? <><span className="spinner-border spinner-border-sm" /> Saving…</>
               : <><i className="ti ti-device-floppy" /> {isEdit ? 'Save Changes' : 'Create Module'}</>}
            </button>
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* TWO-COLUMN LAYOUT */}
          <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
          {/* LEFT COLUMN */}
          <div style={{ flex:'0 0 57%', minWidth:0 }}>
          {/* Identity card */}
          <div className="rounded-3 p-4 mb-4 text-white position-relative overflow-hidden"
            style={{ background:'linear-gradient(135deg, #4f46e5 0%, #4338ca 60%, #1e1b4b 100%)' }}>
            <div style={{ position:'absolute', top:0, right:0, width:200, height:200, background:'rgba(255,255,255,.05)', borderRadius:'50%', transform:'translate(30%, -40%)' }} />
            <div className="position-relative">
              <p className="small fw-semibold text-uppercase mb-3" style={{ color:'rgba(255,255,255,.6)', letterSpacing:'.08em', fontSize:11 }}>
                <i className="ti ti-sparkles me-1" /> Module Identity
              </p>
              <div className="row g-4">
                <div className="col-lg-5">
                  <div className="mb-3">
                    <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.7)', fontSize:12, fontWeight:600 }}>Module Name *</label>
                    <input {...register('moduleName')} id="moduleName" placeholder="e.g. Customer Form"
                      className={`auth-input${errors.moduleName ? ' is-error' : ''}`} />
                    {errors.moduleName
                      ? <p style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}><i className="ti ti-alert-circle me-1" />{errors.moduleName.message}</p>
                      : slugPreview && <p style={{ color:'rgba(255,255,255,.5)', fontSize:11, marginTop:4 }}>Route: <code style={{ color:'rgba(255,255,255,.75)' }}>{slugPreview}</code></p>}
                  </div>
                  <div>
                    <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.7)', fontSize:12, fontWeight:600 }}>Description</label>
                    <textarea {...register('description')} rows={3} placeholder="What is this module for?"
                      className={`auth-input${errors.description ? ' is-error' : ''}`} style={{ resize:'none' }} />
                    <div className="d-flex justify-content-end">
                      <span style={{ color:'rgba(255,255,255,.3)', fontSize:11 }}>{(description||'').length}/500</span>
                    </div>
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="d-block mb-0" style={{ color:'rgba(255,255,255,.7)', fontSize:12, fontWeight:600 }}>
                      Module Icon <span style={{ color:'rgba(255,255,255,.45)', fontWeight:400 }}>({ICON_OPTIONS.length} options)</span>
                    </label>
                    <span className="d-flex align-items-center gap-2" style={{ background:'rgba(255,255,255,.12)', borderRadius:8, padding:'4px 10px' }}>
                      <span style={{ fontSize:16 }}>{ICON_OPTIONS.find(i => i.value === selectedIcon)?.emoji || '🧊'}</span>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,.8)' }}>{ICON_OPTIONS.find(i => i.value === selectedIcon)?.label || 'Cube'}</span>
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 pe-1"
                    style={{ maxHeight:172, overflowY:'auto' }}>
                    {ICON_OPTIONS.map((ic) => (
                      <button key={ic.value} type="button" onClick={() => { setSelectedIcon(ic.value); setValue('icon', ic.value, { shouldDirty:true }); }}
                        title={ic.label}
                        style={{
                          width:38, height:38, borderRadius:8, fontSize:17, border:'none', cursor:'pointer',
                          background: selectedIcon === ic.value ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.12)',
                          boxShadow: selectedIcon === ic.value ? '0 2px 8px rgba(0,0,0,.25)' : 'none',
                          transform: selectedIcon === ic.value ? 'scale(1.08)' : 'scale(1)',
                          transition:'all .15s', flexShrink:0,
                        }}>
                        {ic.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions card */}
          <div className="card overflow-hidden mb-4">
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-light flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div className="icon-shape icon-sm rounded-2" style={{ background:'rgba(230,98,57,.1)' }}>
                  <i className="ti ti-shield-lock" style={{ color:'var(--primary)' }} />
                </div>
                <div>
                  <p className="fw-bold mb-0" style={{ fontSize:13 }}>Table Action Permissions</p>
                  <p className="text-muted mb-0" style={{ fontSize:11 }}>Only checked actions will appear in the records table</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="row g-3">
                {[
                  { key:'canView',   icon:'ti-eye',    label:'View',   desc:'Show the View action on each row', color:'#3b82f6' },
                  { key:'canEdit',   icon:'ti-edit',   label:'Edit',   desc:'Show the Edit action on each row', color:'#f59e0b' },
                  { key:'canDelete', icon:'ti-trash',  label:'Delete', desc:'Show the Delete action on each row', color:'#ef4444' },
                ].map((p) => (
                  <div key={p.key} className="col-sm-4">
                    <label className="d-flex align-items-start gap-2 border rounded-3 p-3 h-100"
                      style={{ cursor:'pointer', background: permissions[p.key] ? 'rgba(230,98,57,.04)' : '#fff', borderColor: permissions[p.key] ? 'var(--primary)' : 'var(--gray-200, #e5e5e5)' }}>
                      <input type="checkbox" className="form-check-input mt-1" {...register(`permissions.${p.key}`)} />
                      <div>
                        <p className="fw-semibold mb-0 d-flex align-items-center gap-1" style={{ fontSize:13 }}>
                          <i className={`ti ${p.icon}`} style={{ color:p.color, fontSize:14 }} />{p.label}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize:11 }}>{p.desc}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fields card */}
          <div className="card overflow-hidden mb-2">
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-light flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div className="icon-shape icon-sm rounded-2" style={{ background:'rgba(230,98,57,.1)' }}>
                  <i className="ti ti-layout-grid" style={{ color:'var(--primary)' }} />
                </div>
                <div>
                  <p className="fw-bold mb-0" style={{ fontSize:13 }}>Form Fields</p>
                  <p className="text-muted mb-0" style={{ fontSize:11 }}>Design the fields for this module</p>
                </div>
              </div>
              <span className="badge rounded-pill text-bg-warning" style={{ fontSize:10 }}>
                <i className="ti ti-info-circle me-1" />Field names auto-generated
              </span>
            </div>
            <div className="p-4">
              <FieldEditor />
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="d-flex d-sm-none align-items-center justify-content-between py-3 border-top mt-3 sticky-bottom bg-white">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting || (!isDirty && isEdit) || submitSuccess}
              className={`btn btn-sm d-inline-flex align-items-center gap-2 ${submitSuccess ? 'btn-success' : 'btn-primary'}`}>
              {submitSuccess ? 'Saved!' : isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Module'}
            </button>
          </div>

          </div>{/* end LEFT COLUMN */}

          {/* RIGHT COLUMN — sticky preview */}
          <div style={{ flex:'0 0 42%', minWidth:0, position:'sticky', top:72, maxHeight:'calc(100vh - 88px)', overflowY:'auto' }}>
            <FormPreviewPanel />
          </div>

          </div>{/* end TWO-COLUMN */}
        </form>
      </FormProvider>
    </div>
  );
};

export default ModuleFormPage;