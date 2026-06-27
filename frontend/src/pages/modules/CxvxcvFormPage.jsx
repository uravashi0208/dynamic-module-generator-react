/**
 * CxvxcvFormPage.jsx  —  AUTO-GENERATED (2026-06-27T08:36:04.222Z)
 * Module: cxvxcv  |  Slug: cxvxcv
 * Safe to edit — regenerated only when module is deleted + recreated.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import useModuleDataStore from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = 'cxvxcv';
const MODULE_NAME = 'cxvxcv';

const CxvxcvFormPage = () => {
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
    if (result.success) navigate('/cxvxcv');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/cxvxcv')} className="btn-ghost">
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

          {/* Test1 */}
          <div className="sm:col-span-2">
            <label className="label">Test1</label>
          <textarea {...register('test1', {})} rows={4} placeholder="Enter Test1..." className={clsx('input-field resize-none', errors.test1 && 'input-field-error')} />
            {errors.test1 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test1.message}</p>
            )}
          </div>

          {/* Test2 */}
          <div className="">
            <label className="label">Test2</label>
          <input type="text" {...register('test2', {})} placeholder="Enter Test2..." className={clsx('input-field', errors.test2 && 'input-field-error')} />
            {errors.test2 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test2.message}</p>
            )}
          </div>

          {/* Test3 */}
          <div className="">
            <label className="label">Test3</label>
          <input type="text" {...register('test3', {})} placeholder="Enter Test3..." className={clsx('input-field', errors.test3 && 'input-field-error')} />
            {errors.test3 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test3.message}</p>
            )}
          </div>

          {/* Test4 */}
          <div className="">
            <label className="label">Test4</label>
          <input type="text" {...register('test4', {})} placeholder="Enter Test4..." className={clsx('input-field', errors.test4 && 'input-field-error')} />
            {errors.test4 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test4.message}</p>
            )}
          </div>

          {/* Test5 */}
          <div className="">
            <label className="label">Test5</label>
          <input type="text" {...register('test5', {})} placeholder="Enter Test5..." className={clsx('input-field', errors.test5 && 'input-field-error')} />
            {errors.test5 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test5.message}</p>
            )}
          </div>

          {/* Test6 */}
          <div className="">
            <label className="label">Test6</label>
          <input type="text" {...register('test6', {})} placeholder="Enter Test6..." className={clsx('input-field', errors.test6 && 'input-field-error')} />
            {errors.test6 && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.test6.message}</p>
            )}
          </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/cxvxcv')} className="btn-secondary" disabled={isSubmitting}>
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

export default CxvxcvFormPage;
