import { daysFromToday } from '../lib/dates';
import type { CurrentUser } from '../types/subscription';
import type { NotificationPreferences, PersonalInfo, UserProfile } from '../types/profile';

// The only place the profile page gets or saves account data.
//
// PLACEHOLDER: the backend endpoints don't exist yet, so every function below
// works on an in-memory copy of sample data (edits last until the page is
// reloaded). To hook up the backend, replace each function body with the
// fetch shown in its comment; the page doesn't need to change.
//
// Backend contract (not built yet):
//   GET    /api/profile                 -> UserProfile for the logged-in user
//   PUT    /api/profile                 body PersonalInfo -> updated UserProfile
//                                       400/409 { errors: { fieldName: "message" } }
//   POST   /api/profile/password        body { currentPassword, newPassword } -> 204
//                                       400 { errors: { currentPassword: "..." } }
//   PUT    /api/profile/notifications   body NotificationPreferences -> updated UserProfile
//   PUT    /api/profile/two-factor      body { enabled } -> updated UserProfile
//   DELETE /api/profile                 -> 204, ends the session

/** Thrown when the backend rejects a form, with a message per field. */
export class ProfileError extends Error {
  readonly errors: Record<string, string>;
  constructor(errors: Record<string, string>) {
    super(Object.values(errors)[0] ?? 'Request failed.');
    this.errors = errors;
  }
}

let placeholder: UserProfile | null = null;

// Sample data built around whoever is logged in, so the name and email match the header.
function sampleProfile(user: CurrentUser): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: '5551234567',
    memberSince: '2025-03-14',
    passwordLastChanged: daysFromToday(-42),
    twoFactorEnabled: false,
    notifications: {
      renewalReminders: true,
      reminderDaysBefore: 3,
      weeklySummary: true,
      priceChangeAlerts: true,
      unusualCharges: false,
    },
    paymentMethods: [
      { id: 1, brand: 'Visa', last4: '4242', expires: '08/28', isDefault: true },
      { id: 2, brand: 'Mastercard', last4: '5100', expires: '02/27', isDefault: false },
    ],
  };
}

// Short pause so loading and saving states are visible, like a real request.
const pause = () => new Promise((resolve) => setTimeout(resolve, 400));

function current(): UserProfile {
  if (!placeholder) throw new Error('Profile not loaded.');
  return placeholder;
}

// Backend: drop the `user` argument and use
//   const res = await fetch('/api/profile');
//   if (!res.ok) throw new Error(`Could not load your profile (${res.status}).`);
//   return res.json();
export async function getProfile(user: CurrentUser): Promise<UserProfile> {
  await pause();
  placeholder ??= sampleProfile(user);
  return placeholder;
}

// Backend: PUT /api/profile with the info as JSON; on 400/409 read
// `{ errors }` from the body and throw new ProfileError(errors).
export async function updatePersonalInfo(info: PersonalInfo): Promise<UserProfile> {
  await pause();
  placeholder = { ...current(), ...info };
  return placeholder;
}

// Backend: POST /api/profile/password; on 400 throw new ProfileError(errors).
export async function changePassword(currentPassword: string, newPassword: string): Promise<UserProfile> {
  await pause();
  void currentPassword; // unused until the backend checks it
  void newPassword;
  placeholder = { ...current(), passwordLastChanged: daysFromToday(0) };
  return placeholder;
}

// Backend: PUT /api/profile/notifications with the preferences as JSON.
export async function updateNotifications(notifications: NotificationPreferences): Promise<UserProfile> {
  await pause();
  placeholder = { ...current(), notifications };
  return placeholder;
}

// Backend: PUT /api/profile/two-factor with { enabled }.
export async function setTwoFactor(enabled: boolean): Promise<UserProfile> {
  await pause();
  placeholder = { ...current(), twoFactorEnabled: enabled };
  return placeholder;
}
