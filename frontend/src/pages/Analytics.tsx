import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSubscriptions } from '../api/subscriptions';
import StatCard from '../components/dashboard/StatCard';
import SpendTrendChart from '../components/analytics/SpendTrendChart';
import CategoryBreakdown from '../components/analytics/CategoryBreakdown';
import { CalendarIcon, PiggyIcon, TrendUpIcon, WalletIcon } from '../components/icons';
import { biggestExpense, dueWithin, monthlySavings, spendByCategory, upcomingByMonth } from '../lib/analytics';
import { computeStats, formatCurrency, monthlyCost } from '../lib/subscriptionStats';
import type { Subscription } from '../types/subscription';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; subscriptions: Subscription[] };

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function Analytics() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    getSubscriptions()
      .then((subscriptions) => { if (!ignore) setState({ status: 'ready', subscriptions }); })
      .catch((err: unknown) => {
        if (!ignore) setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
      });
    return () => { ignore = true; };
  }, []);

  const data = useMemo(() => {
    if (state.status !== 'ready') return null;
    const subs = state.subscriptions;
    return {
      stats: computeStats(subs),
      due30: dueWithin(subs, 30),
      biggest: biggestExpense(subs),
      savings: monthlySavings(subs),
      months: upcomingByMonth(subs),
      categories: spendByCategory(subs),
    };
  }, [state]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics &amp; Spend</h1>
        <p className="mt-1 text-sm text-slate-500">Where your money goes and what is coming up.</p>
      </div>

      {state.status === 'loading' && (
        <p role="status" className="mt-10 text-sm text-slate-500">Loading your subscriptions…</p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="mt-8 rounded-xl bg-rose-50 p-5 text-sm text-rose-800 ring-1 ring-rose-200">
          {state.message}
        </p>
      )}

      {data && (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Yearly cost"
              icon={<WalletIcon className="h-5 w-5" />}
              value={formatCurrency(data.stats.yearlySpend)}
              detail={`${formatCurrency(data.stats.monthlySpend)} per month`}
            />
            <StatCard
              label="Due in the next 30 days"
              icon={<CalendarIcon className="h-5 w-5" />}
              value={formatCurrency(data.due30.total)}
              detail={`${data.due30.count} charge${data.due30.count === 1 ? '' : 's'}`}
            />
            <StatCard
              label="Biggest expense"
              icon={<TrendUpIcon className="h-5 w-5" />}
              value={data.biggest ? `${formatCurrency(monthlyCost(data.biggest))}/mo` : 'None'}
              detail={data.biggest
                ? `${data.biggest.serviceName}${data.biggest.billingCycle === 'yearly' ? ` (${formatCurrency(data.biggest.cost)}/yr)` : ''}`
                : 'No active subscriptions'}
            />
            <StatCard
              label="Monthly savings"
              icon={<PiggyIcon className="h-5 w-5" />}
              value={`${formatCurrency(data.savings.total)}/mo`}
              detail={`${data.savings.count} paused or cancelled`}
            />
          </div>

          <div className="mt-6">
            <Panel title="Upcoming spend" subtitle="Expected charges for the next 12 months, based on renewal dates. Hover a month for details.">
              <SpendTrendChart buckets={data.months} />
            </Panel>
          </div>

          <div className="mt-6">
            <Panel title="Spend by category" subtitle="Monthly cost of active subscriptions (yearly plans divided by 12).">
              <CategoryBreakdown data={data.categories} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
