import { useState } from 'react';
import * as React from "react";
import { Link, useNavigate } from 'react-router-dom';
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

// Keep these rules aligned with RegisterRequest on the backend.

function validateName(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
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
  if (value.length > 1024) return 'Password must be at most 1024 characters.';
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

type FieldName = 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirmPassword';
const fieldNames: FieldName[] = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'];
const emptyValues = {
  firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
};

function readServerErrors(data: unknown): Partial<Record<FieldName | 'form', string>> {
  if (!data || typeof data !== 'object' || !('errors' in data)) return {};
  const incoming = data.errors;
  if (!incoming || typeof incoming !== 'object') return {};
  const errors: Partial<Record<FieldName | 'form', string>> = {};
  for (const name of [...fieldNames, 'form'] as const) {
    if (name in incoming) {
      const message = incoming[name as keyof typeof incoming];
      if (typeof message === 'string') errors[name] = message;
    }
  }
  return errors;
}

export default function Register() {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  function runValidation(name: FieldName, all = values): string | null {
    switch (name) {
      case 'firstName': return validateName(all.firstName, 'First name');
      case 'lastName': return validateName(all.lastName, 'Last name');
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
    setRegistered(false);
    setFormError('');
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
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');
    setRegistered(false);
    const names = fieldNames;
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const n of names) {
      const err = runValidation(n);
      if (err) nextErrors[n] = err;
    }
    setErrors(nextErrors);
    setTouched({ firstName: true, lastName: true, email: true, phone: true, password: true, confirmPassword: true });

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(names.find((n) => nextErrors[n])!)?.focus();
      return;
    }

    // Send information to backend.
    // Contract: POST /api/auth/register
    //   body   { firstName, lastName, email, phone, password }
    //   errors { errors: { fieldName: "message" } }
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.replace(/\D/g, ''),
      password: values.password,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const { form, ...fieldErrors } = readServerErrors(data);
        setErrors(fieldErrors);
        setFormError(form ?? (Object.keys(fieldErrors).length ? '' : 'Registration failed. Try again.'));
        const firstError = names.find((name) => fieldErrors[name]);
        // Wait until the disabled fields have been enabled again before focusing.
        if (firstError) requestAnimationFrame(() => document.getElementById(firstError)?.focus());
        return;
      }

      setRegistered(true);
      setValues(emptyValues);
      setTouched({});
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
      navigate('/login');
    } catch {
      setFormError('Could not reach the server. Try again.');
    } finally {
      setIsSubmitting(false);
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
      title="Get started today"
      subtitle="Take control of your software recurring spend"
    >
        {registered && (
          <p role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Account created successfully.
          </p>
        )}
        {formError && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-7" aria-busy={isSubmitting}>
          <fieldset disabled={isSubmitting} className="space-y-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>First name</label>
            <input
              id="firstName" type="text" autoComplete="given-name" placeholder="John"
              value={values.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              className={fieldClass('firstName')}
            />
            <ErrorText id="firstName-error" message={errors.firstName} />
          </div>

          <div>
            <label htmlFor="lastName" className={labelClass}>Last name</label>
            <input
              id="lastName" type="text" autoComplete="family-name" placeholder="Doe"
              value={values.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              className={fieldClass('lastName')}
            />
            <ErrorText id="lastName-error" message={errors.lastName} />
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
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
          </fieldset>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
            Sign in
          </Link>
        </p>
    </AuthLayout>
  );
}
