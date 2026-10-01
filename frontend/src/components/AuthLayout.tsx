import type { ReactNode } from 'react';

const APP_NAME = 'Subscription Tracker';

function LogoMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}

const highlights = [
  {
    title: 'Organize every plan',
    body: 'Keep billing, renewals, and access in one place.',
    icon: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
  },
  {
    title: 'Stay on top of renewals',
    body: 'See upcoming charges and changes before they happen.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
];

// Left half of the split layout. Presentational only: no state, no form logic.
function BrandPanel() {
  return (
    <aside className="hidden md:flex md:w-1/2 flex-col bg-gradient-to-br from-indigo-600 via-indigo-800 to-indigo-950 px-8 py-14 lg:px-14 xl:px-20 text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
        <LogoMark className="h-5 w-5" />
      </div>

      <div className="mt-6 max-w-md">
        <p className="text-4xl font-bold tracking-tight">{APP_NAME}</p>
        <p className="mt-3 text-lg leading-relaxed text-indigo-100">
          Every subscription you pay for, in one place, with a heads-up before each renewal.
        </p>

        <ul className="mt-8 space-y-3">
          {highlights.map((h) => (
            <li key={h.title}
                className="flex items-center gap-3.5 rounded-xl bg-white/10 px-4 py-3.5 ring-1 ring-white/15">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                     strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  {h.icon}
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold">{h.title}</span>
                <span className="block text-sm text-indigo-200">{h.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-indigo-200">
          Built for a clearer view of recurring spend without extra clutter.
        </p>
      </div>
    </aside>
  );
}

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

// Shared shell for the login and register pages: brand panel on the left,
// white card on the right. Pages pass their form (and footer link) as children.
export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen md:flex">
      <BrandPanel />

      <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-100 px-4 py-10 md:w-1/2">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LogoMark className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">{APP_NAME}</span>
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1.5 text-center text-sm text-slate-500">{subtitle}</p>

          {children}
        </div>
      </main>
    </div>
  );
}