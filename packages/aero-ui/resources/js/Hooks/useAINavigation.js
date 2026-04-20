import { useCallback, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

/**
 * Hook for AI-powered navigation: tracks page visits and provides AI suggestions.
 *
 * Usage:
 *   const { suggestions, fetchSuggestions, trackVisit } = useAINavigation();
 *
 * Features:
 *   - Automatically tracks the current page visit on mount
 *   - Provides fetchSuggestions() to get context-aware AI recommendations
 *   - Exposes the userNavMetadata from Inertia shared props (top/recent paths, etc.)
 */
export function useAINavigation() {
    const { url, userNavMetadata } = usePage().props;
    const trackedRef = useRef(null);

    // Auto-track page visits (debounced — only once per URL per mount)
    useEffect(() => {
        if (!url || trackedRef.current === url) {
            return;
        }
        trackedRef.current = url;

        // Extract path from full URL
        const path = new URL(url, window.location.origin).pathname;

        // Fire-and-forget tracking call
        axios.post(route('core.user.navigation.track'), { path }).catch(() => {
            // Silently ignore tracking failures
        });
    }, [url]);

    // Manually track a visit (e.g., when user clicks a nav item but doesn't navigate yet)
    const trackVisit = useCallback((path, name = null, module = null) => {
        return axios.post(route('core.user.navigation.track'), { path, name, module }).catch(() => {});
    }, []);

    // Fetch AI suggestions for current context
    const fetchSuggestions = useCallback(async (currentPath = null) => {
        try {
            const path = currentPath ?? new URL(url, window.location.origin).pathname;
            const response = await axios.get(route('core.api.navigation.suggestions'), {
                params: { path },
            });
            return response.data.data;
        } catch {
            return { pinned: [], frequent: [], recent: [], contextual: [] };
        }
    }, [url]);

    return {
        /** Metadata from Inertia shared props (topPaths, recentPaths, quickActions, etc.) */
        metadata: userNavMetadata ?? null,
        /** Fetch full AI suggestions from the backend */
        fetchSuggestions,
        /** Manually track a nav visit */
        trackVisit,
    };
}

export default useAINavigation;
