import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

// Same email rules as the login and register pages.

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Enter a complete email address, like john@example.com.';
  }
  return null;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(value: string) {
    setEmail(value);
    setFormError(null);
    if (touched) {
      setError(validateEmail(value));
    }
  }

  function handleBlur() {
    setTouched(true);
    setError(validateEmail(email));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err = validateEmail(email);
    setTouched(true);
    setError(err);

    if (err) {
      document.getElementById('email')?.focus();
      return;
    }

    // Send request to backend.
    // Contract: POST /api/auth/forgot-password
    //   body   { email }
    //   200    always returned for a well-formed request, whether or not the
    //          email is registered (the UI must never reveal which)
    //   429    too many reset requests (rate limited)
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setFormError('Too many reset requests. Please wait a few minutes and try again.');
        return;
      }

      if (!res.ok) {
        setFormError('Something went wrong. Please try again.');
        return;
      }

      setSent(true);
    } catch {
      setFormError('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleTryAgain() {
    setSent(false);
    setEmail('');
    setError(null);
    setTouched(false);
    setFormError(null);
  }

  const labelClass = 'block text-sm font-semibold text-slate-800 mb-1.5';
  const base =
    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2';

  function emailFieldClass(): string {
    if (error) {
      return `${base} border-red-400 focus:border-red-500 focus:ring-red-500/30`;
    }
    return `${base} border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30`;
  }

  const backToSignIn = (
    <p className="mt-6 text-center text-sm text-slate-500">
      Remembered your password?{' '}
      <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
        Back to sign in
      </Link>
    </p>
  );

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="Password reset instructions are on their way"
      >
        <div className="mt-7 space-y-4">
          <p role="status" className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
            If an account is associated with <span className="font-semibold">{email}</span>,
            you will receive an email with instructions to reset your password shortly.
            The link will expire after a limited time.
          </p>

          <p className="text-sm text-slate-500">
            Didn't receive anything? Check your spam folder, or{' '}
            <button type="button" onClick={handleTryAgain}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              try a different email address
            </button>
            .
          </p>

          <Link to="/login"
            className="mt-2 block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you instructions to reset it"
    >
      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>Email address</label>
          <input
            id="email" type="email" autoComplete="email" placeholder="john@example.com"
            value={email}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
            className={emailFieldClass()}
          />
          <ErrorText id="email-error" message={error ?? undefined} />
        </div>

        <button type="submit" disabled={submitting}
          className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60">
          {submitting && 'Sending…'}
          {!submitting && 'Submit'}
        </button>
      </form>

      {backToSignIn}
    </AuthLayout>
  );
}
