import type { CategorySpend } from '../../lib/analytics';
import { categories } from '../../lib/categories';
import { formatCurrency } from '../../lib/subscriptionStats';

// Left: one labelled bar per category (bar length = share of monthly spend).
// Right: the services in each category and the yearly cost.
export default function CategoryBreakdown({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No active subscriptions yet.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ul className="space-y-4">
        {data.map((c) => (
          <li key={c.category}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-slate-900">{categories[c.category].label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-slate-900">{formatCurrency(c.monthly)}</span>
                <span className="text-slate-500">/mo · {Math.round(c.share * 100)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-2 rounded-full"
                   style={{ width: `${Math.max(c.share * 100, 1)}%`, backgroundColor: categories[c.category].color }} />
            </div>
          </li>
        ))}
      </ul>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th scope="col" className="pb-2 pr-4">Category</th>
            <th scope="col" className="pb-2 pr-4">Services</th>
            <th scope="col" className="pb-2 text-right">Per year</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((c) => (
            <tr key={c.category}>
              <th scope="row" className="py-2.5 pr-4 font-medium text-slate-900">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categories[c.category].color }} aria-hidden="true" />
                  {categories[c.category].label}
                </span>
              </th>
              <td className="py-2.5 pr-4 text-slate-600">{c.services.join(', ')}</td>
              <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">{formatCurrency(c.monthly * 12)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
