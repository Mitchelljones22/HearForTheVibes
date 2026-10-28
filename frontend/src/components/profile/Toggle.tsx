import { focusRing } from './formStyles';

type ToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

// On/off switch with a label, for notification and security settings.
export default function Toggle({ id, label, description, checked, disabled = false, onChange }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p id={`${id}-desc`} className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${focusRing} ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}
