import axios from 'axios';
import { attachDeviceId, handleDeviceMismatch } from './utils/deviceAuth';

window.axios = axios;

/**
 * Ziggy Route Helper
 * 
 * The route() function is provided by the @routes directive in app.blade.php.
 * It's injected globally by Ziggy via the Blade directive and must be available
 * before any React components mount.
 * 
 * Usage:
 *   route('route.name')                    // Get route URL
 *   route('route.name', { id: 1 })        // Get route URL with params
 *   route().has('route.name')             // Check if route exists
 *   route().current('route.name')         // Check if current route matches
 * 
 * IMPORTANT: Always check if route exists using hasRoute() from routeUtils
 * before calling route() to avoid undefined errors in Inertia.js v2.
 */

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Ensure cookies are sent with requests
window.axios.defaults.withXSRFToken = true;

// Prevent browser/service worker caching of API responses
window.axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
window.axios.defaults.headers.common['Pragma'] = 'no-cache';
window.axios.defaults.headers.common['Expires'] = '0';

// Attach device ID and cache-busting to all axios requests
axios.interceptors.request.use(
    (config) => {
        try {
            // Add cache-busting timestamp to GET requests
            if (config.method === 'get' || config.method === 'GET') {
                config.params = config.params || {};
                config.params._t = Date.now();
            }
            return attachDeviceId(config);
        } catch (error) {
            console.warn('[Device Auth] Failed to attach device ID:', error);
            // Continue with request even if device ID attachment fails
            return config;
        }
    },
    (error) => Promise.reject(error)
);

// Handle device mismatch errors globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if error is device verification failure
        if (error.response?.status === 403 && error.response?.data?.reason === 'invalid_device') {
            handleDeviceMismatch(error.response.data.error);
        }
        return Promise.reject(error);
    }
);
