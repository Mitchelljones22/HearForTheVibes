import { USE_MOCKS } from '../config';
import type { Subscription, SubscriptionStatus } from '../types/subscription';

// The only place pages get subscription data from.
//
// Optional local mock data: src/mocks/ is git-ignored, so it only exists on
// machines that have it. It's loaded only when VITE_USE_MOCKS=true AND the file
// exists, so the app still builds for everyone else and calls the real backend.
interface MockApi {
  listSubscriptions(): Promise<Subscription[]>;
  updateStatus(id: number, status: SubscriptionStatus): Promise<Subscription>;
}
const mockFiles = import.meta.glob<MockApi>('../mocks/subscriptions.ts');

async function loadMocks(): Promise<MockApi | null> {
  const load = mockFiles['../mocks/subscriptions.ts'];
  return USE_MOCKS && load ? load() : null;
}
//
// Backend contract (not built yet):
//   GET   /api/subscriptions        -> Subscription[] for the logged-in user
//   PATCH /api/subscriptions/{id}   body { status }  -> updated Subscription

export async function getSubscriptions(): Promise<Subscription[]> {
  const mock = await loadMocks();
  if (mock) return mock.listSubscriptions();

  const res = await fetch('/api/subscriptions');
  if (!res.ok) throw new Error(`Could not load subscriptions (${res.status}).`);
  return res.json();
}

export async function updateSubscriptionStatus(
  id: number,
  status: SubscriptionStatus,
): Promise<Subscription> {
  const mock = await loadMocks();
  if (mock) return mock.updateStatus(id, status);

  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Could not update subscription (${res.status}).`);
  return res.json();
}
