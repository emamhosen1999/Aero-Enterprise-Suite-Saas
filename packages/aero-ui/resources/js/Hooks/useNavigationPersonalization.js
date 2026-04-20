import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Hook for managing user navigation preferences (pinned items, hidden items,
 * custom order, quick actions, display options).
 *
 * Usage:
 *   const { preferences, updatePreferences, togglePin, toggleHide, loading } = useNavigationPersonalization();
 *
 * Preferences are fetched once on mount and can be mutated via helpers.
 * All mutations are optimistically applied and then persisted to the backend.
 */
export function useNavigationPersonalization() {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch preferences on mount
    useEffect(() => {
        let cancelled = false;
        axios.get(route('core.user.navigation.preferences.get'))
            .then((res) => {
                if (!cancelled) {
                    setPreferences(res.data.data);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Persist a partial update
    const updatePreferences = useCallback(async (patch) => {
        setPreferences((prev) => (prev ? { ...prev, ...patch } : patch));
        try {
            const response = await axios.patch(route('core.user.navigation.preferences.update'), patch);
            setPreferences(response.data.data);
        } catch {
            // Revert would be ideal, but for nav prefs a stale UI is acceptable
        }
    }, []);

    // Toggle a path in/out of pinned_items
    const togglePin = useCallback((path) => {
        setPreferences((prev) => {
            if (!prev) {
                return prev;
            }
            const pinned = prev.pinned_items ?? [];
            const newPinned = pinned.includes(path)
                ? pinned.filter((p) => p !== path)
                : [...pinned, path];
            updatePreferences({ pinned_items: newPinned });
            return { ...prev, pinned_items: newPinned };
        });
    }, [updatePreferences]);

    // Toggle a path in/out of hidden_items
    const toggleHide = useCallback((path) => {
        setPreferences((prev) => {
            if (!prev) {
                return prev;
            }
            const hidden = prev.hidden_items ?? [];
            const newHidden = hidden.includes(path)
                ? hidden.filter((p) => p !== path)
                : [...hidden, path];
            updatePreferences({ hidden_items: newHidden });
            return { ...prev, hidden_items: newHidden };
        });
    }, [updatePreferences]);

    // Set quick action items (bottom nav)
    const setQuickActions = useCallback((paths) => {
        updatePreferences({ quick_actions: paths });
    }, [updatePreferences]);

    return {
        preferences,
        loading,
        updatePreferences,
        togglePin,
        toggleHide,
        setQuickActions,
    };
}

export default useNavigationPersonalization;
