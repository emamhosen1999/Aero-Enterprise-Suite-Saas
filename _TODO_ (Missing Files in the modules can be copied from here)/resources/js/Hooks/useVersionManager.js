import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

export const useVersionManager = () => {
    const { props } = usePage();
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);

    // Get current version from Inertia props
    const currentVersion = props.app?.version || '1.0.0';

    // Check localStorage for stored version
    const getStoredVersion = useCallback(() => {
        try {
            return localStorage.getItem('app_version') || currentVersion;
        } catch (error) {
            console.warn('Failed to read version from localStorage:', error);
            return currentVersion;
        }
    }, [currentVersion]);

    // Store version in localStorage
    const storeVersion = useCallback((version) => {
        try {
            localStorage.setItem('app_version', version);
            localStorage.setItem('app_version_timestamp', Date.now().toString());
        } catch (error) {
            console.warn('Failed to store version in localStorage:', error);
        }
    }, []);

    // Check if version has changed
    const checkVersionMismatch = useCallback(async () => {
        if (isChecking) return false;

        setIsChecking(true);
        
        try {
            const storedVersion = getStoredVersion();
            
            // Quick local check first
            if (storedVersion !== currentVersion) {
                console.log('Version mismatch detected:', { stored: storedVersion, current: currentVersion });
                setIsUpdateAvailable(true);
                setIsChecking(false);
                return true;
            }

            // Periodic server check (every 5 minutes)
            const lastCheck = localStorage.getItem('app_version_last_check');
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            if (lastCheck && (now - parseInt(lastCheck)) < fiveMinutes) {
                setIsChecking(false);
                return false;
            }

            // Check with server
            const response = await axios.post('/api/version/check', {
                version: storedVersion
            });

            localStorage.setItem('app_version_last_check', now.toString());
            setLastChecked(new Date());

            if (!response.data.version_match) {
                console.log('Server version mismatch:', response.data);
                setIsUpdateAvailable(true);
                setIsChecking(false);
                return true;
            }

            setIsChecking(false);
            return false;

        } catch (error) {
            console.warn('Version check failed:', error);
            setIsChecking(false);
            return false;
        }
    }, [currentVersion, getStoredVersion, isChecking]);

    // Force application update
    const forceUpdate = useCallback(async () => {
        try {
            // Clear version storage
            localStorage.removeItem('app_version');
            localStorage.removeItem('app_version_timestamp');
            localStorage.removeItem('app_version_last_check');

            // Unregister service worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('Service worker unregistered');
                }
            }

            // Clear browser caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('Browser caches cleared');
            }

            // Store new version
            storeVersion(currentVersion);

            // Force reload
            window.location.reload(true);

        } catch (error) {
            console.error('Failed to force update:', error);
            // Fallback: simple reload
            window.location.reload(true);
        }
    }, [currentVersion, storeVersion]);

    // Initialize version tracking
    useEffect(() => {
        const initialize = () => {
            const storedVersion = getStoredVersion();
            
            // If no stored version or versions don't match, store current
            if (!storedVersion || storedVersion !== currentVersion) {
                storeVersion(currentVersion);
                
                // If versions don't match, check for update
                if (storedVersion && storedVersion !== currentVersion) {
                    setIsUpdateAvailable(true);
                }
            }
        };

        initialize();
    }, [currentVersion, getStoredVersion, storeVersion]);

    // Set up periodic version checking
    useEffect(() => {
        // Check immediately
        checkVersionMismatch();

        // Set up interval for periodic checks (every 30 seconds)
        const interval = setInterval(() => {
            checkVersionMismatch();
        }, 30000);

        // Check when page becomes visible again
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setTimeout(checkVersionMismatch, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [checkVersionMismatch]);

    // Listen for service worker messages
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'VERSION_UPDATE_AVAILABLE') {
                console.log('Service worker detected version update');
                setIsUpdateAvailable(true);
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, []);

    return {
        currentVersion,
        isUpdateAvailable,
        isChecking,
        lastChecked,
        checkVersionMismatch,
        forceUpdate,
        dismissUpdate: () => setIsUpdateAvailable(false)
    };
};
