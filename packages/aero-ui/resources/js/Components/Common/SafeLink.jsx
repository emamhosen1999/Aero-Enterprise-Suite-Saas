/**
 * SafeLink Component
 * 
 * A safe wrapper around Inertia's Link component that validates route existence
 * before rendering, preventing undefined href errors and navigation failures.
 * 
 * @package aero-ui
 */

import React from 'react';
import { Link } from '@inertiajs/react';
import { hasRoute, safeRoute } from '@/utils/routeUtils';
import { Tooltip } from '@heroui/react';

/**
 * SafeLink - Route-validated Link Component
 * 
 * @param {object} props - Component props
 * @param {string} props.route - Route name (use this OR href, not both)
 * @param {object} props.params - Route parameters (when using route prop)
 * @param {string} props.href - Direct href (when not using route prop)
 * @param {string} props.fallback - Fallback URL if route doesn't exist (default: '#')
 * @param {boolean} props.showTooltipOnDisabled - Show tooltip when link is disabled
 * @param {string} props.disabledMessage - Custom message for disabled tooltip
 * @param {function} props.onInvalidRoute - Callback when route doesn't exist
 * @param {React.ReactNode} props.children - Link content
 * @param {object} props.* - All other Link props
 * 
 * @example
 * // Using route name (recommended)
 * <SafeLink route="employees.show" params={{ employee: 123 }}>
 *   View Employee
 * </SafeLink>
 * 
 * // With fallback
 * <SafeLink route="admin.users" fallback="/dashboard">
 *   Admin Users
 * </SafeLink>
 * 
 * // With disabled state handling
 * <SafeLink 
 *   route="premium.feature" 
 *   showTooltipOnDisabled={true}
 *   disabledMessage="This feature requires premium subscription"
 * >
 *   Premium Feature
 * </SafeLink>
 * 
 * // Direct href (bypasses route validation)
 * <SafeLink href="/dashboard">Dashboard</SafeLink>
 */
const SafeLink = ({
    route: routeName,
    params = {},
    href,
    fallback = '#',
    showTooltipOnDisabled = false,
    disabledMessage = 'This link is currently unavailable',
    onInvalidRoute,
    children,
    className = '',
    ...props
}) => {
    // If href is directly provided, use it (bypass route validation)
    if (href) {
        return (
            <Link href={href} className={className} {...props}>
                {children}
            </Link>
        );
    }

    // If no route name provided, render as span
    if (!routeName) {
        console.warn('SafeLink: No route or href provided');
        return <span className={className}>{children}</span>;
    }

    // Check if route exists
    const routeExists = hasRoute(routeName);

    // Call callback if provided and route doesn't exist
    if (!routeExists && onInvalidRoute) {
        onInvalidRoute(routeName);
    }

    // Get the actual href
    const actualHref = routeExists ? safeRoute(routeName, params, fallback) : fallback;

    // If route doesn't exist and fallback is '#', render as disabled span
    if (!routeExists && fallback === '#') {
        const disabledContent = (
            <span 
                className={`cursor-not-allowed opacity-50 ${className}`}
                onClick={(e) => e.preventDefault()}
            >
                {children}
            </span>
        );

        // Optionally wrap in tooltip
        if (showTooltipOnDisabled) {
            return (
                <Tooltip content={disabledMessage}>
                    {disabledContent}
                </Tooltip>
            );
        }

        return disabledContent;
    }

    // Render normal link
    return (
        <Link href={actualHref} className={className} {...props}>
            {children}
        </Link>
    );
};

/**
 * ConditionalLink - Renders Link only if route exists, otherwise renders children as-is
 * 
 * Useful when you want content to be non-clickable when route doesn't exist
 * but still visible (unlike SafeLink which shows disabled state).
 * 
 * @example
 * <ConditionalLink route="profile" params={{ user: userId }}>
 *   <UserAvatar />
 * </ConditionalLink>
 */
export const ConditionalLink = ({ route: routeName, params = {}, children, ...props }) => {
    if (!routeName || !hasRoute(routeName)) {
        return <>{children}</>;
    }

    return (
        <Link href={safeRoute(routeName, params)} {...props}>
            {children}
        </Link>
    );
};

/**
 * RouterButton - Button that safely navigates using router.visit()
 * 
 * Useful for navigation buttons that should validate routes before attempting navigation.
 * 
 * @example
 * <RouterButton 
 *   route="employees.create" 
 *   color="primary"
 * >
 *   Add Employee
 * </RouterButton>
 */
export const RouterButton = ({
    route: routeName,
    params = {},
    options = {},
    onInvalidRoute,
    children,
    ...buttonProps
}) => {
    const handleClick = () => {
        if (!hasRoute(routeName)) {
            console.error(`Cannot navigate: route "${routeName}" does not exist`);
            if (onInvalidRoute) {
                onInvalidRoute(routeName);
            }
            return;
        }

        try {
            const { router } = require('@inertiajs/react');
            router.visit(safeRoute(routeName, params), options);
        } catch (error) {
            console.error(`Navigation to "${routeName}" failed:`, error);
        }
    };

    return (
        <button {...buttonProps} onClick={handleClick}>
            {children}
        </button>
    );
};

export default SafeLink;
