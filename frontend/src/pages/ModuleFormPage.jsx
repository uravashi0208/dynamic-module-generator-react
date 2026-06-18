import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Save, AlertCircle, Loader2,
  Layers, Sparkles, Info, CheckCircle2
} from 'lucide-react';
import useModuleStore from '../context/moduleStore';
import FieldEditor from '../components/modules/FieldEditor';
import clsx from 'clsx';

const ICON_OPTIONS = [
  { value: 'cube', emoji: '🧊', label: 'Cube' },
  { value: 'layers', emoji: '📚', label: 'Layers' },
  { value: 'database', emoji: '🗄️', label: 'Database' },
  { value: 'grid', emoji: '⊞', label: 'Grid' },
  { value: 'package', emoji: '📦', label: 'Package' },
  { value: 'box', emoji: '📫', label: 'Box' },
  { value: 'file', emoji: '📄', label: 'File' },
  { value: 'folder', emoji: '📁', label: 'Folder' },
  { value: 'settings', emoji: '⚙️', label: 'Settings' },
  { value: 'star', emoji: '⭐', label: 'Star' },
  { value: 'zap', emoji: '⚡', label: 'Zap' },
  { value: 'shield', emoji: '🛡️', label: 'Shield' },
];

const schema = z.object({
  moduleName: z
    .string()
    .min(1, 'Module name is required')
    .min(2, 'Must be at least 2 characters')
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9\s_-]*$/, 'Must start with a letter; only letters, numbers, spaces, _, - allowed'),
  description: z.string().max(500, 'Max 500 characters').optional(),
  icon: z.string().optional(),
  fields: z.array(
    z.object({
      fieldLabel: z.string().min(1, 'Field label is required').max(100),
      fieldType: z.enum([
        'text', 'email', 'password', 'number', 'textarea', 'checkbox',
        'radio', 'select', 'date', 'datetime-local', 'file', 'url', 'tel', 'color', 'range'
      ], { errorMap: () => ({ message: 'Invalid field type' }) }),
      placeholder: z.string().optional(),
      defaultValue: z.any().optional(),
      options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
      validations: z.object({
        required: z.boolean().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      isVisible: z.boolean().optional(),
      order: z.number().optional(),
    })
  ).optional(),
});

const ModuleFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { createModule, updateModule, fetchModule, currentModule, isLoading, isSubmitting } = useModuleStore();
  const [selectedIcon, setSelectedIcon] = useState('cube');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      moduleName: '',
      description: '',
      icon: 'cube',
      fields: [],
    },
  });

  const { register, handleSubmit, reset, watch, setValue, setError, formState: { errors, isDirty } } = methods;

  const moduleName = watch('moduleName');
  const description = watch('description');

  useEffect(() => {
    if (isEdit) {
      fetchModule(id).then((module) => {
        if (module) {
          reset({
            moduleName: module.moduleName,
            description: module.description || '',
            icon: module.icon || 'cube',
            fields: module.fields || [],
          });
          setSelectedIcon(module.icon || 'cube');
        }
      });
    }
  }, [id, isEdit]);

  const onSubmit = async (data) => {
    const result = isEdit
      ? await updateModule(id, data)
      : await createModule(data);

    if (result.success) {
      setSubmitSuccess(true);
      setTimeout(() => navigate('/modules'), 800);
    } else if (result.fieldError) {
      // Show inline error on the specific field (e.g. duplicate moduleName)
      setError(result.fieldError.field, {
        type: 'server',
        message: result.fieldError.message,
      });
      // Scroll the module name input into view
      document.getElementById('moduleName')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleIconSelect = (iconValue) => {
    setSelectedIcon(iconValue);
    setValue('icon', iconValue);
  };

  // Auto-generate slug preview
  const slugPreview = moduleName
    ? moduleName.toLowerCase().trim().replace(/[\s]+/g, '-').replace(/[^a-z0-9-_]/g, '')
    : '';

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3
        bg-white/80 backdrop-blur-lg border-b border-slate-200/80 shadow-sm mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {isEdit ? `Edit Module` : 'Create Module'}
              </h1>
              {isEdit && currentModule && (
                <p className="text-xs text-slate-400">{currentModule.moduleName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hidden sm:flex btn-secondary text-sm py-2 px-3"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || (!isDirty && isEdit) || submitSuccess}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm',
                submitSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {submitSuccess ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Module'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Hero Card: Module Identity ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-6 text-white shadow-lg">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-brand-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-widest">Module Identity</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Name + Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-200 mb-1.5 uppercase tracking-wide">
                      Module Name <span className="text-red-300">*</span>
                    </label>
                    <input
                      {...register('moduleName')}
                      id="moduleName"
                      placeholder="e.g. Customer Form, Product Catalog"
                      className={clsx(
                        'w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/40 text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 backdrop-blur',
                        'transition-all duration-150',
                        errors.moduleName ? 'border-red-400/70' : 'border-white/20 hover:border-white/40'
                      )}
                    />
                    {errors.moduleName ? (
                      <p className="mt-1.5 text-xs text-red-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors.moduleName.message}
                      </p>
                    ) : slugPreview ? (
                      <p className="mt-1.5 text-xs text-brand-300">
                        Route: <span className="font-mono text-white/70">{slugPreview}</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-brand-300">
                        Must start with a letter — becomes the API route
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-200 mb-1.5 uppercase tracking-wide">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      placeholder="What is this module used for?"
                      className={clsx(
                        'w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/40 text-sm resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 backdrop-blur',
                        'transition-all duration-150',
                        errors.description ? 'border-red-400/70' : 'border-white/20 hover:border-white/40'
                      )}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.description ? (
                        <p className="text-xs text-red-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.description.message}
                        </p>
                      ) : <span />}
                      <span className="text-xs text-white/30 ml-auto">
                        {(description || '').length}/500
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Icon Picker */}
                <div>
                  <label className="block text-xs font-semibold text-brand-200 mb-1.5 uppercase tracking-wide">
                    Module Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => handleIconSelect(icon.value)}
                        title={icon.label}
                        className={clsx(
                          'aspect-square flex items-center justify-center rounded-xl text-xl transition-all duration-150',
                          selectedIcon === icon.value
                            ? 'bg-white text-brand-600 shadow-lg scale-110 ring-2 ring-white ring-offset-2 ring-offset-brand-600'
                            : 'bg-white/10 hover:bg-white/20 hover:scale-105 border border-white/10'
                        )}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-brand-300">
                    Selected: <span className="text-white font-medium capitalize">{selectedIcon}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Fields Card ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Form Fields</h2>
                  <p className="text-xs text-slate-500">Design the fields for this module</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-700 font-medium">Field names auto-generated from labels</span>
              </div>
            </div>
            <div className="p-6">
              <FieldEditor />
            </div>
          </div>

          {/* ── Mobile bottom action bar ── */}
          <div className="flex sm:hidden items-center justify-between py-4 border-t border-slate-200 sticky bottom-0 bg-white/90 backdrop-blur -mx-4 px-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isDirty && isEdit) || submitSuccess}
              className={clsx(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                submitSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50'
              )}
            >
              {submitSuccess ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Module'}</>
              )}
            </button>
          </div>

        </form>
      </FormProvider>
    </div>
  );
};

export default ModuleFormPage;