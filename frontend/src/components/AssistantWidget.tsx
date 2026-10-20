import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon, SparklesIcon } from './icons';

// Placeholder for the AI chatbot (a course requirement). The button and panel are
// real, but nothing is sent anywhere yet. When the backend has an assistant
// endpoint, replace the "Coming soon" form with a real chat that calls it.
const suggestions = [
  'Where can I cut costs?',
  'What renews this month?',
  'Do I have overlapping services?',
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Move focus into the panel when it opens; Escape closes it.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  return (
    <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-3">
      {open && (
        <section role="dialog" aria-labelledby={titleId}
                 className="w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/10">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <SparklesIcon className="h-4.5 w-4.5" />
              </span>
              <h2 id={titleId} className="text-sm font-semibold text-slate-900">Spending assistant</h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/25">
                Preview
              </span>
            </div>
            <button ref={closeRef} type="button" onClick={close} aria-label="Close assistant"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600">
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="px-4 py-4">
            <p className="text-sm text-slate-600">
              Soon you'll be able to ask questions about your subscriptions and get suggestions for saving money.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Things you'll be able to ask</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">{s}</li>
              ))}
            </ul>
          </div>

          <form className="flex gap-2 border-t border-slate-200 p-3" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor={`${titleId}-input`} className="sr-only">Message</label>
            <input id={`${titleId}-input`} disabled placeholder="Coming soon"
                   className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed" />
            <button type="submit" disabled
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              Send
            </button>
          </form>
        </section>
      )}

      <button ref={launcherRef} type="button" onClick={() => (open ? close() : setOpen(true))}
              aria-expanded={open}
              className="flex items-center gap-2 rounded-full bg-indigo-600 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        <SparklesIcon className="h-5 w-5" />
        Ask AI
      </button>
    </div>
  );
}
