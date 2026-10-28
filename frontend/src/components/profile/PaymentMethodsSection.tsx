import { useState } from 'react';
import type { PaymentMethod } from '../../types/profile';
import { CardIcon, PlusIcon } from '../icons';
import ProfileSection from './ProfileSection';
import { focusRing, infoNote, secondaryButton } from './formStyles';

type Props = {
  paymentMethods: PaymentMethod[];
};

// Read-only for now: adding, removing and changing the default card only show
// a "coming soon" message until the backend supports payment methods.
export default function PaymentMethodsSection({ paymentMethods }: Props) {
  const [notice, setNotice] = useState('');

  const comingSoon = (what: string) => () => setNotice(`${what} is coming soon.`);

  const addButton = (
    <button type="button" onClick={comingSoon('Adding a card')}
            className={`inline-flex items-center gap-1.5 ${secondaryButton}`}>
      <PlusIcon className="h-4 w-4" />
      Add card
    </button>
  );

  return (
    <ProfileSection
      id="payment-methods"
      title="Payment methods"
      description="Cards your subscriptions are charged to."
      icon={<CardIcon className="h-5 w-5" />}
      action={addButton}
    >
      {notice && <p role="status" className={`mb-3 ${infoNote}`}>{notice}</p>}
      {paymentMethods.length === 0 ? (
        <p className="text-sm text-slate-500">No cards on file.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg ring-1 ring-slate-200">
          {paymentMethods.map((card) => (
            <li key={card.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-12 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  {card.brand}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {card.brand} ending in {card.last4}
                    {card.isDefault && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">Expires {card.expires}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {!card.isDefault && (
                  <button type="button" onClick={comingSoon('Changing your default card')}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 ${focusRing}`}>
                    Make default
                  </button>
                )}
                <button type="button" onClick={comingSoon('Removing a card')}
                        aria-label={`Remove ${card.brand} ending in ${card.last4}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ProfileSection>
  );
}
