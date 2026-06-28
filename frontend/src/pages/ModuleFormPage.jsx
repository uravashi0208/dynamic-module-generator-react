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
  moduleName:  z.string().min(2, 'Must be at least 2 characters').max(100)
               .regex(/^[a-zA-Z][a-zA-Z0-9\s_-]*$/, 'Must start with a letter'),
  description: z.string().max(500).optional(),
  icon:        z.string().optional(),
  permissions: z.object({
    canView:   z.boolean().optional(),
    canEdit:   z.boolean().optional(),
    canDelete: z.boolean().optional(),
  }).optional(),
  fields: z.array(z.object({
    fieldLabel:    z.string().min(1, 'Field label is required').max(100),
    fieldType:     z.enum(['text','email','password','number','textarea','checkbox','radio','select','date','datetime-local','file','url','tel','color','range'],
                     { errorMap: () => ({ message: 'Invalid field type' }) }),
    placeholder:   z.string().optional(),
    defaultValue:  z.any().optional(),
    options:       z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    validations:   z.object({ required: z.boolean().optional(), minLength: z.number().optional(), maxLength: z.number().optional(), min: z.number().optional(), max: z.number().optional() }).optional(),
    isVisible:     z.boolean().optional(),
    showInTable:   z.boolean().optional(),
    selectionType: z.enum(['single', 'multiple']).optional(),
    colSpan:       z.enum(['full', 'half']).optional(),
    order:         z.number().optional(),
  })).optional(),
});

const DEFAULT_PERMISSIONS = { canView: true, canEdit: true, canDelete: true };

const PERMISSION_OPTIONS = [
  { key: 'canView',   icon: 'ti-eye',   label: 'View',   desc: 'Show the View action on each row',   color: '#0d9488', bg: '#f0fdfa' },
  { key: 'canEdit',   icon: 'ti-edit',  label: 'Edit',   desc: 'Show the Edit action on each row',   color: '#f59e0b', bg: '#fffbeb' },
  { key: 'canDelete', icon: 'ti-trash', label: 'Delete', desc: 'Show the Delete action on each row', color: '#ef4444', bg: '#fef2f2' },
];

const ModuleFormPage = () => {
  const { id }    = useParams();
  const isEdit    = Boolean(id);
  const navigate  = useNavigate();
  const { createModule, updateModule, fetchModule, currentModule, isLoading, isSubmitting } = useModuleStore();

  const [selectedIcon, setSelectedIcon]   = useState('cube');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: { moduleName: '', description: '', icon: 'cube', permissions: DEFAULT_PERMISSIONS, fields: [] },
  });
  const {
    register, handleSubmit, reset, watch, setValue, setError,
    formState: { errors, isDirty },
  } = methods;

  const moduleName  = watch('moduleName');
  const description = watch('description');
  const permissions = watch('permissions') || DEFAULT_PERMISSIONS;

  useEffect(() => {
    if (isEdit) {
      fetchModule(id).then((mod) => {
        if (mod) {
          reset({
            moduleName:  mod.moduleName,
            description: mod.description || '',
            icon:        mod.icon || 'cube',
            permissions: { ...DEFAULT_PERMISSIONS, ...(mod.permissions || {}) },
            fields: (mod.fields || []).map((f) => ({
              ...f,
              showInTable:   f.showInTable !== undefined ? f.showInTable : true,
              selectionType: f.selectionType || 'multiple',
              colSpan:       f.colSpan || 'full',
            })),
          });
          setSelectedIcon(mod.icon || 'cube');
        }
      });
    }
  }, [id, isEdit]);

  const onSubmit = async (data) => {
    const result = isEdit ? await updateModule(id, data) : await createModule(data);
    if (result.success) {
      setSubmitSuccess(true);
      setTimeout(() => navigate('/modules'), 800);
    } else if (result.fieldError) {
      setError(result.fieldError.field, { type: 'server', message: result.fieldError.message });
      document.getElementById('moduleName')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const slugPreview = moduleName
    ? moduleName.toLowerCase().trim().replace(/[\s]+/g, '-').replace(/[^a-z0-9-_]/g, '')
    : '';

  if (isEdit && isLoading) return (
    <div className="mfp-loading">
      <div className="mfp-spinner" />
      <p className="mfp-loading__text">Loading module…</p>
    </div>
  );

  return (
    <div className="mfp-root">
      {/* ── Top Bar ── */}
      <div className="mfp-topbar">
        <div className="mfp-topbar__left">
          <button className="mfp-back-btn" onClick={() => navigate(-1)} type="button">
            <i className="ti ti-arrow-left" />
          </button>
          <div>
            <h1 className="mfp-page-title">{isEdit ? 'Edit Module' : 'Create Module'}</h1>
            {isEdit && currentModule && (
              <p className="mfp-page-sub">{currentModule.moduleName}</p>
            )}
          </div>
        </div>
        <div className="mfp-topbar__actions">
          <button type="button" className="mfp-btn-cancel" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className={`mfp-btn-save${submitSuccess ? ' mfp-btn-save--success' : ''}`}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || (!isDirty && isEdit) || submitSuccess}
          >
            {submitSuccess ? (
              <><i className="ti ti-check" /> Saved!</>
            ) : isSubmitting ? (
              <><span className="mfp-spinner mfp-spinner--sm" /> Saving…</>
            ) : (
              <><i className="ti ti-device-floppy" /> {isEdit ? 'Save Changes' : 'Create Module'}</>
            )}
          </button>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mfp-body">

            {/* ── LEFT COLUMN ── */}
            <div className="mfp-left">

              {/* Identity Hero Card */}
              <div className="mfp-identity">
                <div className="mfp-identity__badge">
                  <i className="ti ti-sparkles" /> Module Identity
                </div>

                <div className="mfp-identity__grid">
                  {/* Name + Description */}
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label className="mfp-label">Module Name *</label>
                      <input
                        {...register('moduleName')}
                        id="moduleName"
                        placeholder="e.g. Customer Form"
                        className={`mfp-input${errors.moduleName ? ' mfp-input--error' : ''}`}
                      />
                      {errors.moduleName
                        ? <p className="mfp-field-error"><i className="ti ti-alert-circle" />{errors.moduleName.message}</p>
                        : slugPreview && (
                          <p className="mfp-field-hint">
                            Route: <code className="mfp-hint-code">/{slugPreview}</code>
                          </p>
                        )
                      }
                    </div>
                    <div>
                      <label className="mfp-label">Description</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        placeholder="What is this module for?"
                        className="mfp-textarea"
                      />
                      <p className="mfp-char-count">{(description || '').length}/500</p>
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div>
                    <div className="mfp-icon-header">
                      <label className="mfp-label" style={{ marginBottom: 0 }}>
                        Module Icon{' '}
                        <span style={{ color: 'rgba(255,255,255,.4)', fontWeight: 400 }}>
                          ({ICON_OPTIONS.length})
                        </span>
                      </label>
                      <div className="mfp-icon-selected-pill">
                        <span className="mfp-icon-selected-pill__emoji">
                          {ICON_OPTIONS.find((i) => i.value === selectedIcon)?.emoji || '🧊'}
                        </span>
                        <span className="mfp-icon-selected-pill__label">
                          {ICON_OPTIONS.find((i) => i.value === selectedIcon)?.label || 'Cube'}
                        </span>
                      </div>
                    </div>
                    <div className="mfp-icon-grid">
                      {ICON_OPTIONS.map((ic) => (
                        <button
                          key={ic.value}
                          type="button"
                          title={ic.label}
                          className={`mfp-icon-btn${selectedIcon === ic.value ? ' mfp-icon-btn--active' : ''}`}
                          onClick={() => {
                            setSelectedIcon(ic.value);
                            setValue('icon', ic.value, { shouldDirty: true });
                          }}
                        >
                          {ic.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Card */}
              <div className="mfp-card">
                <div className="mfp-card__header">
                  <div className="mfp-card__header-left">
                    <div className="mfp-card__icon mfp-card__icon--green">
                      <i className="ti ti-shield-check" />
                    </div>
                    <div>
                      <p className="mfp-card__title">Table Action Permissions</p>
                      <p className="mfp-card__sub">Only checked actions will appear in the records table</p>
                    </div>
                  </div>
                </div>
                <div className="mfp-card__body">
                  <div className="mfp-perm-grid">
                    {PERMISSION_OPTIONS.map((p) => (
                      <label
                        key={p.key}
                        className={`mfp-perm-card${permissions[p.key] ? ' mfp-perm-card--active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="mfp-perm-card__checkbox"
                          {...register(`permissions.${p.key}`)}
                        />
                        <div className="mfp-perm-card__icon" style={{ background: p.bg, color: p.color }}>
                          <i className={`ti ${p.icon}`} />
                        </div>
                        <p className="mfp-perm-card__label">{p.label}</p>
                        <p className="mfp-perm-card__desc">{p.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Fields Card */}
              <div className="mfp-card">
                <div className="mfp-card__header">
                  <div className="mfp-card__header-left">
                    <div className="mfp-card__icon mfp-card__icon--orange">
                      <i className="ti ti-layout-grid" />
                    </div>
                    <div>
                      <p className="mfp-card__title">Form Fields</p>
                      <p className="mfp-card__sub">Design the fields for this module</p>
                    </div>
                  </div>
                  <div className="mfp-fields-badge">
                    <i className="ti ti-info-circle" /> Field names auto-generated
                  </div>
                </div>
                <div className="mfp-card__body">
                  <FieldEditor />
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: sticky preview ── */}
            <div className="mfp-right">
              <div className="mfp-preview-wrap">
                <FormPreviewPanel />
              </div>
            </div>

          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default ModuleFormPage;
