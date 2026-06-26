/**
 * DateTimeFormFormPage.jsx  —  AUTO-GENERATED (2026-06-25T09:01:03.137Z)
 * Module: Date Time Form  |  Slug: date-time-form
 * Safe to edit — regenerated only when module is deleted + recreated.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import useModuleDataStore from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = 'date-time-form';
const MODULE_NAME = 'Date Time Form';

const DateTimeFormFormPage = () => {
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
    if (result.success) navigate('/date-time-form');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/date-time-form')} className="btn-ghost">
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

          {/* DOB */}
          <div className="">
            <label className="label">DOB</label>
          <input type="date" {...register('dob', {})} placeholder="Enter DOB..." className={clsx('input-field', errors.dob && 'input-field-error')} />
            {errors.dob && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.dob.message}</p>
            )}
          </div>

          {/* Login Date Time */}
          <div className="">
            <label className="label">Login Date Time</label>
          <input type="datetime-local" {...register('login_date_time', {})} placeholder="Enter Login Date Time..." className={clsx('input-field', errors.login_date_time && 'input-field-error')} />
            {errors.login_date_time && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.login_date_time.message}</p>
            )}
          </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/date-time-form')} className="btn-secondary" disabled={isSubmitting}>
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

export default DateTimeFormFormPage;
