import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Layers, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../context/authStore';
import clsx from 'clsx';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase letter')
    .regex(/[a-z]/, 'Must include lowercase letter')
    .regex(/[0-9]/, 'Must include number')
    .regex(/[@$!%*?&]/, 'Must include special character (@$!%*?&)'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[@$!%*?&]/.test(password) },
    { label: '8+ characters', pass: password.length >= 8 },
  ];
  const score = checks.filter((c) => c.pass).length;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full transition-colors',
              i <= score
                ? score <= 2 ? 'bg-red-400' : score <= 3 ? 'bg-amber-400' : score <= 4 ? 'bg-yellow-400' : 'bg-emerald-400'
                : 'bg-white/20'
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={clsx('text-xs flex items-center gap-1', c.pass ? 'text-emerald-300' : 'text-white/40')}>
            <CheckCircle2 className="w-3 h-3" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    const { confirmPassword, ...formData } = data;
    const result = await registerUser(formData);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('root', { message: result.error });
    }
  };

  const inputClass = (hasError) => clsx(
    'w-full px-3.5 py-2.5 bg-white/10 border rounded-lg text-white placeholder-white/30 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all',
    hasError ? 'border-red-400/60' : 'border-white/20'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl shadow-glow-lg mb-4">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Dynamic Module Gen</h1>
          <p className="text-brand-300 text-sm mt-1">Create your admin account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>

          {errors.root && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-200 mb-1.5">Full name</label>
              <input {...register('name')} placeholder="John Doe" className={inputClass(errors.name)} />
              {errors.name && <p className="mt-1.5 text-xs text-red-300">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-200 mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className={inputClass(errors.email)} />
              {errors.email && <p className="mt-1.5 text-xs text-red-300">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-200 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass(errors.password)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
              {errors.password && <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-200 mb-1.5">Confirm password</label>
              <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={inputClass(errors.confirmPassword)} />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-300">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 
                disabled:opacity-60 text-white font-semibold rounded-lg transition-all duration-150 shadow-glow mt-2">
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-300 hover:text-brand-200 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
