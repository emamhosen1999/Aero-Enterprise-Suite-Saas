/**
 * Secure Device Authentication Utility
 * Generates and manages UUIDv4 device identifiers for single-device login enforcement
 */

import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'aero_device_id';

/**
 * Get or generate a persistent device ID (UUIDv4).
 * This ID is stored in localStorage and uniquely identifies this browser/device.
 *
 * @returns {string} UUIDv4 device identifier
 */
export function getDeviceId(): string {
    // Try to retrieve existing device ID from localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    // If no device ID exists, generate a new UUIDv4
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
 
    }

    return deviceId;
}

/**
 * Clear the stored device ID.
 * USE WITH CAUTION: This will force the user to re-register on next login.
 */
export function clearDeviceId(): void {
    localStorage.removeItem(DEVICE_ID_KEY);

}

/**
 * Check if device ID exists in localStorage.
 *
 * @returns {boolean}
 */
export function hasDeviceId(): boolean {
    return localStorage.getItem(DEVICE_ID_KEY) !== null;
}

/**
 * Get device ID for including in request headers.
 *
 * @returns {Record<string, string>}
 */
export function getDeviceHeaders(): Record<string, string> {
    return {
        'X-Device-ID': getDeviceId(),
    };
}

/**
 * Attach device ID to axios request config.
 * Used as an axios interceptor.
 *
 * @param {any} config - Axios request config
 * @returns {any} Modified config with device ID header
 */
export function attachDeviceId(config: any): any {
    config.headers = {
        ...config.headers,
        'X-Device-ID': getDeviceId(),
    };

    return config;
}

/**
 * Handle device mismatch errors.
 * Called when the backend returns a 403 with device_mismatch reason.
 *
 * @param {string} message - Error message from backend
 */
export function handleDeviceMismatch(message: string): void {
    console.error('[Device Auth] Device mismatch detected:', message);

    // Show alert to user
    alert(
        message || 
        'Device mismatch. Account is locked to another device. Please contact your administrator to reset device access.'
    );

    // Clear localStorage
    clearDeviceId();

    // Redirect to login using Inertia if available
    if (typeof window !== 'undefined' && window.Inertia) {
        window.Inertia.visit('/login', {
            method: 'get',
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    } else {
        window.location.href = '/login';
    }
}

/**
 * Handle missing localStorage scenario.
 * Some browsers in incognito/private mode may block localStorage.
 *
 * @returns {boolean} True if localStorage is available
 */
export function checkLocalStorageAvailability(): boolean {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.error('[Device Auth] localStorage is not available:', e);
        return false;
    }
}

/**
 * Initialize device authentication on app load.
 * Checks localStorage availability and generates device ID if needed.
 */
export function initializeDeviceAuth(): void {
    if (!checkLocalStorageAvailability()) {
        console.warn('[Device Auth] localStorage unavailable - device binding may not work');
        return;
    }

    // Ensure device ID is generated
    const deviceId = getDeviceId();
   
}

export default {
    getDeviceId,
    clearDeviceId,
    hasDeviceId,
    getDeviceHeaders,
    attachDeviceId,
    handleDeviceMismatch,
    checkLocalStorageAvailability,
    initializeDeviceAuth,
};
