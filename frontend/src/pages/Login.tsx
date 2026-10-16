import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.tsx';

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
         strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

// Login only checks that the fields are filled in and the email is well formed.
// Password strength rules belong on the register page, not here.

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Enter a complete email address, like john@example.com.';
  }
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  return null;
}

type FieldName = 'email' | 'password';
type FormErrors = Partial<Record<FieldName | 'form', string>>;

export default function Login() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function runValidation(name: FieldName, all = values): string | null {
    return name === 'email' ? validateEmail(all.email) : validatePassword(all.password);
  }

  function handleChange(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    setErrors((prev) => ({
      ...prev,
      form: undefined,
      ...(touched[name] ? { [name]: runValidation(name, next) ?? undefined } : {}),
    }));
  }

  function handleBlur(name: FieldName) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: runValidation(name) ?? undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const names: FieldName[] = ['email', 'password'];
    const nextErrors: FormErrors = {};
    for (const n of names) {
      const err = runValidation(n);
      if (err) nextErrors[n] = err;
    }
    setErrors(nextErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(names.find((n) => nextErrors[n])!)?.focus();
      return;
    }

    // Send credentials to backend.
    // Contract: POST /api/auth/login
    //   body   { email, password }
    //   401    wrong email or password
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      if (!res.ok) {
        setErrors({
          form: res.status === 401
            ? 'Incorrect email or password.'
            : 'Sign in failed. Try again.',
        });
        return;
      }

      console.log('Signed in'); // navigate('/dashboard') once the dashboard exists
    } catch {
      setErrors({ form: 'Could not reach the server.' });
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = 'block text-sm font-semibold text-slate-800 mb-1.5';
  const base =
    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2';
  const fieldClass = (name: FieldName) =>
    errors[name]
      ? `${base} border-red-400 focus:border-red-500 focus:ring-red-500/30`
      : `${base} border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30`;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your account"
    >
      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        {errors.form && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
            {errors.form}
          </p>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>Email address</label>
          <input
            id="email" type="email" autoComplete="email" placeholder="john@example.com"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={fieldClass('email')}
          />
          <ErrorText id="email-error" message={errors.email} />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-800">Password</label>
            {/* No reset page yet: this route falls through to /login until one is added. */}
            <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`${fieldClass('password')} pr-11`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600">
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <ErrorText id="password-error" message={errors.password} />
        </div>

        <button type="submit" disabled={submitting}
          className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}