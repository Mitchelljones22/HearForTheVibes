import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { APP_NAME } from '../config';
import AssistantWidget from '../components/AssistantWidget';
import { ChartIcon, GridIcon, LogoIcon, PlusIcon, SettingsIcon } from '../components/icons';
import type { CurrentUser } from '../types/subscription';

// Shell for every signed-in page: sidebar on the left, user in the top right,
// page content in <Outlet />, AI assistant button in the bottom right.
// Add pages by adding a nested route in App.tsx and an entry here.
const navItems: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/dashboard', label: 'Overview', icon: <GridIcon className="h-5 w-5" /> },
  { to: '/analytics', label: 'Analytics & Spend', icon: <ChartIcon className="h-5 w-5" /> },
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <LogoIcon className="h-4.5 w-4.5" />
      </div>
      <span className="whitespace-nowrap text-base font-bold tracking-tight text-slate-900">{APP_NAME}</span>
    </div>
  );
}

function UserBadge({ user }: { user: CurrentUser }) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
           aria-hidden="true">
        {initials}
      </div>
    </div>
  );
}

function SignOutButton({ className = '' }: { className?: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 ${focusRing} ${className}`}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${focusRing} ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;
}

const soonPill = (
  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Soon</span>
);

export default function AppLayout() {
  const { auth } = useAuth();
  // Message for placeholder buttons whose pages don't exist yet.
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  // ProtectedRoute only renders this layout for signed-in users.
  if (auth.status !== 'signedIn') return null;
  const user = auth.user;

  // Placeholders: these buttons work but only show a "coming soon" message.
  const comingSoon = (what: string) => () => setNotice(`${what} is coming soon.`);

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Pinned to the window height, so Settings and Sign out stay visible without scrolling. */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 md:sticky md:top-0 md:flex md:h-screen">
        <Brand />

        <button type="button" onClick={comingSoon('Adding and removing subscriptions')}
                className={`mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 ${focusRing}`}>
          <PlusIcon className="h-4 w-4" />
          Add / remove subscriptions
        </button>

        <nav aria-label="Main" className="mt-6">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={navClass}>
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
          <button type="button" onClick={comingSoon('Settings')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}>
            <SettingsIcon className="h-5 w-5" />
            Settings
            {soonPill}
          </button>
          <SignOutButton className="w-full text-left" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-4 pt-6 sm:px-8 md:justify-end">
          <div className="md:hidden"><Brand /></div>
          <div className="flex items-center gap-2">
            <UserBadge user={user} />
            <SignOutButton className="md:hidden" />
          </div>
        </header>

        {/* On small screens the sidebar is hidden, so show the page links here. */}
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-4 pt-4 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 pb-24 pt-2 sm:px-8 md:pb-12">
          <Outlet />
        </main>
      </div>

      <div role="status" aria-live="polite"
           className="pointer-events-none fixed inset-x-0 bottom-24 flex justify-center px-4">
        {notice && (
          <p className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">{notice}</p>
        )}
      </div>

      <AssistantWidget />
    </div>
  );
}
