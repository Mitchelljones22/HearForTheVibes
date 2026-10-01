import { useState } from 'react';

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

// Validation rules (pure functions, easy to move to utils/ later

function validateFullName(value: string): string | null {
  if (!value.trim()) return 'Full name is required.';
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Enter a complete email address, like john@example.com.';
  }
  return null;
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'Phone number is required.';
  if (digits.length !== 10) return 'Enter a 10-digit phone number.';
  return null;
}

function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character.';
  return null;
}

// Formats numbers with - 

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

type FieldName = 'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword';

export default function Register() {
  const [values, setValues] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function runValidation(name: FieldName, all = values): string | null {
    switch (name) {
      case 'fullName': return validateFullName(all.fullName);
      case 'email': return validateEmail(all.email);
      case 'phone': return validatePhone(all.phone);
      case 'password': return validatePassword(all.password);
      case 'confirmPassword':
        if (!all.confirmPassword) return 'Please confirm your password.';
        if (all.confirmPassword !== all.password) return 'Passwords do not match.';
        return null;
    }
  }

  function handleChange(name: FieldName, raw: string) {
    const value = name === 'phone' ? formatPhone(raw) : raw;
    const next = { ...values, [name]: value };
    setValues(next);

    // Live feedback only for the password pair; other fields wait for blur.
    if (name === 'password' || name === 'confirmPassword') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: next.confirmPassword
          ? runValidation('confirmPassword', next) ?? undefined
          : undefined,
        ...(touched.password && name === 'password'
          ? { password: runValidation('password', next) ?? undefined }
          : {}),
      }));
    } else if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: runValidation(name, next) ?? undefined }));
    }
  }

  function handleBlur(name: FieldName) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: runValidation(name) ?? undefined }));
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const names: FieldName[] = ['fullName', 'email', 'phone', 'password', 'confirmPassword'];
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const n of names) {
      const err = runValidation(n);
      if (err) nextErrors[n] = err;
    }
    setErrors(nextErrors);
    setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true });

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(names.find((n) => nextErrors[n])!)?.focus();
      return;
    }

    // Send information to backend.
    // Contract: POST /api/auth/register
    //   body   { fullName, email, phone, password }
    //   errors { errors: { fieldName: "message" } }
      const payload = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors(data?.errors ?? { email: 'Registration failed. Try again.' });
        return;
      }

      console.log('Registered'); // navigate('/login') once router is added
    } catch {
      setErrors({ email: 'Could not reach the server.' });
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">

        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Subscription Tracker</span>
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Get started today
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Take control of your software recurring spend
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
          <div>
            <label htmlFor="fullName" className={labelClass}>Full Name</label>
            <input
              id="fullName" type="text" autoComplete="name" placeholder="John Doe"
              value={values.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={fieldClass('fullName')}
            />
            <ErrorText id="fullName-error" message={errors.fullName} />
          </div>



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
            <label htmlFor="phone" className={labelClass}>Phone number</label>
            <input
              id="phone" type="tel" autoComplete="tel" placeholder="(816) 555-0123"
              value={values.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              className={fieldClass('phone')}
            />
            <ErrorText id="phone-error" message={errors.phone} />
          </div>



          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600">
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <ErrorText id="password-error" message={errors.password} />
          </div>



          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
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
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            <ErrorText id="confirmPassword-error" message={errors.confirmPassword} />
          </div>

          <button type="submit"
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}