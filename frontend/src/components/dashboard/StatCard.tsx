import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: ReactNode;
};

export default function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-slate-600">{label}</h2>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {detail && <p className="mt-1.5 text-sm text-slate-500">{detail}</p>}
    </section>
  );
}
