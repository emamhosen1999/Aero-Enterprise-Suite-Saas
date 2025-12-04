import {
  HomeIcon,
  BuildingOffice2Icon,
  Squares2X2Icon,
  PlusCircleIcon,
  PuzzlePieceIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChartBarSquareIcon,
  LifebuoyIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export const getAdminPages = (auth = null) => {
  console.log('🔍 Admin Pages - Auth Data:', auth);
  console.log('🔍 isPlatformSuperAdmin:', auth?.isPlatformSuperAdmin);
  console.log('🔍 isSuperAdmin:', auth?.isSuperAdmin);
  
  const isSuperAdmin = auth?.isSuperAdmin ?? false;
  const isPlatformSuperAdmin = auth?.isPlatformSuperAdmin ?? false;
  
  console.log('🔍 Final isPlatformSuperAdmin:', isPlatformSuperAdmin);
  console.log('🔍 Final isSuperAdmin:', isSuperAdmin);

  const settingsMenu = [
    { name: 'General', icon: <Cog6ToothIcon className="" />, route: 'admin.settings.index' },
    { name: 'Payment Gateways', icon: <CreditCardIcon className="" />, route: 'admin.settings.payment-gateways' },
    { name: 'Email', icon: <EnvelopeIcon className="" />, route: 'admin.settings.email' },
  ];

  if (isSuperAdmin) {
    settingsMenu.push({ name: 'Platform', icon: <ShieldCheckIcon className="" />, route: 'admin.settings.platform.index' });
  }

  const pages = [
    {
      name: 'Dashboard',
      icon: <HomeIcon className="" />,
      route: 'admin.dashboard',
      priority: 1,
      module: 'admin-core',
    },
    // Tenants - Platform Super Admin Only
    ...(isPlatformSuperAdmin ? [{
      name: 'Tenants',
      icon: <BuildingOffice2Icon className="" />,
      priority: 2,
      module: 'admin-tenants',
      subMenu: [
        { name: 'Directory', icon: <BuildingOffice2Icon className="" />, route: 'admin.tenants.index' },
        { name: 'Create Tenant', icon: <PlusCircleIcon className="" />, route: 'admin.tenants.create' },
      ],
    }] : []),
    // Plans - Platform Super Admin Only
    ...(isPlatformSuperAdmin ? [{
      name: 'Plans',
      icon: <Squares2X2Icon className="" />,
      priority: 3,
      module: 'admin-plans',
      subMenu: [
        { name: 'All Plans', icon: <Squares2X2Icon className="" />, route: 'admin.plans.index' },
        { name: 'Create Plan', icon: <PlusCircleIcon className="" />, route: 'admin.plans.create' },
      ],
    }] : []),
    // Modules - Platform Super Admin Only
    ...(isPlatformSuperAdmin ? [{
      name: 'Modules',
      icon: <PuzzlePieceIcon className="" />,
      priority: 4,
      module: 'admin-modules',
      route: 'admin.modules.index',
    }] : []),
    {
      name: 'Billing',
      icon: <CreditCardIcon className="" />,
      priority: 5,
      module: 'admin-billing',
      subMenu: [
        { name: 'Overview', icon: <CreditCardIcon className="" />, route: 'admin.billing.index' },
        { name: 'Invoices', icon: <DocumentTextIcon className="" />, route: 'admin.billing.invoices' },
      ],
    },
    // Role Management - Platform Super Admin Only
    ...(isPlatformSuperAdmin ? [{
      name: 'Role Management',
      icon: <ShieldCheckIcon className="" />,
      priority: 6,
      module: 'admin-roles',
      route: 'admin.roles.index',
    }] : []),
    // Settings - Platform Super Admin Only
    ...(isPlatformSuperAdmin ? [{
      name: 'Settings',
      icon: <Cog6ToothIcon className="" />,
      priority: 7,
      module: 'admin-settings',
      subMenu: settingsMenu,
    }] : []),
    {
      name: 'Analytics',
      icon: <ChartBarSquareIcon className="" />,
      priority: 8,
      module: 'admin-analytics',
      subMenu: [
        { name: 'Overview', icon: <ChartBarSquareIcon className="" />, route: 'admin.analytics.index' },
        { name: 'Revenue', icon: <CurrencyDollarIcon className="" />, route: 'admin.analytics.revenue' },
        { name: 'Usage', icon: <ChartBarSquareIcon className="" />, route: 'admin.analytics.usage' },
      ],
    },
    {
      name: 'Support',
      icon: <LifebuoyIcon className="" />,
      priority: 9,
      module: 'admin-support',
      route: 'admin.support.index',
    },
  ];

  return pages;
};
