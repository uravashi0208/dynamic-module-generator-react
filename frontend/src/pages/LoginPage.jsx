import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../context/authStore';

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const [showPw, setShowPw]    = useState(false);
  const { login, isLoading }   = useAuthStore();
  const navigate               = useNavigate();
  const location               = useLocation();
  const from                   = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) navigate(from, { replace: true });
    else setError('root', { message: result.error });
  };

  return (
    <div className="auth-bg">
      {/* Background blobs */}
      <div className="auth-blob auth-blob--orange" />
      <div className="auth-blob auth-blob--indigo" />

      <div className="auth-wrapper animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="auth-logo-wrap d-inline-flex mb-3">
            <i className="ti ti-cpu text-white fs-26px" />
          </div>
          <h1 className="fw-bold text-white fs-4 mb-0">Dynamic Module Gen</h1>
          <p className="auth-sub-text fs-13px">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="text-white fw-semibold mb-4 fs-18px">Welcome back</h2>

          {errors.root && (
            <div className="auth-error-alert">
              <i className="ti ti-alert-circle" />
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="mb-3">
              <label className="auth-label">Email address</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`auth-input${errors.email ? ' is-error' : ''}`}
              />
              {errors.email && (
                <p className="auth-field-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="auth-label">Password</label>
              <div className="position-relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="auth-field-error">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm" /> Signing in…</>
              ) : (
                <>Sign in <i className="ti ti-arrow-right" /></>
              )}
            </button>
          </form>

          <p className="auth-sub-text text-center mt-3 mb-0 fs-13px">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
