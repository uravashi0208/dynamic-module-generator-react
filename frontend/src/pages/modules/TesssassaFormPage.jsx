/**
 * TesssassaFormPage.jsx  —  AUTO-GENERATED (2026-06-27T10:04:39.020Z)
 * Module: tesssassa  |  Slug: tesssassa
 * Safe to edit — regenerated only when module is deleted + recreated.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import useModuleDataStore from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = 'tesssassa';
const MODULE_NAME = 'tesssassa';

const TesssassaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { fetchRecord, createRecord, updateRecord, isSubmitting } = useModuleDataStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: 'onBlur' });
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchRecord(MODULE_SLUG, id).then((record) => {
        if (record) reset(record);
        setLoading(false);
      });
    }
  }, [id]);

  const onSubmit = async (data) => {
    const result = isEdit
      ? await updateRecord(MODULE_SLUG, id, data)
      : await createRecord(MODULE_SLUG, data);
    if (result.success) navigate('/tesssassa');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tesssassa')} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow-sm">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit' : 'New'} {MODULE_NAME}</h1>
            <p className="text-xs text-slate-400 font-mono">{isEdit ? 'Update record' : 'Create record'}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* test1 */}
          <div className="">
            <label className="label">test1</label>
          <input type="text" {...register('test1', {})} placeholder="Enter test1..." className={clsx('input-field', errors.test1 && 'input-field-error')} />
            {errors.test1 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test1.message}</p>
            )}
          </div>

          {/* test2 */}
          <div className="">
            <label className="label">test2</label>
          <input type="text" {...register('test2', {})} placeholder="Enter test2..." className={clsx('input-field', errors.test2 && 'input-field-error')} />
            {errors.test2 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test2.message}</p>
            )}
          </div>

          {/* email */}
          <div className="">
            <label className="label">email</label>
          <input type="text" {...register('email', {})} placeholder="Enter email..." className={clsx('input-field', errors.email && 'input-field-error')} />
            {errors.email && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.email.message}</p>
            )}
          </div>

          {/* password */}
          <div className="">
            <label className="label">password</label>
          <input type="text" {...register('password', {})} placeholder="Enter password..." className={clsx('input-field', errors.password && 'input-field-error')} />
            {errors.password && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.password.message}</p>
            )}
          </div>

          {/* gender */}
          <div className="sm:col-span-2">
            <label className="label">gender</label>
          <div className="space-y-0.5 pt-1">
              <label key="male" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="radio" value="male" {...register('gender', {})} className="w-4 h-4 accent-brand-600 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">male</span>
              </label>
              <label key="female" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="radio" value="female" {...register('gender', {})} className="w-4 h-4 accent-brand-600 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">female</span>
              </label>
            </div>
            {errors.gender && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.gender.message}</p>
            )}
          </div>

          {/* hobby */}
          <div className="sm:col-span-2">
            <div className="space-y-0.5 pt-1">
              <label key="sdd" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="checkbox" value="sdd" {...register('hobby')} className="w-4 h-4 accent-brand-600 rounded border-slate-300 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">sdd</span>
              </label>
              <label key="sdas" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="checkbox" value="sdas" {...register('hobby')} className="w-4 h-4 accent-brand-600 rounded border-slate-300 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">sdas</span>
              </label>
              <label key="sdas" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="checkbox" value="sdas" {...register('hobby')} className="w-4 h-4 accent-brand-600 rounded border-slate-300 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">sdas</span>
              </label>
              <label key="sdasd" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="checkbox" value="sdasd" {...register('hobby')} className="w-4 h-4 accent-brand-600 rounded border-slate-300 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">sdasd</span>
              </label>
              <label key="sdasd" className="flex items-center gap-3 py-2 cursor-pointer group">
                <input type="checkbox" value="sdasd" {...register('hobby')} className="w-4 h-4 accent-brand-600 rounded border-slate-300 cursor-pointer" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">sdasd</span>
              </label>
            </div>
            {errors.hobby && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.hobby.message}</p>
            )}
          </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/tesssassa')} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TesssassaFormPage;
