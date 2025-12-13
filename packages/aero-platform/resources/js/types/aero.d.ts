/**
 * Aero SaaS Type Definitions
 * 
 * TypeScript interfaces for the SaaS platform.
 * These types are used across aero-core and aero-platform packages.
 */

import { PageProps as InertiaPageProps } from '@inertiajs/react';

/**
 * Aero platform configuration shared via Inertia props
 */
export interface AeroConfig {
    /**
     * The runtime mode of the application
     * - 'saas': Multi-tenant SaaS with subscription-based access
     * - 'standalone': Single-tenant with full module access
     */
    mode: 'saas' | 'standalone';
    
    /**
     * Array of subscribed module codes (SaaS mode only)
     * e.g., ['hrm', 'crm', 'project']
     */
    subscriptions: string[];
}

/**
 * User model shared via Inertia props
 */
export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    
    /** Roles assigned to the user */
    roles?: Role[];
    
    /** Direct module access tree */
    module_access?: ModuleAccessTree;
    
    /** Lookup tables for module access */
    modules_lookup?: Record<string, string>;
    sub_modules_lookup?: Record<string, string>;
    components_lookup?: Record<string, string>;
    actions_lookup?: Record<string, string>;
    
    /** Accessible modules with details */
    accessible_modules?: AccessibleModule[];
    
    /** Super admin flags */
    is_super_admin?: boolean;
    is_platform_super_admin?: boolean;
    is_tenant_super_admin?: boolean;
}

/**
 * Role model
 */
export interface Role {
    id: number;
    name: string;
    guard_name?: string;
}

/**
 * Module access tree structure
 */
export interface ModuleAccessTree {
    modules?: number[];
    sub_modules?: number[];
    components?: number[];
    actions?: ActionAccess[];
}

/**
 * Action access with scope
 */
export interface ActionAccess {
    id: number;
    scope?: 'all' | 'department' | 'team' | 'own';
}

/**
 * Accessible module details
 */
export interface AccessibleModule {
    id: number;
    code: string;
    name: string;
}

/**
 * Authentication object shared via Inertia props
 */
export interface Auth {
    user: User | null;
    permissions?: string[];
    roles?: string[];
    
    /** Super admin status flags */
    isPlatformSuperAdmin?: boolean;
    isTenantSuperAdmin?: boolean;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
}

/**
 * Navigation item structure
 */
export interface NavigationItem {
    /** Display name */
    name: string;
    
    /** Route path or URL */
    path?: string;
    href?: string;
    
    /** Icon name (HeroIcon) or React component */
    icon?: string | React.ComponentType;
    
    /** Module code for access checking */
    module?: string;
    
    /** Full access path (module.submodule.component) */
    access?: string;
    access_key?: string;
    
    /** Child navigation items */
    children?: NavigationItem[];
    
    /** Menu category */
    category?: 'main' | 'settings';
    
    /** Sort priority */
    priority?: number;
    
    /** Badge content */
    badge?: string | number;
}

/**
 * Application settings
 */
export interface AppConfig {
    name: string;
    logo?: string;
    favicon?: string;
    theme?: string;
    locale?: string;
}

/**
 * Extended Page Props for Aero SaaS applications
 * 
 * Usage in React components:
 *   const { auth, aero } = usePage<AeroPageProps>().props;
 */
export interface AeroPageProps extends InertiaPageProps {
    /** Authentication data */
    auth: Auth;
    
    /** Aero SaaS configuration */
    aero: AeroConfig;
    
    /** Application settings */
    app?: AppConfig;
    
    /** Current URL path */
    url?: string;
    
    /** Navigation items from backend */
    navigation?: NavigationItem[];
    
    /** Flash messages */
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    
    /** CSRF token */
    csrf_token?: string;
}

/**
 * Module subscription status
 */
export interface ModuleSubscription {
    code: string;
    name: string;
    isSubscribed: boolean;
    expiresAt?: string;
}

/**
 * Tenant information (SaaS mode)
 */
export interface Tenant {
    id: string;
    name: string;
    domain?: string;
    plan?: Plan;
    subscriptions?: Subscription[];
}

/**
 * Subscription plan
 */
export interface Plan {
    id: number;
    name: string;
    code: string;
    modules: string[];
    price?: number;
    billingCycle?: 'monthly' | 'yearly';
}

/**
 * Tenant subscription
 */
export interface Subscription {
    id: number;
    planId: number;
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startsAt: string;
    endsAt?: string;
    trialEndsAt?: string;
}

/**
 * SaaS Access hook return type
 */
export interface SaaSAccessHook {
    mode: 'saas' | 'standalone';
    isSaaSMode: boolean;
    isStandaloneMode: boolean;
    subscriptions: string[];
    hasSubscription: (moduleCode: string) => boolean;
    hasAccess: (path: string) => boolean;
    canAccessModule: (moduleCode: string) => boolean;
    filterNavigation: (navItems: NavigationItem[]) => NavigationItem[];
    getLockedModules: () => string[];
    getUnsubscribedModules: (allModules: string[]) => string[];
}

/**
 * Module gate props
 */
export interface ModuleGateProps {
    module: string;
    moduleName?: string;
    children: React.ReactNode;
    lockedContent?: React.ReactNode;
    checkRBAC?: boolean;
    onLocked?: (info: { module: string; reason: 'subscription' | 'rbac' }) => void;
}

/**
 * Module access state from useModuleAccess hook
 */
export interface ModuleAccessState {
    isLocked: boolean;
    isSubscribed: boolean;
    hasRBACAccess: boolean;
    reason: 'subscription' | 'rbac' | null;
}
