import { useId, useMemo, useState } from 'react';
import type { Subscription, SubscriptionStatus } from '../../types/subscription';
import { daysUntil, formatDate } from '../../lib/dates';
import { formatCurrency } from '../../lib/subscriptionStats';
import { SearchIcon } from '../icons';
import StatusBadge from './StatusBadge';

type StatusFilter = 'all' | SubscriptionStatus;

type SubscriptionTableProps = {
  subscriptions: Subscription[];
  /** Id of the row with a status change in flight, so its buttons can be disabled. */
  pendingId: number | null;
  onChangeStatus: (id: number, status: SubscriptionStatus) => void;
};

// Full class strings so Tailwind keeps them in the build.
const avatarColors = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600',
  'bg-sky-600', 'bg-violet-600', 'bg-teal-600', 'bg-slate-700',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return avatarColors[hash % avatarColors.length];
}

const statusOrder: Record<SubscriptionStatus, number> = { active: 0, paused: 1, cancelled: 2 };

function sortForDisplay(subs: Subscription[]): Subscription[] {
  return [...subs].sort((a, b) =>
    statusOrder[a.status] - statusOrder[b.status]
    || a.nextRenewalDate.localeCompare(b.nextRenewalDate));
}

const actionClass =
  'rounded-md px-2 py-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600';

function RenewalCell({ sub }: { sub: Subscription }) {
  if (sub.status !== 'active') {
    return (
      <>
        <span aria-hidden="true" className="text-slate-400">—</span>
        <span className="sr-only">No upcoming charge</span>
      </>
    );
  }
  const days = daysUntil(sub.nextRenewalDate);
  return (
    <>
      <span className="text-slate-700">{formatDate(sub.nextRenewalDate)}</span>
      {days >= 0 && days <= 7 && (
        <span className="block text-xs font-medium text-amber-700">
          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
        </span>
      )}
    </>
  );
}

export default function SubscriptionTable({ subscriptions, pendingId, onChangeStatus }: SubscriptionTableProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmingCancelId, setConfirmingCancelId] = useState<number | null>(null);
  const searchId = useId();
  const filterId = useId();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortForDisplay(subscriptions).filter((s) =>
      (statusFilter === 'all' || s.status === statusFilter)
      && (!q || s.serviceName.toLowerCase().includes(q) || s.planTier.toLowerCase().includes(q)));
  }, [subscriptions, query, statusFilter]);

  function change(id: number, status: SubscriptionStatus) {
    setConfirmingCancelId(null);
    onChangeStatus(id, status);
  }

  function renderActions(sub: Subscription) {
    const busy = pendingId === sub.id;

    if (confirmingCancelId === sub.id) {
      return (
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1 text-sm text-slate-600">Cancel {sub.serviceName}?</span>
          <button type="button" disabled={busy} onClick={() => change(sub.id, 'cancelled')}
                  className={`${actionClass} bg-rose-600 text-white hover:bg-rose-700`}>
            Yes, cancel
          </button>
          <button type="button" onClick={() => setConfirmingCancelId(null)}
                  className={`${actionClass} text-slate-600 hover:bg-slate-100`}>
            Keep
          </button>
        </div>
      );
    }

    const cancelButton = (
      <button type="button" disabled={busy} onClick={() => setConfirmingCancelId(sub.id)}
              aria-label={`Cancel ${sub.serviceName}`}
              className={`${actionClass} text-rose-700 hover:bg-rose-50`}>
        Cancel
      </button>
    );

    return (
      <div className="flex items-center justify-end gap-1">
        {sub.status === 'active' && (
          <>
            <button type="button" disabled={busy} onClick={() => change(sub.id, 'paused')}
                    aria-label={`Pause ${sub.serviceName}`}
                    className={`${actionClass} text-indigo-700 hover:bg-indigo-50`}>
              Pause
            </button>
            {cancelButton}
          </>
        )}
        {sub.status === 'paused' && (
          <>
            <button type="button" disabled={busy} onClick={() => change(sub.id, 'active')}
                    aria-label={`Resume ${sub.serviceName}`}
                    className={`${actionClass} text-indigo-700 hover:bg-indigo-50`}>
              Resume
            </button>
            {cancelButton}
          </>
        )}
        {sub.status === 'cancelled' && (
          <button type="button" disabled={busy} onClick={() => change(sub.id, 'active')}
                  aria-label={`Reactivate ${sub.serviceName}`}
                  className={`${actionClass} text-indigo-700 hover:bg-indigo-50`}>
            Reactivate
          </button>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="catalog-heading" className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="catalog-heading" className="text-base font-semibold text-slate-900">Your subscriptions</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">Search subscriptions</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id={searchId} type="search" value={query} placeholder="Search services…"
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
            />
          </div>
          <label htmlFor={filterId} className="sr-only">Filter by status</label>
          <select
            id={filterId} value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-5 py-3">Service</th>
              <th scope="col" className="px-5 py-3">Plan</th>
              <th scope="col" className="px-5 py-3">Next renewal</th>
              <th scope="col" className="px-5 py-3">Cost</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/60">
                <th scope="row" className="px-5 py-3.5 font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${avatarColor(sub.serviceName)}`}>
                      {sub.serviceName[0]}
                    </span>
                    {sub.serviceName}
                  </div>
                </th>
                <td className="px-5 py-3.5 text-slate-600">{sub.planTier}</td>
                <td className="px-5 py-3.5"><RenewalCell sub={sub} /></td>
                <td className="px-5 py-3.5 font-semibold text-slate-900">
                  {formatCurrency(sub.cost)}
                  <span className="font-normal text-slate-500">{sub.billingCycle === 'yearly' ? ' /yr' : ' /mo'}</span>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={sub.status} /></td>
                <td className="px-5 py-3.5">{renderActions(sub)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {subscriptions.length === 0
              ? 'No subscriptions yet.'
              : 'No subscriptions match your search.'}
          </p>
        )}
      </div>
    </section>
  );
}
