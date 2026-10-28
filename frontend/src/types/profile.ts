// Shapes for the profile page. The backend's /api/profile responses should
// match these, so the placeholder data in api/profile.ts can be swapped out
// without touching the page.

export interface NotificationPreferences {
  /** Email before a subscription renews. */
  renewalReminders: boolean;
  /** How many days before a renewal the reminder goes out. */
  reminderDaysBefore: 1 | 3 | 7;
  /** Weekly email summarizing spend. */
  weeklySummary: boolean;
  /** Alert when a subscription's price goes up. */
  priceChangeAlerts: boolean;
  /** Alert on a charge that doesn't match a tracked subscription. */
  unusualCharges: boolean;
}

export interface PaymentMethod {
  id: number;
  brand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
  last4: string;
  /** "MM/YY" */
  expires: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  /** 10 digits, no formatting. */
  phone: string;
  /** ISO date (YYYY-MM-DD). */
  memberSince: string;
  /** ISO date (YYYY-MM-DD). */
  passwordLastChanged: string;
  twoFactorEnabled: boolean;
  notifications: NotificationPreferences;
  paymentMethods: PaymentMethod[];
}

/** The fields the "Personal information" form can change. */
export type PersonalInfo = Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone'>;
