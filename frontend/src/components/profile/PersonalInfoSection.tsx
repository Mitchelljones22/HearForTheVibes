import { useState } from 'react';
import { ProfileError, updatePersonalInfo } from '../../api/profile';
import { formatPhone } from '../../lib/phone';
import type { PersonalInfo, UserProfile } from '../../types/profile';
import { UserIcon } from '../icons';
import ProfileSection from './ProfileSection';
import {
  errorNote, inputClass, labelClass, primaryButton, secondaryButton, successNote,
} from './formStyles';

// Same name, email and phone rules as the register page.

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

type FieldName = keyof PersonalInfo;
type FormErrors = Partial<Record<FieldName | 'form', string>>;
const fieldNames: FieldName[] = ['firstName', 'lastName', 'email', 'phone'];

function validate(name: FieldName, values: PersonalInfo): string | null {
  switch (name) {
    case 'firstName': return validateName(values.firstName, 'First name');
    case 'lastName': return validateName(values.lastName, 'Last name');
    case 'email': return validateEmail(values.email);
    case 'phone': return validatePhone(values.phone);
  }
}

function toForm(profile: UserProfile): PersonalInfo {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: formatPhone(profile.phone),
  };
}

type Props = {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
};

export default function PersonalInfoSection({ profile, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<PersonalInfo>(() => toForm(profile));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function startEditing() {
    setValues(toForm(profile));
    setErrors({});
    setSaved(false);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setErrors({});
  }

  function handleChange(name: FieldName, value: string) {
    const next = { ...values, [name]: name === 'phone' ? formatPhone(value) : value };
    setValues(next);
    // Only re-check a field that's already showing an error.
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, form: undefined, [name]: validate(name, next) ?? undefined }));
    }
  }

  function handleBlur(name: FieldName) {
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
      document.getElementById(`profile-${fieldNames.find((n) => nextErrors[n])}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePersonalInfo({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.replace(/\D/g, ''),
      });
      onUpdated(updated);
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setErrors(err instanceof ProfileError ? err.errors : { form: 'Your changes could not be saved. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  const editButton = !editing && (
    <button type="button" onClick={startEditing} className={secondaryButton}>Edit</button>
  );

  function field(name: FieldName, label: string, type: string, autoComplete: string) {
    const id = `profile-${name}`;
    return (
      <div>
        <label htmlFor={id} className={labelClass}>{label}</label>
        <input
          id={id} type={type} autoComplete={autoComplete}
          value={values[name]}
          onChange={(e) => handleChange(name, e.target.value)}
          onBlur={() => handleBlur(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${id}-error` : undefined}
          className={inputClass(!!errors[name])}
        />
        {errors[name] && (
          <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">{errors[name]}</p>
        )}
      </div>
    );
  }

  return (
    <ProfileSection
      id="personal"
      title="Personal information"
      description="Your name and how we contact you."
      icon={<UserIcon className="h-5 w-5" />}
      action={editButton}
    >
      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.form && <p role="alert" className={errorNote}>{errors.form}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('firstName', 'First name', 'text', 'given-name')}
            {field('lastName', 'Last name', 'text', 'family-name')}
            {field('email', 'Email address', 'email', 'email')}
            {field('phone', 'Phone number', 'tel', 'tel')}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={cancel} disabled={saving} className={secondaryButton}>Cancel</button>
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {saved && <p role="status" className={`mb-4 ${successNote}`}>Your information was updated.</p>}
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoRow label="First name" value={profile.firstName} />
            <InfoRow label="Last name" value={profile.lastName} />
            <InfoRow label="Email address" value={profile.email} />
            <InfoRow label="Phone number" value={formatPhone(profile.phone)} />
          </dl>
        </>
      )}
    </ProfileSection>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
