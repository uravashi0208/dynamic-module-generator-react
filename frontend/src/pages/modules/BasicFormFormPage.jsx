/**
 * BasicFormFormPage.jsx  —  AUTO-GENERATED (2026-06-27T10:14:47.742Z)
 * Module: Basic Form  |  Slug: basic-form
 * Safe to edit — regenerated only when module is deleted + recreated.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Database, AlertCircle } from 'lucide-react';
import useModuleDataStore from '../../context/moduleDataStore';
import clsx from 'clsx';

const MODULE_SLUG = 'basic-form';
const MODULE_NAME = 'Basic Form';

const BasicFormFormPage = () => {
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
    if (result.success) navigate('/basic-form');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/basic-form')} className="btn-ghost">
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

          {/* Name */}
          <div className="">
            <label className="label">Name</label>
          <input type="text" {...register('name', {})} placeholder="Enter First Name" className={clsx('input-field', errors.name && 'input-field-error')} />
            {errors.name && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="">
            <label className="label">Email</label>
          <input type="email" {...register('email', {})} placeholder="****@*****.com" className={clsx('input-field', errors.email && 'input-field-error')} />
            {errors.email && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.email.message}</p>
            )}
          </div>

          {/* Passoword */}
          <div className="">
            <label className="label">Passoword</label>
          <input type="password" {...register('passoword', {})} placeholder="************" className={clsx('input-field', errors.passoword && 'input-field-error')} />
            {errors.passoword && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.passoword.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="label">Address</label>
          <textarea {...register('address', {})} rows={4} placeholder="Enter Address..." className={clsx('input-field resize-none', errors.address && 'input-field-error')} />
            {errors.address && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.address.message}</p>
            )}
          </div>

          {/* Phone Nummber */}
          <div className="">
            <label className="label">Phone Nummber</label>
          <input type="number" {...register('phone_nummber', { ...{}, valueAsNumber: true })} placeholder="Enter Phone Nummber..." className={clsx('input-field', errors.phone_nummber && 'input-field-error')} />
            {errors.phone_nummber && (
              <p className="error-message"><AlertCircle className="w-3.5 h-3.5" />{errors.phone_nummber.message}</p>
            )}
          </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/basic-form')} className="btn-secondary" disabled={isSubmitting}>
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

export default BasicFormFormPage;
