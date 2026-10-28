import type { ReactNode } from 'react';

type ProfileSectionProps = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  /** Button(s) shown on the right of the heading, like "Edit". */
  action?: ReactNode;
  /** Red styling for the delete-account card. */
  danger?: boolean;
  children: ReactNode;
};

// White card with an icon, heading and description, used for each profile section.
export default function ProfileSection({ id, title, description, icon, action, danger = false, children }: ProfileSectionProps) {
  return (
    <section aria-labelledby={`${id}-title`}
             className={`rounded-xl bg-white p-6 shadow-sm ring-1 ${danger ? 'ring-rose-200' : 'ring-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
          }`}>
            {icon}
          </span>
          <div>
            <h2 id={`${id}-title`} className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
