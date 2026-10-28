import { useState } from 'react';
import { updateNotifications } from '../../api/profile';
import type { NotificationPreferences, UserProfile } from '../../types/profile';
import { BellIcon } from '../icons';
import ProfileSection from './ProfileSection';
import Toggle from './Toggle';
import { errorNote, labelClass } from './formStyles';

type Props = {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
};

// Each change saves right away, like a settings screen in a banking app.
export default function NotificationsSection({ profile, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const prefs = profile.notifications;

  async function save(change: Partial<NotificationPreferences>) {
    setSaving(true);
    setError('');
    try {
      onUpdated(await updateNotifications({ ...prefs, ...change }));
    } catch {
      setError('That setting could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileSection
      id="notifications"
      title="Notifications"
      description="Choose which emails and alerts you get."
      icon={<BellIcon className="h-5 w-5" />}
    >
      {error && <p role="alert" className={`mb-3 ${errorNote}`}>{error}</p>}
      <div className="divide-y divide-slate-200 rounded-lg px-4 ring-1 ring-slate-200">
        <div>
          <Toggle
            id="renewal-reminders"
            label="Renewal reminders"
            description="Email me before a subscription renews."
            checked={prefs.renewalReminders}
            disabled={saving}
            onChange={(renewalReminders) => save({ renewalReminders })}
          />
          {prefs.renewalReminders && (
            <div className="pb-4">
              <label htmlFor="reminder-days" className={labelClass}>Send reminder</label>
              <select
                id="reminder-days"
                value={prefs.reminderDaysBefore}
                disabled={saving}
                onChange={(e) => save({ reminderDaysBefore: Number(e.target.value) as NotificationPreferences['reminderDaysBefore'] })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 sm:w-56"
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>7 days before</option>
              </select>
            </div>
          )}
        </div>
        <Toggle
          id="weekly-summary"
          label="Weekly spending summary"
          description="A Monday email with last week's subscription spend."
          checked={prefs.weeklySummary}
          disabled={saving}
          onChange={(weeklySummary) => save({ weeklySummary })}
        />
        <Toggle
          id="price-change-alerts"
          label="Price change alerts"
          description="Tell me when a subscription's price goes up."
          checked={prefs.priceChangeAlerts}
          disabled={saving}
          onChange={(priceChangeAlerts) => save({ priceChangeAlerts })}
        />
        <Toggle
          id="unusual-charges"
          label="Unusual charge alerts"
          description="Flag charges that don't match a subscription you track."
          checked={prefs.unusualCharges}
          disabled={saving}
          onChange={(unusualCharges) => save({ unusualCharges })}
        />
      </div>
    </ProfileSection>
  );
}
