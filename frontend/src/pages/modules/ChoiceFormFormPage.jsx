/**
 * ChoiceFormFormPage.jsx  —  DYNAMIC + REDESIGNED
 * Options loaded from DB (moduleStore) — nothing hardcoded.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Save, Loader2, Database, AlertCircle, Check, ChevronDown,
} from 'lucide-react';
import useModuleStore      from '../../context/moduleStore';
import useModuleDataStore  from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = 'choice-form';
const MODULE_NAME = 'Choice Form';

/* ── Checkbox pill ─────────────────────────────────── */
const CheckPill = ({ label, checked, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={clsx(
      'group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border-2',
      'transition-all duration-200 text-left select-none',
      checked
        ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-indigo-50 shadow-sm'
        : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50/80'
    )}
  >
    {/* custom checkbox box */}
    <span className={clsx(
      'flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
      checked ? 'bg-brand-600 border-brand-600 shadow-sm' : 'bg-white border-slate-300 group-hover:border-brand-400'
    )}>
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>

    <span className={clsx(
      'text-sm font-medium transition-colors duration-200',
      checked ? 'text-brand-700' : 'text-slate-700'
    )}>
      {label}
    </span>

    {/* right glow dot when checked */}
    {checked && (
      <span className="ml-auto w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_6px_2px_rgba(99,102,241,0.4)]" />
    )}
  </button>
);

/* ── Radio pill ────────────────────────────────────── */
const RadioPill = ({ label, checked, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={clsx(
      'group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border-2',
      'transition-all duration-200 text-left select-none',
      checked
        ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-indigo-50 shadow-sm'
        : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50/80'
    )}
  >
    {/* custom radio circle */}
    <span className={clsx(
      'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
      checked ? 'border-brand-600' : 'border-slate-300 group-hover:border-brand-400'
    )}>
      {checked && (
        <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-[0_0_4px_rgba(99,102,241,0.5)]" />
      )}
    </span>

    <span className={clsx(
      'text-sm font-medium transition-colors duration-200',
      checked ? 'text-brand-700' : 'text-slate-700'
    )}>
      {label}
    </span>

    {checked && (
      <span className="ml-auto w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_6px_2px_rgba(99,102,241,0.4)]" />
    )}
  </button>
);

/* ── Field group wrapper ───────────────────────────── */
const FieldGroup = ({ label, required, error, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <p className="text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3 h-3" />{error.message}
        </span>
      )}
    </div>
    {children}
  </div>
);

/* ── Dynamic field renderer ────────────────────────── */
const DynamicField = ({ field, register, errors, watch, setValue }) => {
  const error    = errors?.[field.fieldName];
  const options  = field.options || [];
  const required = field.validations?.required;
  const rules    = { required: required ? `${field.fieldLabel} is required` : false };

  /* checkbox — multi select */
  if (field.fieldType === 'checkbox') {
    const checked = watch(field.fieldName) || [];
    const toggle  = (val) =>
      setValue(
        field.fieldName,
        checked.includes(val) ? checked.filter((v) => v !== val) : [...checked, val],
        { shouldValidate: true }
      );
    return (
      <FieldGroup label={field.fieldLabel} required={required} error={error}>
        <div className="space-y-2">
          {(options.length ? options : [{ label: field.fieldLabel, value: field.fieldName }])
            .map((opt) => (
              <CheckPill
                key={opt.value}
                label={opt.label}
                checked={checked.includes(opt.value)}
                onToggle={() => toggle(opt.value)}
              />
            ))}
        </div>
      </FieldGroup>
    );
  }

  /* radio — single select */
  if (field.fieldType === 'radio') {
    const selected = watch(field.fieldName) || '';
    return (
      <FieldGroup label={field.fieldLabel} required={required} error={error}>
        <input type="hidden" {...register(field.fieldName, rules)} />
        <div className="space-y-2">
          {options.map((opt) => (
            <RadioPill
              key={opt.value}
              label={opt.label}
              checked={selected === opt.value}
              onSelect={() => setValue(field.fieldName, opt.value, { shouldValidate: true })}
            />
          ))}
        </div>
      </FieldGroup>
    );
  }

  /* select — dropdown */
  if (field.fieldType === 'select') {
    return (
      <FieldGroup label={field.fieldLabel} required={required} error={error}>
        <div className="relative">
          <select
            {...register(field.fieldName, rules)}
            className={clsx(
              'w-full px-4 py-3.5 pr-10 bg-white border-2 rounded-2xl text-sm font-medium appearance-none',
              'focus:outline-none transition-all duration-200 cursor-pointer',
              error
                ? 'border-red-300 focus:border-red-400'
                : 'border-slate-200 hover:border-brand-300 focus:border-brand-500 text-slate-700'
            )}
          >
            <option value="" className="text-slate-400">Select {field.fieldLabel}…</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </FieldGroup>
    );
  }

  /* textarea */
  if (field.fieldType === 'textarea') {
    return (
      <FieldGroup label={field.fieldLabel} required={required} error={error}>
        <textarea
          {...register(field.fieldName, rules)}
          rows={4}
          placeholder={field.placeholder || `Enter ${field.fieldLabel}…`}
          className={clsx(
            'w-full px-4 py-3.5 bg-white border-2 rounded-2xl text-sm resize-none',
            'focus:outline-none transition-all duration-200',
            error ? 'border-red-300' : 'border-slate-200 hover:border-brand-300 focus:border-brand-500'
          )}
        />
      </FieldGroup>
    );
  }

  /* default input */
  return (
    <FieldGroup label={field.fieldLabel} required={required} error={error}>
      <input
        type={field.fieldType}
        {...register(field.fieldName, {
          ...rules,
          ...(field.fieldType === 'number' ? { valueAsNumber: true } : {}),
        })}
        placeholder={field.placeholder || `Enter ${field.fieldLabel}…`}
        className={clsx(
          'w-full px-4 py-3.5 bg-white border-2 rounded-2xl text-sm',
          'focus:outline-none transition-all duration-200',
          error ? 'border-red-300' : 'border-slate-200 hover:border-brand-300 focus:border-brand-500'
        )}
      />
    </FieldGroup>
  );
};

/* ── Main page ─────────────────────────────────────── */
const ChoiceFormFormPage = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const isEdit       = Boolean(id);

  const { modules, fetchModules }                        = useModuleStore();
  const { fetchRecord, createRecord, updateRecord, isSubmitting } = useModuleDataStore();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm({ mode: 'onBlur', defaultValues: { hobby: [], gender: '', city: '' } });

  const [loading, setLoading] = useState(isEdit);

  const module = modules.find(
    (m) => m.moduleSlug === MODULE_SLUG ||
           m.moduleName?.toLowerCase().replace(/\s+/g, '-') === MODULE_SLUG
  );
  const fields = module?.fields || [];

  useEffect(() => { if (!modules.length) fetchModules(); }, []);

  useEffect(() => {
    if (isEdit && id && fields.length) {
      setLoading(true);
      fetchRecord(MODULE_SLUG, id).then((rec) => {
        if (rec) reset(rec);
        setLoading(false);
      });
    }
  }, [id, module]);

  const onSubmit = async (data) => {
    const payload = { ...data };
    fields.forEach((f) => {
      if (f.fieldType === 'checkbox') {
        const v = data[f.fieldName];
        payload[f.fieldName] = Array.isArray(v) ? v : (v ? [v] : []);
      }
    });
    const result = isEdit
      ? await updateRecord(MODULE_SLUG, id, payload)
      : await createRecord(MODULE_SLUG, payload);
    if (result.success) navigate('/choice-form');
  };

  if (loading || !module)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/60 flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-5 animate-slide-up">

        {/* ── Header ───────────────────────────────── */}
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => navigate('/choice-form')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500
                       bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300
                       shadow-sm transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-brand-600 rounded-2xl flex items-center justify-center shadow-glow-sm">
                <Database className="w-5 h-5 text-white" />
              </div>
              {/* pulse ring */}
              <div className="absolute -inset-1 rounded-2xl bg-brand-400/20 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                {isEdit ? 'Edit' : 'New'} {MODULE_NAME}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {isEdit ? 'Update existing record' : 'Fill in the details below'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Form card ────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden">

          {/* gradient top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-500" />

          {/* fields */}
          <div className="px-6 py-7 space-y-7">
            {fields.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-sm font-bold text-slate-600">No fields defined</p>
                <p className="text-xs text-slate-400">Add fields in the module configuration first.</p>
              </div>
            ) : (
              fields.map((field, idx) => (
                <div key={field.fieldName}>
                  <DynamicField
                    field={field}
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                  {idx < fields.length - 1 && (
                    <div className="mt-7 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── Actions footer ───────────────────── */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50/50 border-t border-slate-100
                          flex items-center justify-between gap-3">
            {/* step hint */}
            <p className="text-xs text-slate-400 hidden sm:block">
              {fields.length} field{fields.length !== 1 ? 's' : ''} to fill
            </p>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => navigate('/choice-form')}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600
                           bg-white border-2 border-slate-200 rounded-2xl
                           hover:bg-slate-50 hover:border-slate-300
                           disabled:opacity-50 transition-all duration-200"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white
                           bg-gradient-to-r from-brand-600 to-indigo-600
                           hover:from-brand-700 hover:to-indigo-700
                           rounded-2xl shadow-md shadow-brand-200
                           disabled:opacity-50 transition-all duration-200
                           active:scale-95"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}</>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChoiceFormFormPage;