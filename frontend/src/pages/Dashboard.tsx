import { useEffect, useMemo, useState } from 'react';
import { getSubscriptions, updateSubscriptionStatus } from '../api/subscriptions';
import { ClockIcon, LayersIcon, WalletIcon } from '../components/icons';
import StatCard from '../components/dashboard/StatCard';
import SubscriptionTable from '../components/dashboard/SubscriptionTable';
import { daysUntil, formatShortDate } from '../lib/dates';
import { computeStats, formatCurrency } from '../lib/subscriptionStats';
import type { Subscription, SubscriptionStatus } from '../types/subscription';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; subscriptions: Subscription[] };

function renewalDetail(sub: Subscription): string {
  const days = daysUntil(sub.nextRenewalDate);
  const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  return `${sub.serviceName}, ${formatCurrency(sub.cost)} ${when}`;
}

export default function Dashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getSubscriptions()
      .then((subscriptions) => { if (!ignore) setState({ status: 'ready', subscriptions }); })
      .catch((err: unknown) => {
        if (!ignore) setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
      });
    return () => { ignore = true; };
  }, [reloadKey]);

  const stats = useMemo(
    () => (state.status === 'ready' ? computeStats(state.subscriptions) : null),
    [state],
  );

  async function handleChangeStatus(id: number, status: SubscriptionStatus) {
    setPendingId(id);
    setActionError('');
    try {
      const updated = await updateSubscriptionStatus(id, status);
      setState((prev) => prev.status === 'ready'
        ? { ...prev, subscriptions: prev.subscriptions.map((s) => (s.id === id ? updated : s)) }
        : prev);
    } catch {
      setActionError('That change could not be saved. Try again.');
    } finally {
      setPendingId(null);
    }
  }

  function retry() {
    setState({ status: 'loading' });
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your current subscription spend and upcoming renewals.</p>
      </div>

      {state.status === 'loading' && (
        <p role="status" className="mt-10 text-sm text-slate-500">Loading your subscriptions…</p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="mt-8 rounded-xl bg-rose-50 p-5 text-sm text-rose-800 ring-1 ring-rose-200">
          <p>{state.message}</p>
          <button type="button" onClick={retry}
                  className="mt-3 rounded-lg bg-white px-3 py-1.5 font-semibold text-rose-800 ring-1 ring-rose-300 hover:bg-rose-100">
            Try again
          </button>
        </div>
      )}

      {state.status === 'ready' && stats && (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <StatCard
              label="Monthly spend"
              icon={<WalletIcon className="h-5 w-5" />}
              value={formatCurrency(stats.monthlySpend)}
              detail={`${formatCurrency(stats.yearlySpend)} per year`}
            />
            <StatCard
              label="Active subscriptions"
              icon={<LayersIcon className="h-5 w-5" />}
              value={stats.activeCount}
              detail={`${stats.pausedCount} paused, ${stats.cancelledCount} cancelled`}
            />
            <StatCard
              label="Next renewal"
              icon={<ClockIcon className="h-5 w-5" />}
              value={stats.nextRenewal ? formatShortDate(stats.nextRenewal.nextRenewalDate) : 'None'}
              detail={stats.nextRenewal ? renewalDetail(stats.nextRenewal) : 'No active subscriptions'}
            />
          </div>

          {actionError && (
            <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
              {actionError}
            </p>
          )}

          <div className="mt-6">
            <SubscriptionTable
              subscriptions={state.subscriptions}
              pendingId={pendingId}
              onChangeStatus={handleChangeStatus}
            />
          </div>
        </>
      )}
    </div>
  );
}
