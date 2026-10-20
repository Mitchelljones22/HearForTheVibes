import type { MonthBucket } from '../../lib/analytics';
import { formatCurrency } from '../../lib/subscriptionStats';

const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' });
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

/** Rounds the axis top up to a clean number, so ticks read 0 / 50 / 100 / 150 / 200. */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
  const step = steps.find((s) => s * 4 >= value) ?? Math.ceil(value / 4 / 1000) * 1000;
  return step * 4;
}

function compact(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 ? 1 : 0)}K` : `$${value}`;
}

// Monthly columns built with plain HTML so there is no chart library to install.
// Each column is focusable and shows a tooltip on hover or keyboard focus; a hidden
// table carries the same numbers for screen readers.
export default function SpendTrendChart({ buckets }: { buckets: MonthBucket[] }) {
  const max = niceMax(Math.max(...buckets.map((b) => b.total)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const peakIndex = buckets.reduce((best, b, i) => (b.total > buckets[best].total ? i : best), 0);

  return (
    <figure className="m-0">
      <div className="flex gap-3">
        {/* Y axis */}
        <div className="relative h-56 w-10 shrink-0 text-right text-xs text-slate-500" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / max) * 100}%`, transform: 'translateY(50%)' }}>
              {compact(t)}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative h-56 flex-1">
          {ticks.map((t) => (
            <div key={t} aria-hidden="true" className="absolute inset-x-0 border-t border-slate-200" style={{ bottom: `${(t / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex">
            {buckets.map((b, i) => {
              const align = i < 2 ? 'left-0' : i > buckets.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2';
              return (
                <div key={b.month.toISOString()} tabIndex={0} role="img"
                     aria-label={`${monthLong.format(b.month)}: ${formatCurrency(b.total)}`}
                     className="group relative flex h-full flex-1 items-end justify-center rounded-md px-0.5 sm:px-1 outline-none hover:bg-slate-100/70 focus-visible:bg-slate-100/70 focus-visible:ring-2 focus-visible:ring-indigo-500">
                  {i === peakIndex && b.total > 0 && (
                    <span className="absolute text-xs font-semibold text-slate-700"
                          style={{ bottom: `calc(${(b.total / max) * 100}% + 4px)` }}>
                      {formatCurrency(b.total)}
                    </span>
                  )}
                  <div className="w-full max-w-6 rounded-t bg-indigo-600 transition-colors group-hover:bg-indigo-700"
                       style={{ height: `${(b.total / max) * 100}%` }} />

                  {/* Tooltip */}
                  <div className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-48 rounded-lg bg-slate-900 p-3 text-xs text-white shadow-lg group-hover:block group-focus-visible:block ${align}`}>
                    <p className="font-semibold">{monthLong.format(b.month)}</p>
                    <p className="mt-0.5 text-slate-300">{formatCurrency(b.total)} in {b.charges.length} charge{b.charges.length === 1 ? '' : 's'}</p>
                    {b.charges.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {b.charges.slice(0, 4).map((c, j) => (
                          <li key={j} className="flex justify-between gap-2">
                            <span className="truncate">{c.serviceName}</span>
                            <span className="tabular-nums">{formatCurrency(c.amount)}</span>
                          </li>
                        ))}
                        {b.charges.length > 4 && <li className="text-slate-400">+{b.charges.length - 4} more</li>}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis */}
      <div className="ml-[3.25rem] mt-2 flex text-xs text-slate-500" aria-hidden="true">
        {buckets.map((b) => (
          <span key={b.month.toISOString()} className="flex-1 text-center">
            {/* One letter on phones so 12 labels fit. */}
            <span className="sm:hidden">{monthShort.format(b.month)[0]}</span>
            <span className="hidden sm:inline">{monthShort.format(b.month)}</span>
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Expected charges per month</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Total</th></tr></thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.month.toISOString()}>
              <th scope="row">{monthLong.format(b.month)}</th>
              <td>{formatCurrency(b.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
