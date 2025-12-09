import { useEffect, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

/**
 * useRegistrationSession
 * 
 * Hook to detect and handle registration session timeouts.
 * Checks if the session is still valid and provides recovery options.
 * 
 * @param {boolean} enabled - Whether to enable session checking
 * @param {number} checkInterval - Interval in milliseconds to check session (default: 60000 = 1 minute)
 */
export function useRegistrationSession(enabled = true, checkInterval = 60000) {
    const [isSessionValid, setIsSessionValid] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    const checkSession = useCallback(async () => {
        if (!enabled || isChecking) return;

        setIsChecking(true);
        
        try {
            // Try to access a session-dependent endpoint
            const response = await axios.get(route('platform.register.details'));
            
            // If we get a redirect to the start, session is invalid
            if (response.status === 200) {
                setIsSessionValid(true);
            }
        } catch (error) {
            // If we get a 419 (CSRF token mismatch) or redirect, session likely expired
            if (error.response?.status === 419 || error.response?.status === 302) {
                setIsSessionValid(false);
            }
        } finally {
            setIsChecking(false);
        }
    }, [enabled, isChecking]);

    // Check session periodically
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(checkSession, checkInterval);
        
        // Also check on visibility change (when user returns to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkSession();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, checkInterval, checkSession]);

    const restartRegistration = useCallback(() => {
        router.visit(route('platform.register.index'));
    }, []);

    return {
        isSessionValid,
        isChecking,
        checkSession,
        restartRegistration
    };
}
