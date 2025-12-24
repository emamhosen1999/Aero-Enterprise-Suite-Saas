/**
 * Route Safety Utilities for Inertia.js Navigation
 * 
 * Provides safe wrappers around Ziggy's route() helper to prevent
 * undefined errors and navigation failures in multi-domain environments.
 * 
 * @package aero-ui
 */

import { router } from '@inertiajs/react';
import { showToast } from './toastUtils';

/**
 * Safely check if a route exists
 * 
 * @param {string} name - Route name
 * @returns {boolean} - True if route exists
 */
export function hasRoute(name) {
    try {
        return typeof route === 'function' && route().has(name);
    } catch (error) {
        console.warn(`Route check failed for "${name}":`, error);
        return false;
    }
}

/**
 * Safely get a route URL with fallback
 * 
 * @param {string} name - Route name
 * @param {object} params - Route parameters
 * @param {string} fallback - Fallback URL if route doesn't exist
 * @returns {string} - Route URL or fallback
 * 
 * @example
 * // Safe usage
 * const url = safeRoute('profile', { user: 123 }, '/dashboard');
 * 
 * // With hash fallback (for disabled links)
 * const url = safeRoute('admin.users', {}, '#');
 */
export function safeRoute(name, params = {}, fallback = '#') {
    try {
        if (typeof route === 'function' && route().has(name)) {
            return route(name, params);
        }
    } catch (error) {
        console.warn(`Route "${name}" not found or invalid:`, error);
    }
    return fallback;
}

/**
 * Safely navigate to a route with validation
 * 
 * Validates route existence before navigation and shows error toast if invalid.
 * 
 * @param {string} routeName - Route name
 * @param {object} params - Route parameters
 * @param {object} options - Inertia visit options
 * @returns {void}
 * 
 * @example
 * safeNavigate('employees.show', { employee: 123 });
 * safeNavigate('dashboard', {}, { preserveScroll: true });
 */
export function safeNavigate(routeName, params = {}, options = {}) {
    if (!hasRoute(routeName)) {
        console.error(`Cannot navigate: route "${routeName}" does not exist`);
        showToast.error(`Navigation failed: Route "${routeName}" not found`);
        return;
    }
    
    try {
        router.visit(route(routeName, params), options);
    } catch (error) {
        console.error(`Navigation to "${routeName}" failed:`, error);
        showToast.error('Navigation failed. Please try again.');
    }
}

/**
 * Safely perform POST request to a route
 * 
 * @param {string} routeName - Route name
 * @param {object} data - Request data
 * @param {object} options - Inertia visit options
 * @returns {void}
 * 
 * @example
 * safePost('users.store', { name: 'John', email: 'john@example.com' });
 */
export function safePost(routeName, data = {}, options = {}) {
    if (!hasRoute(routeName)) {
        console.error(`Cannot post: route "${routeName}" does not exist`);
        showToast.error(`Request failed: Route "${routeName}" not found`);
        return;
    }
    
    try {
        router.post(route(routeName), data, options);
    } catch (error) {
        console.error(`POST to "${routeName}" failed:`, error);
        showToast.error('Request failed. Please try again.');
    }
}

/**
 * Safely perform PUT request to a route
 * 
 * @param {string} routeName - Route name
 * @param {object} params - Route parameters
 * @param {object} data - Request data
 * @param {object} options - Inertia visit options
 * @returns {void}
 */
export function safePut(routeName, params = {}, data = {}, options = {}) {
    if (!hasRoute(routeName)) {
        console.error(`Cannot put: route "${routeName}" does not exist`);
        showToast.error(`Update failed: Route "${routeName}" not found`);
        return;
    }
    
    try {
        router.put(route(routeName, params), data, options);
    } catch (error) {
        console.error(`PUT to "${routeName}" failed:`, error);
        showToast.error('Update failed. Please try again.');
    }
}

/**
 * Safely perform DELETE request to a route
 * 
 * @param {string} routeName - Route name
 * @param {object} params - Route parameters
 * @param {object} options - Inertia visit options
 * @returns {void}
 */
export function safeDelete(routeName, params = {}, options = {}) {
    if (!hasRoute(routeName)) {
        console.error(`Cannot delete: route "${routeName}" does not exist`);
        showToast.error(`Delete failed: Route "${routeName}" not found`);
        return;
    }
    
    try {
        router.delete(route(routeName, params), options);
    } catch (error) {
        console.error(`DELETE to "${routeName}" failed:`, error);
        showToast.error('Delete failed. Please try again.');
    }
}

/**
 * Get route URL or null if doesn't exist
 * 
 * Useful for conditional rendering
 * 
 * @param {string} name - Route name
 * @param {object} params - Route parameters
 * @returns {string|null} - Route URL or null
 * 
 * @example
 * const editUrl = getRouteOrNull('users.edit', { user: 123 });
 * {editUrl && <Link href={editUrl}>Edit</Link>}
 */
export function getRouteOrNull(name, params = {}) {
    try {
        if (typeof route === 'function' && route().has(name)) {
            return route(name, params);
        }
    } catch (error) {
        console.warn(`Route "${name}" not found:`, error);
    }
    return null;
}

/**
 * Check if current route matches
 * 
 * @param {string} name - Route name to check
 * @param {object} params - Optional route parameters
 * @returns {boolean} - True if current route matches
 * 
 * @example
 * const isActive = isCurrentRoute('employees.index');
 * const isActive = isCurrentRoute('employees.show', { employee: 123 });
 */
export function isCurrentRoute(name, params = {}) {
    try {
        if (typeof route === 'function') {
            return route().current(name, params);
        }
    } catch (error) {
        console.warn(`Route current check failed for "${name}":`, error);
    }
    return false;
}

/**
 * Get list of all available routes
 * 
 * Useful for debugging and development
 * 
 * @returns {array} - Array of route names
 */
export function getAvailableRoutes() {
    try {
        if (typeof route === 'function' && typeof route().list === 'function') {
            return Object.keys(route().list());
        }
    } catch (error) {
        console.warn('Could not retrieve route list:', error);
    }
    return [];
}

/**
 * Validate domain context for cross-domain navigation
 * 
 * Prevents navigation from tenant domain to admin domain or vice versa
 * 
 * @param {string} targetUrl - Target URL to navigate to
 * @returns {boolean} - True if navigation is safe
 */
export function validateDomainContext(targetUrl) {
    try {
        const currentHost = window.location.hostname;
        const targetHost = new URL(targetUrl, window.location.origin).hostname;
        
        // Same host = safe
        if (currentHost === targetHost) {
            return true;
        }
        
        // Check if crossing admin/tenant boundary
        const isAdminCurrent = currentHost.startsWith('admin.');
        const isAdminTarget = targetHost.startsWith('admin.');
        
        // Warn if crossing boundaries
        if (isAdminCurrent !== isAdminTarget) {
            console.warn('Cross-domain navigation detected:', {
                from: currentHost,
                to: targetHost
            });
            return false;
        }
        
        return true;
    } catch (error) {
        console.warn('Domain validation failed:', error);
        return false;
    }
}

/**
 * Safe navigation with domain validation
 * 
 * @param {string} routeName - Route name
 * @param {object} params - Route parameters
 * @param {object} options - Inertia visit options
 * @returns {void}
 */
export function safeNavigateWithDomainCheck(routeName, params = {}, options = {}) {
    if (!hasRoute(routeName)) {
        console.error(`Cannot navigate: route "${routeName}" does not exist`);
        showToast.error(`Navigation failed: Route not found`);
        return;
    }
    
    try {
        const targetUrl = route(routeName, params);
        
        if (!validateDomainContext(targetUrl)) {
            showToast.error('Cannot navigate across domains');
            return;
        }
        
        router.visit(targetUrl, options);
    } catch (error) {
        console.error(`Navigation with domain check failed:`, error);
        showToast.error('Navigation failed. Please try again.');
    }
}

// Export all functions as default object for convenience
export default {
    hasRoute,
    safeRoute,
    safeNavigate,
    safePost,
    safePut,
    safeDelete,
    getRouteOrNull,
    isCurrentRoute,
    getAvailableRoutes,
    validateDomainContext,
    safeNavigateWithDomainCheck
};
