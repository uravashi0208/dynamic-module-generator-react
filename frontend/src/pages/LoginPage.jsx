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
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors }, setError } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) navigate(from, { replace: true });
    else setError('root', { message: result.error });
  };

  return (
    <div className="auth-bg">
      {/* blobs */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'25%', left:'-8rem', width:'24rem', height:'24rem', background:'rgba(230,98,57,.18)', borderRadius:'50%', filter:'blur(72px)' }} />
        <div style={{ position:'absolute', bottom:'25%', right:'-8rem', width:'24rem', height:'24rem', background:'rgba(99,102,241,.18)', borderRadius:'50%', filter:'blur(72px)' }} />
      </div>

      <div className="animate-fade-in" style={{ position:'relative', width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width:56, height:56, background:'var(--primary)' }}>
            <i className="ti ti-cpu text-white" style={{ fontSize:26 }} />
          </div>
          <h1 className="fw-bold text-white fs-4 mb-0">Dynamic Module Gen</h1>
          <p style={{ color:'rgba(255,255,255,.6)', fontSize:13 }}>Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="text-white fw-semibold mb-4" style={{ fontSize:18 }}>Welcome back</h2>

          {errors.root && (
            <div className="d-flex align-items-center gap-2 rounded-2 mb-3 px-3 py-2"
              style={{ background:'rgba(251,44,54,.2)', border:'1px solid rgba(251,44,54,.3)', color:'#fca5a5', fontSize:13 }}>
              <i className="ti ti-alert-circle" />
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.75)', fontSize:13, fontWeight:500 }}>
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`auth-input${errors.email ? ' is-error' : ''}`}
              />
              {errors.email && <p style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>{errors.email.message}</p>}
            </div>

            <div className="mb-4">
              <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.75)', fontSize:13, fontWeight:500 }}>
                Password
              </label>
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
                  onClick={() => setShowPw(!showPw)}
                  className="btn p-0 border-0 position-absolute top-50 translate-middle-y"
                  style={{ right:'0.75rem', color:'rgba(255,255,255,.4)', background:'transparent' }}
                >
                  <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              {errors.password && <p style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2">
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm" /> Signing in…</>
              ) : (
                <>Sign in <i className="ti ti-arrow-right" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-3 mb-0" style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'rgba(255,255,255,.85)', fontWeight:500, textDecoration:'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
