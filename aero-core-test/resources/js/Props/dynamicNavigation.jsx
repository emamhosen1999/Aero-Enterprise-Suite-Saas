import {
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  UsersIcon,
  FolderIcon,
  ChartBarSquareIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  UserIcon,
  ArchiveBoxIcon,
  AcademicCapIcon,
  TruckIcon,
  ShoppingCartIcon,
  TicketIcon,
  BeakerIcon,
  CubeIcon,
  ScaleIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

/**
 * Icon mapping from database icon names to React components
 * The database stores icon names like 'HomeIcon', 'UserGroupIcon', etc.
 * This map converts them to actual Hero Icon components
 */
const iconMap = {
  // Core icons
  'HomeIcon': <HomeIcon className="" />,
  'UserGroupIcon': <UserGroupIcon className="" />,
  'CalendarDaysIcon': <CalendarDaysIcon className="" />,
  'Cog6ToothIcon': <Cog6ToothIcon className="" />,
  'CalendarIcon': <CalendarIcon className="" />,
  'ArrowRightOnRectangleIcon': <ArrowRightOnRectangleIcon className="" />,
  'EnvelopeIcon': <EnvelopeIcon className="" />,
  'DocumentTextIcon': <DocumentTextIcon className="" />,
  'BriefcaseIcon': <BriefcaseIcon className="" />,
  'UsersIcon': <UsersIcon className="" />,
  'FolderIcon': <FolderIcon className="" />,
  'ChartBarSquareIcon': <ChartBarSquareIcon className="" />,
  'CreditCardIcon': <CreditCardIcon className="" />,
  'ShoppingBagIcon': <ShoppingBagIcon className="" />,
  'BuildingOffice2Icon': <BuildingOffice2Icon className="" />,
  'BanknotesIcon': <BanknotesIcon className="" />,
  'WrenchScrewdriverIcon': <WrenchScrewdriverIcon className="" />,
  'ClipboardDocumentCheckIcon': <ClipboardDocumentCheckIcon className="" />,
  'DocumentDuplicateIcon': <DocumentDuplicateIcon className="" />,
  'ShieldCheckIcon': <ShieldCheckIcon className="" />,
  'ComputerDesktopIcon': <ComputerDesktopIcon className="" />,
  'PhoneIcon': <PhoneIcon className="" />,
  'UserIcon': <UserIcon className="" />,
  'ArchiveBoxIcon': <ArchiveBoxIcon className="" />,
  'AcademicCapIcon': <AcademicCapIcon className="" />,
  'TruckIcon': <TruckIcon className="" />,
  'ShoppingCartIcon': <ShoppingCartIcon className="" />,
  'TicketIcon': <TicketIcon className="" />,
  'BeakerIcon': <BeakerIcon className="" />,
  'CubeIcon': <CubeIcon className="" />,
  'ScaleIcon': <ScaleIcon className="" />,
  'BuildingStorefrontIcon': <BuildingStorefrontIcon className="" />,
  'ArrowPathIcon': <ArrowPathIcon className="" />,
  'CurrencyDollarIcon': <CurrencyDollarIcon className="" />,
  'ClockIcon': <ClockIcon className="" />,
  'MapPinIcon': <MapPinIcon className="" />,
};

/**
 * Default icons for modules when no icon is specified in database
 */
const defaultModuleIcons = {
  'core': <HomeIcon className="" />,
  'self-service': <UserGroupIcon className="" />,
  'hrm': <UserGroupIcon className="" />,
  'events': <CalendarIcon className="" />,
  'project-management': <BriefcaseIcon className="" />,
  'dms': <FolderIcon className="" />,
  'crm': <UserIcon className="" />,
  'fms': <BanknotesIcon className="" />,
  'pos': <ShoppingCartIcon className="" />,
  'ims': <ArchiveBoxIcon className="" />,
  'lms': <AcademicCapIcon className="" />,
  'scm': <TruckIcon className="" />,
  'sales': <ShoppingBagIcon className="" />,
  'helpdesk': <TicketIcon className="" />,
  'assets': <ComputerDesktopIcon className="" />,
  'compliance': <ShieldCheckIcon className="" />,
  'procurement': <ShoppingBagIcon className="" />,
  'quality': <BeakerIcon className="" />,
  'analytics': <ChartBarSquareIcon className="" />,
  'admin': <Cog6ToothIcon className="" />,
};

/**
 * Resolve icon from database value to React component
 * @param {string|null} iconName - Icon name from database
 * @param {string} fallbackCode - Module/component code for default icon lookup
 * @returns {JSX.Element} - React icon component
 */
const resolveIcon = (iconName, fallbackCode = 'core') => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return defaultModuleIcons[fallbackCode] || <CubeIcon className="" />;
};

/**
 * Convert a component from database format to navigation format
 * @param {Object} component - Component from database
 * @returns {Object} - Navigation item
 */
const convertComponent = (component) => ({
  name: component.name,
  icon: resolveIcon(component.icon, component.code),
  route: component.route,
  code: component.code,
  type: component.type,
});

/**
 * Convert a sub-module from database format to navigation format
 * @param {Object} subModule - Sub-module from database
 * @returns {Object} - Navigation item with nested subMenu
 */
const convertSubModule = (subModule) => {
  const item = {
    name: subModule.name,
    icon: resolveIcon(subModule.icon, subModule.code),
    code: subModule.code,
    priority: subModule.priority,
  };

  // If sub-module has a direct route and no components, use the route
  if (subModule.route && (!subModule.components || subModule.components.length === 0)) {
    item.route = subModule.route;
  }

  // If sub-module has components, create a nested subMenu
  if (subModule.components && subModule.components.length > 0) {
    item.subMenu = subModule.components.map(convertComponent);
  } else if (subModule.route) {
    // Sub-module with direct route acts as a single menu item
    item.route = subModule.route;
  }

  return item;
};

/**
 * Convert a module from database format to navigation format
 * @param {Object} module - Module from database (via getNavigationForUser())
 * @returns {Object} - Navigation item ready for sidebar
 */
const convertModule = (module) => {
  const navItem = {
    name: module.name,
    icon: resolveIcon(module.icon, module.code),
    priority: module.priority,
    module: module.code,
    code: module.code,
    category: module.category,
  };

  // Check if module has sub-modules or components
  const hasSubModules = module.subModules && module.subModules.length > 0;
  const hasComponents = module.components && module.components.length > 0;

  if (hasSubModules || hasComponents) {
    navItem.subMenu = [];

    // Add sub-modules to menu
    if (hasSubModules) {
      module.subModules.forEach(subModule => {
        navItem.subMenu.push(convertSubModule(subModule));
      });
    }

    // Add module-level components to menu
    if (hasComponents) {
      module.components.forEach(component => {
        navItem.subMenu.push(convertComponent(component));
      });
    }
  } else if (module.route_prefix) {
    // Module with no children but has a route
    navItem.route = module.route_prefix;
  }

  return navItem;
};

/**
 * Main function: Get pages/navigation from Module Permission Registry
 * This replaces the hardcoded getPages() function
 * 
 * @param {Object} auth - Auth object from Inertia's usePage().props
 * @returns {Array} - Navigation structure compatible with Sidebar/Header
 */
export const getDynamicPages = (auth = null) => {
  // Get accessible modules from auth - this is populated by HandleInertiaRequests
  const accessibleModules = auth?.accessibleModules || [];

  if (!accessibleModules.length) {
    return [];
  }

  // Convert each module to navigation format
  const navigation = accessibleModules
    .map(convertModule)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return navigation;
};

/**
 * Get pages by module code for better organization
 * @param {Object} auth - Auth object from Inertia
 * @returns {Object} - Modules grouped by code
 */
export const getDynamicPagesByModule = (auth) => {
  const pages = getDynamicPages(auth);
  const modules = {};

  pages.forEach(page => {
    const module = page.module || 'core';
    if (!modules[module]) {
      modules[module] = [];
    }
    modules[module].push(page);
  });

  return modules;
};

/**
 * Get pages sorted by priority
 * @param {Object} auth - Auth object from Inertia
 * @returns {Array} - Pages sorted by priority
 */
export const getDynamicPagesByPriority = (auth) => {
  return getDynamicPages(auth).sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

/**
 * Get navigation breadcrumb path for a given route
 * @param {string} currentRoute - Current route name
 * @param {Object} auth - Auth object from Inertia
 * @returns {Array} - Breadcrumb path
 */
export const getDynamicNavigationPath = (currentRoute, auth) => {
  const pages = getDynamicPages(auth);

  const findPageInMenu = (menuItems, targetRoute, currentPath = []) => {
    for (const item of menuItems) {
      const newPath = [...currentPath, item];
      if (item.route === targetRoute) {
        return newPath;
      }
      if (item.subMenu) {
        const result = findPageInMenu(item.subMenu, targetRoute, newPath);
        if (result) return result;
      }
    }
    return null;
  };

  return findPageInMenu(pages, currentRoute) || [];
};

/**
 * Check if a user has access to a specific route based on Module Registry
 * @param {string} routeName - Route name to check
 * @param {Object} auth - Auth object from Inertia
 * @returns {boolean} - True if user has access
 */
export const canAccessRoute = (routeName, auth) => {
  const pages = getDynamicPages(auth);

  const findRoute = (menuItems) => {
    for (const item of menuItems) {
      if (item.route === routeName) {
        return true;
      }
      if (item.subMenu && findRoute(item.subMenu)) {
        return true;
      }
    }
    return false;
  };

  return findRoute(pages);
};

/**
 * Get flat list of all accessible routes
 * @param {Object} auth - Auth object from Inertia
 * @returns {Array<string>} - List of route names
 */
export const getAccessibleRoutes = (auth) => {
  const routes = [];

  const extractRoutes = (menuItems) => {
    for (const item of menuItems) {
      if (item.route) {
        routes.push(item.route);
      }
      if (item.subMenu) {
        extractRoutes(item.subMenu);
      }
    }
  };

  extractRoutes(getDynamicPages(auth));
  return routes;
};

export default getDynamicPages;
