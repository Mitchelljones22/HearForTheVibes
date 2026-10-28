import { useEffect, useState } from 'react';
import { getProfile } from '../api/profile';
import { useAuth } from '../auth/useAuth';
import { ShieldIcon } from '../components/icons';
import DeleteAccountSection from '../components/profile/DeleteAccountSection';
import NotificationsSection from '../components/profile/NotificationsSection';
import PaymentMethodsSection from '../components/profile/PaymentMethodsSection';
import PersonalInfoSection from '../components/profile/PersonalInfoSection';
import SecuritySection from '../components/profile/SecuritySection';
import { formatDate } from '../lib/dates';
import type { UserProfile } from '../types/profile';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: UserProfile };

function SummaryCard({ profile }: { profile: UserProfile }) {
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();
  return (
    <section aria-label="Account summary" className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700"
             aria-hidden="true">
          {initials}
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900">{profile.firstName} {profile.lastName}</p>
        <p className="break-all text-sm text-slate-500">{profile.email}</p>
      </div>

      <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Member since</dt>
          <dd className="font-medium text-slate-900">{formatDate(profile.memberSince)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Cards on file</dt>
          <dd className="font-medium text-slate-900">{profile.paymentMethods.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Two-factor</dt>
          <dd>
            {profile.twoFactorEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <ShieldIcon className="h-3.5 w-3.5" />
                On
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/25">
                Off
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function Profile() {
  const { auth } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const user = auth.status === 'signedIn' ? auth.user : null;

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    getProfile(user)
      .then((profile) => { if (!ignore) setState({ status: 'ready', profile }); })
      .catch((err: unknown) => {
        if (!ignore) setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
      });
    return () => { ignore = true; };
  }, [user, reloadKey]);

  function handleUpdated(profile: UserProfile) {
    setState({ status: 'ready', profile });
  }

  function retry() {
    setState({ status: 'loading' });
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile & settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal details, security and notifications.</p>
      </div>

      {state.status === 'loading' && (
        <p role="status" className="mt-10 text-sm text-slate-500">Loading your profile…</p>
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

      {state.status === 'ready' && (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
          <div className="lg:sticky lg:top-6">
            <SummaryCard profile={state.profile} />
          </div>
          <div className="space-y-5 lg:col-span-2">
            <PersonalInfoSection profile={state.profile} onUpdated={handleUpdated} />
            <SecuritySection profile={state.profile} onUpdated={handleUpdated} />
            <NotificationsSection profile={state.profile} onUpdated={handleUpdated} />
            <PaymentMethodsSection paymentMethods={state.profile.paymentMethods} />
            <DeleteAccountSection />
          </div>
        </div>
      )}
    </div>
  );
}
