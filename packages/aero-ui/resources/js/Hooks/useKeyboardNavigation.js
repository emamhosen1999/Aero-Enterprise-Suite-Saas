import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for global keyboard navigation shortcuts.
 *
 * Usage:
 *   useKeyboardNavigation({
 *       onCommandPalette: () => setOpen(true),  // Cmd/Ctrl+K
 *       onQuickNav: (index) => navigateTo(index), // Cmd/Ctrl+1-9
 *       onGoToDashboard: () => router.visit('/dashboard'), // Cmd/Ctrl+Shift+D
 *   });
 *
 * All shortcuts use Cmd on macOS, Ctrl on Windows/Linux.
 */
export function useKeyboardNavigation({
    onCommandPalette,
    onQuickNav,
    onGoToDashboard,
    enabled = true,
} = {}) {
    const callbacksRef = useRef({ onCommandPalette, onQuickNav, onGoToDashboard });

    useEffect(() => {
        callbacksRef.current = { onCommandPalette, onQuickNav, onGoToDashboard };
    });

    const handleKeyDown = useCallback((e) => {
        if (!enabled) {
            return;
        }

        const isMod = e.metaKey || e.ctrlKey;
        if (!isMod) {
            return;
        }

        // Ignore when typing in inputs/textareas
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
            // Allow Cmd+K even in inputs (common for search)
            if (e.key !== 'k' && e.key !== 'K') {
                return;
            }
        }

        // Cmd/Ctrl+K → Command Palette
        if ((e.key === 'k' || e.key === 'K') && !e.shiftKey) {
            e.preventDefault();
            callbacksRef.current.onCommandPalette?.();
            return;
        }

        // Cmd/Ctrl+Shift+D → Dashboard
        if ((e.key === 'd' || e.key === 'D') && e.shiftKey) {
            e.preventDefault();
            callbacksRef.current.onGoToDashboard?.();
            return;
        }

        // Cmd/Ctrl+1-9 → Quick nav to Nth item
        const numKey = parseInt(e.key, 10);
        if (numKey >= 1 && numKey <= 9 && !e.shiftKey) {
            e.preventDefault();
            callbacksRef.current.onQuickNav?.(numKey - 1);
            return;
        }
    }, [enabled]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

export default useKeyboardNavigation;
