/**
 * Props/pages.jsx
 *
 * Thin adapter that converts backend-driven navigation (from Inertia
 * props.navigation via HandleInertiaRequests) into the legacy breadcrumb
 * page-tree format expected by Breadcrumb.jsx.
 *
 * Architecture:
 *   Backend NavigationRegistry -> props.navigation -> convertNavigationToPages -> Breadcrumb
 */

import { convertNavigationToPages } from '@/Config/navigationUtils';

/**
 * Convert raw backend navigation into the legacy pages format.
 *
 * @param {string[]} roles        - Current user roles (kept for API compatibility)
 * @param {string[]} permissions  - Current permissions (kept for API compatibility)
 * @param {Object}   auth         - Full auth object from Inertia props
 * @returns {Array}  Breadcrumb-compatible page tree
 */
export function getPages(roles = [], permissions = [], auth = {}) {
    const navigation = auth?.navigation
        ?? (typeof window !== 'undefined' ? window?.__inertia?.page?.props?.navigation : null)
        ?? [];
    return convertNavigationToPages(Array.isArray(navigation) ? navigation : []);
}

export default getPages;