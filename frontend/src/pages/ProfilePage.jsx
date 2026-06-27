import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../context/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from '../utils/dateUtils';

const profileSchema = z.object({ name: z.string().min(2,'Name must be at least 2 characters').max(100) });
const passwordSchema = z.object({
  currentPassword: z.string().min(1,'Current password is required'),
  newPassword:     z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[@$!%*?&]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message:'Passwords do not match', path:['confirmPassword'] });

const ProfilePage = () => {
  const { user, updateUser }           = useAuthStore();
  const [profileLoading, setPL]        = useState(false);
  const [passwordLoading, setWL]       = useState(false);
  const [showCurrent, setShowCurrent]  = useState(false);
  const [showNew, setShowNew]          = useState(false);

  const pf = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '' } });
  const wf = useForm({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data) => {
    setPL(true);
    try {
      const res = await api.put('/auth/me', data);
      updateUser(res.data.data.user);
      toast.success('Profile updated.');
      pf.reset({ name: res.data.data.user.name });
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setPL(false); }
  };

  const onPasswordSubmit = async (data) => {
    setWL(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed.');
      wf.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
      if (err.response?.status === 400) wf.setError('currentPassword', { message:'Incorrect password.' });
    } finally { setWL(false); }
  };

  const { formState: { errors: pErr } } = pf;
  const { formState: { errors: wErr } } = wf;

  return (
    <div className="animate-slide-up" style={{ maxWidth:680 }}>
      <div className="mb-4">
        <h1 className="fs-5 fw-bold mb-0">Profile Settings</h1>
        <p className="text-muted small mb-0">Manage your account details and security.</p>
      </div>

      {/* Avatar card */}
      <div className="card p-4 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-3 text-white fw-bold flex-shrink-0"
            style={{ width:64, height:64, background:'var(--primary)', fontSize:24 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h5 className="fw-bold mb-0">{user?.name}</h5>
            <p className="text-muted small mb-1">{user?.email}</p>
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill text-bg-warning" style={{ fontSize:10 }}>{user?.role}</span>
              {user?.lastLogin && (
                <span className="text-muted" style={{ fontSize:11 }}>Last login: {format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <i className="ti ti-user text-primary" />
          <h6 className="fw-semibold mb-0">Personal Information</h6>
        </div>
        <form onSubmit={pf.handleSubmit(onProfileSubmit)}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input {...pf.register('name')} className={`form-control${pErr.name ? ' is-invalid' : ''}`} placeholder="Your full name" />
            {pErr.name && <div className="invalid-feedback">{pErr.name.message}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input value={user?.email || ''} disabled className="form-control bg-light text-muted" />
            <div className="form-text">Email cannot be changed.</div>
          </div>
          <div className="text-end">
            <button type="submit" disabled={profileLoading || !pf.formState.isDirty} className="btn btn-primary d-inline-flex align-items-center gap-2">
              {profileLoading ? <><span className="spinner-border spinner-border-sm" /> Saving…</> : <><i className="ti ti-device-floppy" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <i className="ti ti-lock text-primary" />
          <h6 className="fw-semibold mb-0">Change Password</h6>
        </div>
        <form onSubmit={wf.handleSubmit(onPasswordSubmit)}>
          <div className="mb-3">
            <label className="form-label">Current Password</label>
            <div className="input-group">
              <input {...wf.register('currentPassword')} type={showCurrent ? 'text' : 'password'} placeholder="••••••••"
                className={`form-control${wErr.currentPassword ? ' is-invalid' : ''}`} />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="btn btn-outline-secondary">
                <i className={`ti ${showCurrent ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
              {wErr.currentPassword && <div className="invalid-feedback">{wErr.currentPassword.message}</div>}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <div className="input-group">
              <input {...wf.register('newPassword')} type={showNew ? 'text' : 'password'} placeholder="••••••••"
                className={`form-control${wErr.newPassword ? ' is-invalid' : ''}`} />
              <button type="button" onClick={() => setShowNew(!showNew)} className="btn btn-outline-secondary">
                <i className={`ti ${showNew ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
              {wErr.newPassword && <div className="invalid-feedback">{wErr.newPassword.message}</div>}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm New Password</label>
            <input {...wf.register('confirmPassword')} type="password" placeholder="••••••••"
              className={`form-control${wErr.confirmPassword ? ' is-invalid' : ''}`} />
            {wErr.confirmPassword && <div className="invalid-feedback">{wErr.confirmPassword.message}</div>}
          </div>
          <div className="bg-light rounded-2 p-3 mb-3 border" style={{ fontSize:12 }}>
            <p className="fw-semibold mb-2 text-muted">Password must contain:</p>
            <div className="row g-1">
              {[
                { label:'8+ characters', test:(p) => p?.length >= 8 },
                { label:'Uppercase letter', test:(p) => /[A-Z]/.test(p||'') },
                { label:'Lowercase letter', test:(p) => /[a-z]/.test(p||'') },
                { label:'Number', test:(p) => /[0-9]/.test(p||'') },
                { label:'Special char', test:(p) => /[@$!%*?&]/.test(p||'') },
              ].map((req) => {
                const ok = req.test(wf.watch('newPassword'));
                return (
                  <div key={req.label} className="col-6">
                    <span style={{ color: ok ? '#22c55e' : '#a3a3a3' }}>
                      <i className={`ti ${ok ? 'ti-circle-check' : 'ti-circle'} me-1`} />{req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-end">
            <button type="submit" disabled={passwordLoading} className="btn btn-primary d-inline-flex align-items-center gap-2">
              {passwordLoading ? <><span className="spinner-border spinner-border-sm" /> Updating…</> : <><i className="ti ti-lock" /> Update Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
