/**
 * Platform Admin Navigation Pages
 * 
 * This file defines the navigation structure for Platform Admins (landlord context).
 * The structure mirrors config/modules.php platform_hierarchy.
 * 
 * Access is controlled using the Role-Module Access system:
 * - Each nav item specifies `access` path: "module.submodule.component.action"
 * - Access is checked dynamically using hasAccess() from moduleAccessUtils.js
 * - Super Admin bypasses all access checks
 */

import {
  HomeIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BellIcon,
  FolderOpenIcon,
  ClipboardDocumentListIcon,
  Cog8ToothIcon,
  CodeBracketIcon,
  ChartBarIcon,
  HeartIcon,
  GlobeAltIcon,
  CircleStackIcon,
  KeyIcon,
  ComputerDesktopIcon,
  CubeIcon,
  RectangleStackIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  BanknotesIcon,
  MegaphoneIcon,
  DocumentDuplicateIcon,
  SpeakerWaveIcon,
  ServerIcon,
  ChartPieIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  CommandLineIcon,
  PaintBrushIcon,
  LanguageIcon,
  EnvelopeIcon,
  PuzzlePieceIcon,
  ArrowsPointingOutIcon,
  WrenchScrewdriverIcon,
  ChartBarSquareIcon,
  CurrencyDollarIcon,
  LifebuoyIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

import { hasAccess, isSuperAdmin } from '@/utils/moduleAccessUtils';

/**
 * Get Platform Admin navigation pages
 * 
 * @param {Object} auth - Auth object from Inertia usePage().props
 * @returns {Array} Navigation pages array filtered by user's module access
 */
export const getAdminPages = (auth = null) => {
  const user = auth?.user || null;
  // Check for super admin status via user object or auth flags
  const userIsSuperAdmin = user ? isSuperAdmin(user) : false;
  const isPlatformSuperAdmin = auth?.isPlatformSuperAdmin || auth?.isSuperAdmin || userIsSuperAdmin;

  /**
   * Platform Navigation Structure
   * Matches config/modules.php platform_hierarchy
   */
  const pages = [
    /*
    |--------------------------------------------------------------------------
    | 1. Dashboard Module (platform-dashboard)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Dashboard',
      icon: <HomeIcon className="" />,
      module: 'platform-dashboard',
      access: 'platform-dashboard',
      route: 'admin.dashboard',
      priority: 1,
      subMenu: [
        {
          name: 'Platform Overview',
          icon: <ChartBarIcon className="" />,
          access: 'platform-dashboard.overview',
          route: 'admin.dashboard',
        },
        {
          name: 'System Health',
          icon: <HeartIcon className="" />,
          access: 'platform-dashboard.system-health',
          route: 'admin.system-health',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 2. Tenant Management Module (tenants)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Tenants',
      icon: <BuildingOffice2Icon className="" />,
      module: 'tenants',
      access: 'tenants',
      priority: 2,
      subMenu: [
        {
          name: 'All Tenants',
          icon: <BuildingOffice2Icon className="" />,
          access: 'tenants.tenant-list',
          route: 'admin.tenants.index',
        },
        {
          name: 'Create Tenant',
          icon: <PlusCircleIcon className="" />,
          access: 'tenants.tenant-list.tenant-management.create',
          route: 'admin.tenants.create',
        },
        {
          name: 'Domain Management',
          icon: <GlobeAltIcon className="" />,
          access: 'tenants.domains',
          route: 'admin.tenants.domains',
        },
        {
          name: 'Database Management',
          icon: <CircleStackIcon className="" />,
          access: 'tenants.databases',
          route: 'admin.tenants.databases',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 3. Users & Authentication Module (platform-users)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Users & Auth',
      icon: <UsersIcon className="" />,
      module: 'platform-users',
      access: 'platform-users',
      priority: 3,
      subMenu: [
        {
          name: 'Platform Administrators',
          icon: <UsersIcon className="" />,
          access: 'platform-users.admin-users',
          route: 'admin.users.index',
        },
        {
          name: 'Authentication Settings',
          icon: <KeyIcon className="" />,
          access: 'platform-users.authentication',
          route: 'admin.authentication',
        },
        {
          name: 'Active Sessions',
          icon: <ComputerDesktopIcon className="" />,
          access: 'platform-users.sessions',
          route: 'admin.sessions',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 4. Roles & Access Control Module (platform-roles)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Access Control',
      icon: <ShieldCheckIcon className="" />,
      module: 'platform-roles',
      access: 'platform-roles',
      priority: 4,
      subMenu: [
        {
          name: 'Role Management',
          icon: <ShieldCheckIcon className="" />,
          access: 'platform-roles.role-management',
          route: 'admin.roles.index',
        },
        {
          name: 'Module Access',
          icon: <CubeIcon className="" />,
          access: 'platform-roles.module-permissions',
          route: 'admin.modules.index',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 5. Subscriptions & Billing Module (subscriptions)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Billing',
      icon: <CreditCardIcon className="" />,
      module: 'subscriptions',
      access: 'subscriptions',
      priority: 5,
      subMenu: [
        {
          name: 'Plans',
          icon: <RectangleStackIcon className="" />,
          access: 'subscriptions.plans',
          route: 'admin.plans.index',
        },
        {
          name: 'Create Plan',
          icon: <PlusCircleIcon className="" />,
          access: 'subscriptions.plans.plan-list.create',
          route: 'admin.plans.create',
        },
        {
          name: 'Subscriptions',
          icon: <ArrowPathIcon className="" />,
          access: 'subscriptions.tenant-subscriptions',
          route: 'admin.billing.subscriptions',
        },
        {
          name: 'Invoices',
          icon: <DocumentTextIcon className="" />,
          access: 'subscriptions.invoices',
          route: 'admin.billing.invoices',
        },
        {
          name: 'Payment Gateways',
          icon: <BanknotesIcon className="" />,
          access: 'subscriptions.payment-gateways',
          route: 'admin.settings.payment-gateways',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 6. Notifications Module (notifications)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Notifications',
      icon: <BellIcon className="" />,
      module: 'notifications',
      access: 'notifications',
      priority: 6,
      subMenu: [
        {
          name: 'Channels',
          icon: <MegaphoneIcon className="" />,
          access: 'notifications.channels',
          route: 'admin.notifications.channels',
        },
        {
          name: 'Templates',
          icon: <DocumentDuplicateIcon className="" />,
          access: 'notifications.templates',
          route: 'admin.notifications.templates',
        },
        {
          name: 'Broadcasts',
          icon: <SpeakerWaveIcon className="" />,
          access: 'notifications.broadcasts',
          route: 'admin.notifications.broadcasts',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 7. File Manager Module (file-manager)
    |--------------------------------------------------------------------------
    */
    {
      name: 'File Manager',
      icon: <FolderOpenIcon className="" />,
      module: 'file-manager',
      access: 'file-manager',
      priority: 7,
      subMenu: [
        {
          name: 'Storage',
          icon: <ServerIcon className="" />,
          access: 'file-manager.storage',
          route: 'admin.files.storage',
        },
        {
          name: 'Quotas',
          icon: <ChartPieIcon className="" />,
          access: 'file-manager.quotas',
          route: 'admin.files.quotas',
        },
        {
          name: 'Media Library',
          icon: <PhotoIcon className="" />,
          access: 'file-manager.media-library',
          route: 'admin.files.media',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 8. Audit & Activity Logs Module (audit-logs)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Audit Logs',
      icon: <ClipboardDocumentListIcon className="" />,
      module: 'audit-logs',
      access: 'audit-logs',
      priority: 8,
      subMenu: [
        {
          name: 'Activity Logs',
          icon: <ClipboardDocumentListIcon className="" />,
          access: 'audit-logs.activity-logs',
          route: 'admin.logs.activity',
        },
        {
          name: 'Security Logs',
          icon: <ShieldExclamationIcon className="" />,
          access: 'audit-logs.security-logs',
          route: 'admin.logs.security',
        },
        {
          name: 'System Logs',
          icon: <CommandLineIcon className="" />,
          access: 'audit-logs.system-logs',
          route: 'admin.logs.system',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 9. System Settings Module (system-settings)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Settings',
      icon: <Cog8ToothIcon className="" />,
      module: 'system-settings',
      access: 'system-settings',
      priority: 9,
      subMenu: [
        {
          name: 'General',
          icon: <Cog8ToothIcon className="" />,
          access: 'system-settings.general-settings',
          route: 'admin.settings.index',
        },
        {
          name: 'Branding',
          icon: <PaintBrushIcon className="" />,
          access: 'system-settings.branding',
          route: 'admin.settings.branding',
        },
        {
          name: 'Localization',
          icon: <LanguageIcon className="" />,
          access: 'system-settings.localization',
          route: 'admin.settings.localization',
        },
        {
          name: 'Email',
          icon: <EnvelopeIcon className="" />,
          access: 'system-settings.email-settings',
          route: 'admin.settings.email',
        },
        {
          name: 'Integrations',
          icon: <PuzzlePieceIcon className="" />,
          access: 'system-settings.integrations',
          route: 'admin.settings.integrations',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | 10. Developer Tools Module (developer-tools)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Developer',
      icon: <CodeBracketIcon className="" />,
      module: 'developer-tools',
      access: 'developer-tools',
      priority: 10,
      subMenu: [
        {
          name: 'API Management',
          icon: <KeyIcon className="" />,
          access: 'developer-tools.api-management',
          route: 'admin.developer.api',
        },
        {
          name: 'Webhooks',
          icon: <ArrowsPointingOutIcon className="" />,
          access: 'developer-tools.webhooks',
          route: 'admin.developer.webhooks',
        },
        {
          name: 'Debug Tools',
          icon: <WrenchScrewdriverIcon className="" />,
          access: 'developer-tools.debug-tools',
          route: 'admin.developer.debug',
        },
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | Quick Access Items (Always visible based on access)
    |--------------------------------------------------------------------------
    */
    {
      name: 'Analytics',
      icon: <ChartBarSquareIcon className="" />,
      module: 'platform-dashboard',
      access: 'platform-dashboard.overview',
      priority: 11,
      subMenu: [
        {
          name: 'Overview',
          icon: <ChartBarSquareIcon className="" />,
          access: 'platform-dashboard.overview',
          route: 'admin.analytics.index',
        },
        {
          name: 'Revenue',
          icon: <CurrencyDollarIcon className="" />,
          access: 'subscriptions.invoices',
          route: 'admin.analytics.revenue',
        },
        {
          name: 'Usage',
          icon: <ChartBarSquareIcon className="" />,
          access: 'platform-dashboard.overview',
          route: 'admin.analytics.usage',
        },
      ],
    },
    {
      name: 'Support',
      icon: <LifebuoyIcon className="" />,
      module: 'platform-dashboard',
      access: 'platform-dashboard',
      priority: 12,
      route: 'admin.support.index',
    },
  ];

  // Super Admin sees all items - no filtering needed
  if (isPlatformSuperAdmin) {
    return pages.sort((a, b) => a.priority - b.priority);
  }

  // Filter pages based on user's module access
  const filteredPages = pages.filter(page => {
    // Check module-level access
    if (page.access) {
      return hasAccess(page.access, auth);
    }
    if (page.module) {
      return hasAccess(page.module, auth);
    }
    return true;
  }).map(page => {
    // Filter submenus based on access
    if (page.subMenu && page.subMenu.length > 0) {
      const filteredSubMenu = page.subMenu.filter(item => {
        if (item.access) {
          return hasAccess(item.access, auth);
        }
        return true;
      });

      // Only include the page if it has accessible sub-items or a direct route
      if (filteredSubMenu.length === 0 && !page.route) {
        return null;
      }

      return {
        ...page,
        subMenu: filteredSubMenu,
      };
    }
    return page;
  }).filter(Boolean);

  return filteredPages.sort((a, b) => a.priority - b.priority);
};

/**
 * Check if user has access to a specific admin page/action
 * 
 * Usage in components:
 * if (canAccessAdminPage('tenants.tenant-list.tenant-management.create', auth)) { ... }
 * 
 * @param {string} accessPath - Full access path (e.g., 'tenants.tenant-list.tenant-management.create')
 * @param {Object} auth - Auth object from Inertia usePage().props
 * @returns {boolean} True if user has access
 */
export const canAccessAdminPage = (accessPath, auth = null) => {
  return hasAccess(accessPath, auth);
};

/**
 * Check if user can perform admin action
 * 
 * Usage:
 * if (canAdminAction('tenants', 'create', auth)) { ... }
 * if (canAdminAction('platform-roles', 'view', auth)) { ... }
 * 
 * @param {string} module - Module code
 * @param {string} action - Action code (view, create, update, delete, etc.)
 * @param {Object} auth - Auth object
 * @returns {boolean}
 */
export const canAdminAction = (module, action, auth = null) => {
  // Common patterns for admin actions
  const accessPaths = [
    `${module}.${action}`,
    `${module}`,
  ];

  return accessPaths.some(path => hasAccess(path, auth));
};

export default getAdminPages;
