import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from '../utils/dateUtils';
import clsx from 'clsx';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase')
    .regex(/[a-z]/, 'Must include lowercase')
    .regex(/[0-9]/, 'Must include number')
    .regex(/[@$!%*?&]/, 'Must include special character'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/me', data);
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully.');
      profileForm.reset({ name: res.data.data.user.name });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully.');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
      if (err.response?.status === 400) {
        passwordForm.setError('currentPassword', { message: 'Current password is incorrect.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const { formState: { errors: pErr } } = profileForm;
  const { formState: { errors: pwErr } } = passwordForm;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account details and security.</p>
      </div>

      {/* Avatar + Meta */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-glow flex-shrink-0">
            <span className="text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="badge badge-info">{user?.role}</span>
              {user?.lastLogin && (
                <span className="text-xs text-slate-400">
                  Last login: {format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4.5 h-4.5 text-brand-600" size={18} />
          <h3 className="text-sm font-semibold text-slate-800">Personal Information</h3>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              {...profileForm.register('name')}
              placeholder="Your full name"
              className={clsx('input-field', pErr.name && 'input-field-error')}
            />
            {pErr.name && (
              <p className="error-message"><AlertCircle className="w-3 h-3" />{pErr.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              value={user?.email || ''}
              disabled
              className="input-field bg-surface-50 text-slate-400 cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading || !profileForm.formState.isDirty}
              className="btn-primary"
            >
              {profileLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4.5 h-4.5 text-brand-600" size={18} />
          <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                {...passwordForm.register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className={clsx('input-field pr-10', pwErr.currentPassword && 'input-field-error')}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErr.currentPassword && (
              <p className="error-message"><AlertCircle className="w-3 h-3" />{pwErr.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                {...passwordForm.register('newPassword')}
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className={clsx('input-field pr-10', pwErr.newPassword && 'input-field-error')}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErr.newPassword && (
              <p className="error-message"><AlertCircle className="w-3 h-3" />{pwErr.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              {...passwordForm.register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className={clsx('input-field', pwErr.confirmPassword && 'input-field-error')}
            />
            {pwErr.confirmPassword && (
              <p className="error-message"><AlertCircle className="w-3 h-3" />{pwErr.confirmPassword.message}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs font-medium text-slate-600 mb-2">Password must contain:</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: '8+ characters', test: (p) => p?.length >= 8 },
                { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p || '') },
                { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p || '') },
                { label: 'Number', test: (p) => /[0-9]/.test(p || '') },
                { label: 'Special character', test: (p) => /[@$!%*?&]/.test(p || '') },
              ].map((req) => {
                const passes = req.test(passwordForm.watch('newPassword'));
                return (
                  <span key={req.label} className={clsx('text-xs flex items-center gap-1.5', passes ? 'text-emerald-600' : 'text-slate-400')}>
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    {req.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={passwordLoading} className="btn-primary">
              {passwordLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
              ) : (
                <><Lock className="w-4 h-4" /> Update Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
