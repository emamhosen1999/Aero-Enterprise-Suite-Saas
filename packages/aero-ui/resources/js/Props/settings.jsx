/**
 * Props/settings.jsx
 *
 * Thin adapter that returns the settings section of the backend navigation
 * tree, filtered to the Settings pages only — for use in Breadcrumb.jsx
 * when the user is on a /settings route.
 */

import { convertNavigationToPages } from '@/Config/navigationUtils';

/**
 * Return navigation entries that belong to the Settings area.
 *
 * @param {string[]} permissions  - Current user permissions (kept for API compat)
 * @param {Object}   auth         - Full auth object from Inertia props
 * @returns {Array}  Breadcrumb-compatible settings page tree
 */
export function getSettingsPages(permissions = [], auth = {}) {
    const navigation = auth?.navigation
        ?? (typeof window !== 'undefined' ? window?.__inertia?.page?.props?.navigation : null)
        ?? [];
    const all = convertNavigationToPages(Array.isArray(navigation) ? navigation : []);
    // Filter to items whose route or path includes 'settings'
    const settingsItems = all.filter(
        item =>
            (item.route && String(item.route).toLowerCase().includes('setting')) ||
            (item.href && String(item.href).toLowerCase().includes('setting')) ||
            (item.name && String(item.name).toLowerCase().includes('setting'))
    );
    return settingsItems.length > 0 ? settingsItems : all;
}

export default getSettingsPages;