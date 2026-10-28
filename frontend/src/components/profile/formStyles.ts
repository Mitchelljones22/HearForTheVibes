// Shared Tailwind classes so the profile forms match the login and register pages.

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

export const labelClass = 'block text-sm font-semibold text-slate-800 mb-1.5';

const inputBase =
  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2';

export function inputClass(hasError: boolean): string {
  if (hasError) {
    return `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-500/30`;
  }
  return `${inputBase} border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30`;
}

export const primaryButton =
  'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ' +
  `hover:bg-indigo-700 disabled:opacity-60 ${focusRing}`;

export const secondaryButton =
  'rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors ' +
  `hover:bg-slate-50 disabled:opacity-60 ${focusRing}`;

export const successNote = 'rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200';
export const errorNote = 'rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200';
export const infoNote = 'rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200';
