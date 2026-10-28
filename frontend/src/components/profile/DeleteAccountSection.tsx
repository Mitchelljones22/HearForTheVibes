import { useState } from 'react';
import { TrashIcon } from '../icons';
import ProfileSection from './ProfileSection';
import { focusRing, infoNote } from './formStyles';

// PLACEHOLDER: the button doesn't delete anything yet. When the backend has
// DELETE /api/profile, add a confirmation step here, call it, then sign out
// and navigate to /login.
export default function DeleteAccountSection() {
  const [notice, setNotice] = useState('');

  return (
    <ProfileSection
      id="delete-account"
      title="Delete account"
      description="Permanently remove your account and all tracked subscriptions. This can't be undone."
      icon={<TrashIcon className="h-5 w-5" />}
      danger
    >
      {notice && <p role="status" className={`mb-3 ${infoNote}`}>{notice}</p>}
      <button type="button" onClick={() => setNotice('Account deletion is coming soon.')}
              className={`rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 ${focusRing}`}>
        Delete account
      </button>
    </ProfileSection>
  );
}
