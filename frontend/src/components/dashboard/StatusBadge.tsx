import type { SubscriptionStatus } from '../../types/subscription';

const styles: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  paused: { label: 'Paused', className: 'bg-amber-50 text-amber-800 ring-amber-600/25' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
};

export default function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const { label, className } = styles[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}
