import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

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

// Same password rules as the register page.

function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character.';
  return null;
}

type FieldName = 'password' | 'confirmPassword';
type FormErrors = Partial<Record<FieldName | 'form', string>>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [done, setDone] = useState(false);

  function runValidation(name: FieldName, all = values): string | null {
    if (name === 'password') {
      return validatePassword(all.password);
    }
    if (!all.confirmPassword) return 'Please confirm your password.';
    if (all.confirmPassword !== all.password) return 'Passwords do not match.';
    return null;
  }

  function handleChange(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);

    // Live feedback for the password pair, same as the register page.
    setErrors((prev) => ({
      ...prev,
      form: undefined,
      confirmPassword: next.confirmPassword
        ? runValidation('confirmPassword', next) ?? undefined
        : undefined,
      ...(touched.password && name === 'password'
        ? { password: runValidation('password', next) ?? undefined }
        : {}),
    }));
  }

  function handleBlur(name: FieldName) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: runValidation(name) ?? undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const names: FieldName[] = ['password', 'confirmPassword'];
    const nextErrors: FormErrors = {};
    for (const n of names) {
      const err = runValidation(n);
      if (err) nextErrors[n] = err;
    }
    setErrors(nextErrors);
    setTouched({ password: true, confirmPassword: true });

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(names.find((n) => nextErrors[n])!)?.focus();
      return;
    }

    // Send new password to backend.
    // Contract: POST /api/auth/reset-password
    //   body   { token, password }
    //   400    token expired, invalid, or already used
    //   errors { errors: { fieldName: "message" } }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (res.status === 400) {
        setTokenInvalid(true);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors(data?.errors ?? { form: 'Password reset failed. Try again.' });
        return;
      }

      setDone(true);
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

  function fieldClass(name: FieldName): string {
    if (errors[name]) {
      return `${base} border-red-400 focus:border-red-500 focus:ring-red-500/30`;
    }
    return `${base} border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30`;
  }

  function toggleLabel(visible: boolean): string {
    if (visible) return 'Hide password';
    return 'Show password';
  }

  function inputType(visible: boolean): string {
    if (visible) return 'text';
    return 'password';
  }

  // Missing token in the URL, or the backend rejected it.
  if (!token || tokenInvalid) {
    return (
      <AuthLayout
        title="Link expired or invalid"
        subtitle="This password reset link can no longer be used"
      >
        <div className="mt-7 space-y-4">
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
            This reset link is invalid, has expired, or has already been used.
            Request a new link to continue.
          </p>

          <Link to="/forgot-password"
            className="mt-2 block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Request a new link
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title="Password reset"
        subtitle="Your password has been updated"
      >
        <div className="mt-7 space-y-4">
          <p role="status" className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>

          <Link to="/login"
            className="mt-2 block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create a new password"
      subtitle="Choose a strong password for your account"
    >
      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        {errors.form && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
            {errors.form}
          </p>
        )}

        <div>
          <label htmlFor="password" className={labelClass}>New password</label>
          <div className="relative">
            <input
              id="password"
              type={inputType(showPassword)}
              autoComplete="new-password"
              placeholder="Create robust password"
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`${fieldClass('password')} pr-11`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              aria-label={toggleLabel(showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600">
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <ErrorText id="password-error" message={errors.password} />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={inputType(showConfirm)}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              className={`${fieldClass('confirmPassword')} pr-11`}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              aria-label={toggleLabel(showConfirm)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600">
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          <ErrorText id="confirmPassword-error" message={errors.confirmPassword} />
        </div>

        <button type="submit" disabled={submitting}
          className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60">
          {submitting && 'Resetting…'}
          {!submitting && 'Reset password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
