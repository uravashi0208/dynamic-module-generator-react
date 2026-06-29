import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../context/authStore';

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:           z.string().min(1, 'Email is required').email('Enter a valid email'),
  password:        z.string().min(8, '8+ chars').regex(/[A-Z]/, 'Uppercase').regex(/[a-z]/, 'Lowercase').regex(/[0-9]/, 'Number').regex(/[@$!%*?&]/, 'Special char'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const PASSWORD_CHECKS = [
  { label: '8+ chars',  test: (p) => p?.length >= 8 },
  { label: 'A–Z',       test: (p) => /[A-Z]/.test(p || '') },
  { label: 'a–z',       test: (p) => /[a-z]/.test(p || '') },
  { label: '0–9',       test: (p) => /[0-9]/.test(p || '') },
  { label: '#!@',       test: (p) => /[@$!%*?&]/.test(p || '') },
];

const PasswordBar = ({ password }) => {
  if (!password) return null;
  const results = PASSWORD_CHECKS.map((c) => ({ ...c, ok: c.test(password) }));
  const score   = results.filter((r) => r.ok).length;
  const color   = score <= 2 ? '#ef4444' : score <= 3 ? '#f59e0b' : '#22c55e';

  return (
    <div className="mt-2">
      <div className="d-flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="pw-bar-track"
            style={{ background: i <= score ? color : 'rgba(255,255,255,.15)' }}
          />
        ))}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {results.map((c) => (
          <span key={c.label} className={`pw-check ${c.ok ? 'text-success' : ''}`}
            style={{ fontSize: 11, color: c.ok ? '#86efac' : 'rgba(255,255,255,.35)' }}>
            <i className={`ti fs-10px ${c.ok ? 'ti-check' : 'ti-x'}`}/> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const FIELDS = [
  { name: 'name',  type: 'text',  label: 'Full name',     placeholder: 'Jane Doe' },
  { name: 'email', type: 'email', label: 'Email address', placeholder: 'you@example.com' },
];

const RegisterPage = () => {
  const [showPw, setShowPw]           = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate                      = useNavigate();

  const {
    register, handleSubmit, watch,
    formState: { errors }, setError,
  } = useForm({ resolver: zodResolver(schema) });
  const password = watch('password', '');

  const onSubmit = async (data) => {
    const { confirmPassword: _, ...payload } = data;
    const result = await registerUser(payload);
    if (result.success) navigate('/dashboard', { replace: true });
    else setError('root', { message: result.error });
  };

  return (
    <div className="auth-bg">
      <div className="auth-blob auth-blob--orange" style={{ top: '30%' }} />
      <div className="auth-blob auth-blob--indigo" style={{ bottom: '30%' }} />

      <div className="auth-wrapper auth-wrapper--wide animate-fade-in">
        <div className="text-center mb-4">
          <div className="auth-logo-wrap d-inline-flex mb-3">
            <i className="ti ti-cpu text-white fs-26px" />
          </div>
          <h1 className="fw-bold text-white fs-4 mb-0">Dynamic Module Gen</h1>
          <p className="auth-sub-text fs-13px">Create your admin account</p>
        </div>

        <div className="auth-card">
          <h2 className="text-white fw-semibold mb-4 fs-18px">Create account</h2>

          {errors.root && (
            <div className="auth-error-alert">
              <i className="ti ti-alert-circle" /> {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {FIELDS.map(({ name, type, label, placeholder }) => (
              <div className="mb-3" key={name}>
                <label className="auth-label">{label}</label>
                <input
                  {...register(name)}
                  type={type}
                  placeholder={placeholder}
                  className={`auth-input${errors[name] ? ' is-error' : ''}`}
                />
                {errors[name] && (
                  <p className="auth-field-error">{errors[name].message}</p>
                )}
              </div>
            ))}

            {/* Password */}
            <div className="mb-3">
              <label className="auth-label">Password</label>
              <div className="position-relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`auth-input${errors.password ? ' is-error' : ''}`}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                >
                  <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              <PasswordBar password={password} />
              {errors.password && (
                <p className="auth-field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="mb-4">
              <label className="auth-label">Confirm password</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={`auth-input${errors.confirmPassword ? ' is-error' : ''}`}
              />
              {errors.confirmPassword && (
                <p className="auth-field-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm" /> Creating account…</>
              ) : (
                <>Create account <i className="ti ti-arrow-right" /></>
              )}
            </button>
          </form>

          <p className="auth-sub-text text-center mt-3 mb-0 fs-13px">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
