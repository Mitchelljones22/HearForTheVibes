// Shared shapes for subscription data.
// The backend's /api/subscriptions responses should match these exactly, so the
// mock data and the real API are interchangeable.

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionCategory =
  | 'developer'
  | 'design'
  | 'cloud'
  | 'productivity'
  | 'entertainment'
  | 'communication';

export interface Subscription {
  id: number;
  serviceName: string;
  planTier: string;
  category: SubscriptionCategory;
  /** Price charged each billing cycle, in US dollars. */
  cost: number;
  billingCycle: BillingCycle;
  /** Next charge date as an ISO date string (YYYY-MM-DD), no time zone. */
  nextRenewalDate: string;
  status: SubscriptionStatus;
}

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
