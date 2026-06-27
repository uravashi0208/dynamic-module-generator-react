import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../context/authStore';

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:           z.string().min(1, 'Email is required').email('Enter a valid email'),
  password:        z.string().min(8,'8+ chars').regex(/[A-Z]/,'Uppercase').regex(/[a-z]/,'Lowercase').regex(/[0-9]/,'Number').regex(/[@$!%*?&]/,'Special char'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const PasswordBar = ({ password }) => {
  if (!password) return null;
  const checks = [
    { label:'8+ chars',  ok: password.length >= 8 },
    { label:'A–Z',       ok: /[A-Z]/.test(password) },
    { label:'a–z',       ok: /[a-z]/.test(password) },
    { label:'0–9',       ok: /[0-9]/.test(password) },
    { label:'#!@',       ok: /[@$!%*?&]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color = score <= 2 ? '#ef4444' : score <= 3 ? '#f59e0b' : '#22c55e';
  return (
    <div className="mt-2">
      <div className="d-flex gap-1 mb-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= score ? color : 'rgba(255,255,255,.15)', transition:'background .2s' }} />
        ))}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize:11, color: c.ok ? '#86efac' : 'rgba(255,255,255,.35)' }}>
            <i className={`ti ${c.ok ? 'ti-check' : 'ti-x'}`} style={{ fontSize:10 }} /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const [showPw, setShowPw] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors }, setError } = useForm({ resolver: zodResolver(schema) });
  const password = watch('password', '');

  const onSubmit = async (data) => {
    const { confirmPassword, ...payload } = data;
    const result = await registerUser(payload);
    if (result.success) navigate('/dashboard', { replace: true });
    else setError('root', { message: result.error });
  };

  return (
    <div className="auth-bg">
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'30%', left:'-8rem', width:'24rem', height:'24rem', background:'rgba(230,98,57,.18)', borderRadius:'50%', filter:'blur(72px)' }} />
        <div style={{ position:'absolute', bottom:'30%', right:'-8rem', width:'24rem', height:'24rem', background:'rgba(99,102,241,.18)', borderRadius:'50%', filter:'blur(72px)' }} />
      </div>

      <div className="animate-fade-in" style={{ position:'relative', width:'100%', maxWidth:440 }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width:56, height:56, background:'var(--primary)' }}>
            <i className="ti ti-cpu text-white" style={{ fontSize:26 }} />
          </div>
          <h1 className="fw-bold text-white fs-4 mb-0">Dynamic Module Gen</h1>
          <p style={{ color:'rgba(255,255,255,.6)', fontSize:13 }}>Create your admin account</p>
        </div>

        <div className="auth-card">
          <h2 className="text-white fw-semibold mb-4" style={{ fontSize:18 }}>Create account</h2>

          {errors.root && (
            <div className="d-flex align-items-center gap-2 rounded-2 mb-3 px-3 py-2"
              style={{ background:'rgba(251,44,54,.2)', border:'1px solid rgba(251,44,54,.3)', color:'#fca5a5', fontSize:13 }}>
              <i className="ti ti-alert-circle" /> {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {[
              { name:'name',    type:'text',     label:'Full name',       placeholder:'Jane Doe' },
              { name:'email',   type:'email',    label:'Email address',   placeholder:'you@example.com' },
            ].map(({ name, type, label, placeholder }) => (
              <div className="mb-3" key={name}>
                <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.75)', fontSize:13, fontWeight:500 }}>{label}</label>
                <input {...register(name)} type={type} placeholder={placeholder}
                  className={`auth-input${errors[name] ? ' is-error' : ''}`} />
                {errors[name] && <p style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>{errors[name].message}</p>}
              </div>
            ))}

            <div className="mb-3">
              <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.75)', fontSize:13, fontWeight:500 }}>Password</label>
              <div className="position-relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  className={`auth-input${errors.password ? ' is-error' : ''}`} style={{ paddingRight:'2.5rem' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="btn p-0 border-0 position-absolute top-50 translate-middle-y"
                  style={{ right:'0.75rem', color:'rgba(255,255,255,.4)', background:'transparent' }}>
                  <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              <PasswordBar password={password} />
              {errors.password && <p style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>{errors.password.message}</p>}
            </div>

            <div className="mb-4">
              <label className="d-block mb-1" style={{ color:'rgba(255,255,255,.75)', fontSize:13, fontWeight:500 }}>Confirm password</label>
              <input {...register('confirmPassword')} type="password" placeholder="••••••••"
                className={`auth-input${errors.confirmPassword ? ' is-error' : ''}`} />
              {errors.confirmPassword && <p style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2">
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm" /> Creating account…</>
              ) : (
                <>Create account <i className="ti ti-arrow-right" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-3 mb-0" style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'rgba(255,255,255,.85)', fontWeight:500, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
