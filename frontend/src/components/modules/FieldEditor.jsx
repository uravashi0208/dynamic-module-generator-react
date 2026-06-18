import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  AlertCircle, Type, X, PlusCircle, Eye, EyeOff,
  Settings2, ToggleLeft
} from 'lucide-react';
import { FIELD_TYPES, getFieldTypeIcon } from '../../utils/fieldTypes';
import clsx from 'clsx';

const TYPES_WITH_OPTIONS = ['select', 'radio', 'checkbox'];

// Pastel color palette per field type category
const CATEGORY_COLORS = {
  'Basic':      { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  'Choice':     { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  'Date & Time':{ bg: 'bg-emerald-50',icon: 'bg-emerald-100 text-emerald-600',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700' },
  'Advanced':   { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
};

const getCategory = (fieldType) => {
  const ft = FIELD_TYPES.find((t) => t.value === fieldType);
  return ft?.category || 'Basic';
};

/* ─────────────────────────────────────────── Field Card ── */
const FieldCard = ({ index, onRemove, totalCount }) => {
  const [expanded, setExpanded] = useState(true);
  const [showValidations, setShowValidations] = useState(false);
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const [optionInput, setOptionInput] = useState('');

  const fieldType  = watch(`fields.${index}.fieldType`);
  const fieldLabel = watch(`fields.${index}.fieldLabel`);
  const options    = watch(`fields.${index}.options`) || [];
  const fieldErrors = errors?.fields?.[index];
  const TypeIcon   = getFieldTypeIcon(fieldType);
  const category   = getCategory(fieldType);
  const colors     = CATEGORY_COLORS[category] || CATEGORY_COLORS['Basic'];
  const hasError   = Object.keys(fieldErrors || {}).length > 0;

  const addOption = () => {
    if (!optionInput.trim()) return;
    const newOpt = {
      label: optionInput.trim(),
      value: optionInput.trim().toLowerCase().replace(/\s+/g, '_'),
    };
    setValue(`fields.${index}.options`, [...options, newOpt]);
    setOptionInput('');
  };

  const removeOption = (i) =>
    setValue(`fields.${index}.options`, options.filter((_, idx) => idx !== i));

  return (
    <div className={clsx(
      'group rounded-2xl border-2 bg-white transition-all duration-200',
      hasError ? 'border-red-300 shadow-red-100 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm'
    )}>
      {/* ── Card Header ── */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-t-2xl transition-colors',
        expanded ? `${colors.bg}` : 'bg-white'
      )}>
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Field Number */}
        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-500">{index + 1}</span>
        </div>

        {/* Type Icon */}
        <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <TypeIcon className="w-4 h-4" />
        </div>

        {/* Label & Type */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate leading-tight">
            {fieldLabel || <span className="text-slate-400 font-normal italic">Untitled Field</span>}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', colors.badge)}>
              {FIELD_TYPES.find((t) => t.value === fieldType)?.label || 'Text'}
            </span>
            <span className="text-[10px] text-slate-400">{category}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasError && (
            <AlertCircle className="w-4 h-4 text-red-400 mr-1" />
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/80 text-slate-400 hover:text-slate-700 transition-all"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
            title="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {/* Always-visible chevron when not hovering */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all group-hover:hidden'
          )}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Card Body ── */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4">

          {/* Row 1: Label + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Field Label <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`fields.${index}.fieldLabel`)}
                placeholder="e.g. First Name, Email Address"
                className={clsx(
                  'w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:bg-white focus:ring-brand-400 focus:border-transparent transition-all',
                  fieldErrors?.fieldLabel ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                )}
              />
              {fieldErrors?.fieldLabel && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.fieldLabel.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Field Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register(`fields.${index}.fieldType`)}
                  className={clsx(
                    'w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 appearance-none',
                    'focus:outline-none focus:ring-2 focus:bg-white focus:ring-brand-400 focus:border-transparent transition-all cursor-pointer',
                    fieldErrors?.fieldType ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {Object.entries(
                    FIELD_TYPES.reduce((acc, ft) => {
                      if (!acc[ft.category]) acc[ft.category] = [];
                      acc[ft.category].push(ft);
                      return acc;
                    }, {})
                  ).map(([category, types]) => (
                    <optgroup key={category} label={`── ${category}`}>
                      {types.map((ft) => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Placeholder + Default */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!['checkbox', 'radio', 'file', 'color', 'range', 'date', 'datetime-local'].includes(fieldType) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Placeholder Text
                </label>
                <input
                  {...register(`fields.${index}.placeholder`)}
                  placeholder="Hint shown inside the field"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white focus:ring-brand-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            {!['file', 'password', 'checkbox'].includes(fieldType) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Default Value
                </label>
                <input
                  {...register(`fields.${index}.defaultValue`)}
                  placeholder="Pre-filled value (optional)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white focus:ring-brand-400 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>

          {/* Options for select/radio/checkbox */}
          {TYPES_WITH_OPTIONS.includes(fieldType) && (
            <div className={clsx('rounded-xl border p-4 space-y-3', colors.border, colors.bg)}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ToggleLeft className="w-3.5 h-3.5" /> Options
                </p>
                <span className="text-xs text-slate-500">{options.length} option{options.length !== 1 ? 's' : ''}</span>
              </div>

              {options.length > 0 && (
                <div className="space-y-1.5">
                  {options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-3 py-2 group/opt"
                    >
                      <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', colors.icon.split(' ')[1])} />
                      <span className="flex-1 text-sm font-medium text-slate-800">{opt.label}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{opt.value}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(optIdx)}
                        className="opacity-0 group-hover/opt:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                  placeholder="Type option label, press Enter"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={addOption}
                  disabled={!optionInput.trim()}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
                    colors.icon, 'border', colors.border,
                    'disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80'
                  )}
                >
                  <PlusCircle className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          )}

          {/* Validations Accordion */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowValidations(!showValidations)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Validation Rules</span>
              </div>
              {showValidations
                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              }
            </button>

            {showValidations && (
              <div className="p-4 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Required toggle */}
                <label className="col-span-2 sm:col-span-1 flex items-center gap-2.5 cursor-pointer group/req
                  bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 rounded-xl px-3 py-2.5 transition-all">
                  <input
                    {...register(`fields.${index}.validations.required`)}
                    type="checkbox"
                    className="w-4 h-4 accent-brand-600 rounded"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 group-hover/req:text-brand-700 transition-colors">Required</p>
                    <p className="text-[10px] text-slate-400">Must fill this field</p>
                  </div>
                </label>

                {['text', 'email', 'password', 'textarea', 'url', 'tel'].includes(fieldType) && (
                  <>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Min Length</label>
                      <input
                        {...register(`fields.${index}.validations.minLength`, { valueAsNumber: true })}
                        type="number" min="0" placeholder="0"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Max Length</label>
                      <input
                        {...register(`fields.${index}.validations.maxLength`, { valueAsNumber: true })}
                        type="number" min="0" placeholder="255"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}

                {['number', 'range'].includes(fieldType) && (
                  <>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Min</label>
                      <input
                        {...register(`fields.${index}.validations.min`, { valueAsNumber: true })}
                        type="number" placeholder="0"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Max</label>
                      <input
                        {...register(`fields.${index}.validations.max`, { valueAsNumber: true })}
                        type="number" placeholder="100"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────── Field Editor ── */
const FieldEditor = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'fields' });

  const addField = () => {
    append({
      fieldLabel: '',
      fieldType: 'text',
      placeholder: '',
      defaultValue: '',
      options: [],
      validations: { required: false },
      isVisible: true,
      order: fields.length + 1,
    });
  };

  return (
    <div className="space-y-4">

      {/* ── Header Row ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold">
              {fields.length}
            </span>
            <p className="text-sm font-bold text-slate-800">
              {fields.length === 0 ? 'No fields yet' : `Field${fields.length !== 1 ? 's' : ''} defined`}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">Each field becomes a column in your database</p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </button>
      </div>

      {/* ── Empty State ── */}
      {fields.length === 0 ? (
        <button
          type="button"
          onClick={addField}
          className="w-full group"
        >
          <div className="border-2 border-dashed border-slate-200 group-hover:border-brand-300 rounded-2xl p-10 text-center transition-all duration-200 group-hover:bg-brand-50/30">
            <div className="w-14 h-14 bg-slate-100 group-hover:bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors shadow-sm">
              <Type className="w-7 h-7 text-slate-400 group-hover:text-brand-500 transition-colors" />
            </div>
            <p className="text-base font-bold text-slate-700 group-hover:text-brand-700 transition-colors">
              Add your first field
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Text, email, dropdowns, date pickers and more
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl group-hover:bg-brand-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Field
            </div>
          </div>
        </button>
      ) : (
        <>
          {/* ── Field Cards ── */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <FieldCard
                key={field.id}
                index={index}
                onRemove={() => remove(index)}
                totalCount={fields.length}
              />
            ))}
          </div>

          {/* ── Add More Button ── */}
          <button
            type="button"
            onClick={addField}
            className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-500
              hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white transition-all">
              <Plus className="w-3.5 h-3.5" />
            </div>
            Add another field
          </button>

          {/* ── Field Type Legend ── */}
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
              <div key={cat} className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', colors.badge)}>
                <div className={clsx('w-1.5 h-1.5 rounded-full', colors.icon.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-'))} />
                {cat}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FieldEditor;