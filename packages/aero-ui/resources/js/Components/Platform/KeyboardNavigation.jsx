import React, { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { showToast } from '@/utils/ui/toastUtils';

/**
 * Keyboard Shortcuts Hook and Component
 * 
 * Provides keyboard navigation and accessibility features for registration flow.
 */

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation({
  onNext,
  onPrevious,
  onSubmit,
  enabled = true,
}) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Don't trigger on input/textarea/select elements unless Escape
      const tagName = event.target.tagName.toLowerCase();
      const isInputElement = ['input', 'textarea', 'select'].includes(tagName);

      // Escape - Go back
      if (event.key === 'Escape') {
        event.preventDefault();
        onPrevious?.();
        return;
      }

      // Skip other shortcuts if in input
      if (isInputElement && !event.metaKey && !event.ctrlKey) {
        return;
      }

      // Cmd/Ctrl + Enter - Submit
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        onSubmit?.();
        return;
      }

      // Arrow Right or Tab (without shift) at end - Next (only if not in form)
      if (!isInputElement && (event.key === 'ArrowRight' || (event.key === 'Tab' && !event.shiftKey))) {
        // Let Tab work normally in forms
        if (event.key === 'Tab') return;
        event.preventDefault();
        onNext?.();
        return;
      }

      // Arrow Left - Previous (only if not in form)
      if (!isInputElement && event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrevious?.();
        return;
      }
    },
    [enabled, onNext, onPrevious, onSubmit]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Skip Link Component for Accessibility
 */
export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
    >
      {children}
    </a>
  );
}

/**
 * Keyboard Shortcuts Help Modal Content
 */
export function KeyboardShortcutsHelp({ className = '' }) {
  const shortcuts = [
    { keys: ['Ctrl', 'Enter'], description: 'Submit form / Continue to next step' },
    { keys: ['Esc'], description: 'Go back to previous step' },
    { keys: ['←', '→'], description: 'Navigate between steps (when not in form)' },
    { keys: ['Tab'], description: 'Move between form fields' },
    { keys: ['Shift', 'Tab'], description: 'Move to previous form field' },
    { keys: ['Space'], description: 'Toggle checkboxes / Activate buttons' },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="font-semibold text-lg">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="px-2 py-1 text-xs font-mono bg-default-100 border border-default-200 rounded">
                    {key}
                  </kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-default-400">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <span className="text-sm text-default-500">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Focus Trap Component
 * Traps focus within a container for modals and dialogs
 */
export function FocusTrap({ children, active = true }) {
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

/**
 * Announcer for screen readers
 */
export function ScreenReaderAnnouncer({ message, priority = 'polite' }) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

export default {
  useKeyboardNavigation,
  SkipLink,
  KeyboardShortcutsHelp,
  FocusTrap,
  ScreenReaderAnnouncer,
};
