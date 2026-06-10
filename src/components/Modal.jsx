// Generic modal/drawer shell. On mobile it slides up as a bottom drawer; on
// desktop it's a centred dialog. Closes on backdrop click and Escape.

import { useEffect } from 'react';

export default function Modal({ open, onClose, children, maxWidth = 'max-w-2xl', dismissable = true }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissable) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => dismissable && onClose?.()}
      />
      <div
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto thin-scroll rounded-t-3xl bg-surface ring-1 ring-white/10 shadow-card animate-fade-in sm:rounded-3xl ${maxWidth}`}
      >
        {dismissable && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/5 p-2 text-white/50 transition hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
