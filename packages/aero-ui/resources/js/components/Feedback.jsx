import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons/icons.jsx';
import { cx } from './Primitives.jsx';

/* ── Event bus ────────────────────────────────────────────────── */
const listeners = new Set();
let toastId = 0;

/** useToast — returns a push function that displays a toast notification. */
export function useToast() {
  return useCallback((options) => {
    listeners.forEach(fn => fn({ id: ++toastId, ...options }));
  }, []);
}

/* ── Toast component ──────────────────────────────────────────── */
const TOAST_ICON = {
  info: 'sparkles', success: 'checkCircle',
  warning: 'alertTriangle', danger: 'alertCircle',
};

export function Toast({ intent = 'info', title, icon, onClose, children, className }) {
  return (
    <div
      className={cx('aeos-toast', `aeos-toast-${intent}`, 'aeos-anim-slide-in-right', className)}
      role="status"
      aria-live="polite"
    >
      <div className="aeos-toast-icon">
        <Icon name={icon ?? TOAST_ICON[intent] ?? 'sparkles'} size={16} />
      </div>
      <div className="aeos-toast-body">
        {title && <strong className="aeos-toast-title">{title}</strong>}
        {children && <div className="aeos-toast-text">{children}</div>}
      </div>
      {onClose && (
        <button type="button" className="aeos-icon-btn" onClick={onClose} aria-label="Dismiss">
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  );
}

/* ── ToastManager — singleton mounted once to document.body ───── */
function ToastManager() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const push = toast => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration !== Infinity) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration ?? 4000);
      }
    };
    listeners.add(push);
    return () => listeners.delete(push);
  }, []);

  const remove = id => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="aeos-toast-container">
      {toasts.map(t => (
        <Toast key={t.id} intent={t.intent} title={t.title} onClose={() => remove(t.id)}>
          {t.message ?? t.children}
        </Toast>
      ))}
    </div>
  );
}

/* Mount ToastManager once when this module is first imported. */
if (typeof document !== 'undefined' && !window.__aeosToastMounted) {
  window.__aeosToastMounted = true;
  const el = document.createElement('div');
  document.body.appendChild(el);
  import('react-dom/client').then(({ createRoot }) => {
    createRoot(el).render(<ToastManager />);
  });
}
