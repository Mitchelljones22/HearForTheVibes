import { useState } from 'react';
import { changePassword, ProfileError, setTwoFactor } from '../../api/profile';
import { daysUntil, formatDate } from '../../lib/dates';
import type { UserProfile } from '../../types/profile';
import { LockIcon } from '../icons';
import ProfileSection from './ProfileSection';
import Toggle from './Toggle';
import {
  errorNote, inputClass, labelClass, primaryButton, secondaryButton, successNote,
} from './formStyles';

// Same password rules as the register page.

function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 1024) return 'Password must be at most 1024 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character.';
  return null;
}

type FieldName = 'currentPassword' | 'newPassword' | 'confirmPassword';
type FormErrors = Partial<Record<FieldName | 'form', string>>;
const fieldNames: FieldName[] = ['currentPassword', 'newPassword', 'confirmPassword'];
const emptyValues: Record<FieldName, string> = { currentPassword: '', newPassword: '', confirmPassword: '' };

function validate(name: FieldName, values: Record<FieldName, string>): string | null {
  switch (name) {
    case 'currentPassword':
      return values.currentPassword ? null : 'Enter your current password.';
    case 'newPassword':
      if (values.newPassword && values.newPassword === values.currentPassword) {
        return 'Choose a password different from your current one.';
      }
      return validatePassword(values.newPassword);
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Please confirm your new password.';
      return values.confirmPassword === values.newPassword ? null : 'Passwords do not match.';
  }
}

function lastChangedText(iso: string): string {
  const days = -daysUntil(iso);
  if (days <= 0) return 'Last changed today';
  if (days === 1) return 'Last changed yesterday';
  if (days < 60) return `Last changed ${days} days ago`;
  return `Last changed ${formatDate(iso)}`;
}

type Props = {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
};

export default function SecuritySection({ profile, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');

  function startEditing() {
    setValues(emptyValues);
    setErrors({});
    setMessage('');
    setEditing(true);
  }

  function handleChange(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    setErrors((prev) => ({
      ...prev,
      form: undefined,
      [name]: prev[name] ? validate(name, next) ?? undefined : undefined,
      // Live match feedback, same as the register page.
      confirmPassword: next.confirmPassword ? validate('confirmPassword', next) ?? undefined : undefined,
    }));
  }

  function handleBlur(name: FieldName) {
    if (!values[name]) return;
    setErrors((prev) => ({ ...prev, [name]: validate(name, values) ?? undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    for (const n of fieldNames) {
      const err = validate(n, values);
      if (err) nextErrors[n] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(fieldNames.find((n) => nextErrors[n])!)?.focus();
      return;
    }

    setSaving(true);
    try {
      onUpdated(await changePassword(values.currentPassword, values.newPassword));
      setEditing(false);
      setValues(emptyValues);
      setMessage('Your password was changed.');
    } catch (err) {
      setErrors(err instanceof ProfileError ? err.errors : { form: 'Your password could not be changed. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTwoFactor(enabled: boolean) {
    setTwoFactorSaving(true);
    setTwoFactorError('');
    try {
      onUpdated(await setTwoFactor(enabled));
    } catch {
      setTwoFactorError('That setting could not be saved. Try again.');
    } finally {
      setTwoFactorSaving(false);
    }
  }

  function field(name: FieldName, label: string, autoComplete: string, hint?: string) {
    return (
      <div>
        <label htmlFor={name} className={labelClass}>{label}</label>
        <input
          id={name} type="password" autoComplete={autoComplete}
          value={values[name]}
          onChange={(e) => handleChange(name, e.target.value)}
          onBlur={() => handleBlur(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={inputClass(!!errors[name])}
        />
        {errors[name] ? (
          <p id={`${name}-error`} role="alert" className="mt-1.5 text-sm text-red-600">{errors[name]}</p>
        ) : hint && (
          <p id={`${name}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
        )}
      </div>
    );
  }

  return (
    <ProfileSection
      id="security"
      title="Password & security"
      description="Keep your account protected."
      icon={<LockIcon className="h-5 w-5" />}
    >
      <div className="rounded-lg ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Password</p>
            <p className="mt-0.5 text-sm text-slate-500">{lastChangedText(profile.passwordLastChanged)}</p>
          </div>
          {!editing && (
            <button type="button" onClick={startEditing} className={secondaryButton}>Change password</button>
          )}
        </div>

        {message && !editing && (
          <p role="status" className={`mx-4 mb-4 ${successNote}`}>{message}</p>
        )}

        {editing && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 border-t border-slate-200 p-4">
            {errors.form && <p role="alert" className={errorNote}>{errors.form}</p>}
            {field('currentPassword', 'Current password', 'current-password')}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('newPassword', 'New password', 'new-password',
                '8+ characters with upper and lowercase letters, a number and a symbol.')}
              {field('confirmPassword', 'Confirm new password', 'new-password')}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(false)} disabled={saving} className={secondaryButton}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-4 rounded-lg px-4 ring-1 ring-slate-200">
        <Toggle
          id="two-factor"
          label="Two-factor authentication"
          description="Ask for a code from your phone when you sign in on a new device."
          checked={profile.twoFactorEnabled}
          disabled={twoFactorSaving}
          onChange={handleTwoFactor}
        />
      </div>
      {twoFactorError && <p role="alert" className={`mt-3 ${errorNote}`}>{twoFactorError}</p>}
    </ProfileSection>
  );
}
