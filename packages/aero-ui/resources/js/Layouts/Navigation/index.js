/**
 * Navigation System - Central Exports
 * 
 * A complete, modular navigation system with:
 * - 3D styling and animations
 * - Responsive design (mobile/tablet/desktop)
 * - Infinite nested menu support
 * - Centralized state management
 * - Reusable components
 */

// Core Components
export { default as Sidebar } from './Sidebar';
export { default as Header } from './Header';
export { default as MenuItem3D } from './MenuItem3D';

// Context Provider & Hook
export { 
  NavigationProvider, 
  useNavigation, 
  motion3DConfig 
} from './NavigationProvider';

// Utilities
export {
  hasRoute,
  getMenuItemUrl,
  navigateToItem,
  isItemActive,
  getMenuItemId,
  filterMenuItems,
  highlightMatch,
  groupMenuItems,
  get3DTransform,
  get3DContainerStyle,
  get3DHoverStyle,
} from './navigationUtils.jsx';

/**
 * Quick Start Guide:
 * 
 * 1. Wrap your app with NavigationProvider:
 * 
 *    import { NavigationProvider } from '@/Layouts/Navigation';
 *    
 *    function App({ children }) {
 *      return (
 *        <NavigationProvider user={auth.user} activePath={currentPath}>
 *          {children}
 *        </NavigationProvider>
 *      );
 *    }
 * 
 * 2. Use Sidebar and Header components:
 * 
 *    import { Sidebar, Header } from '@/Layouts/Navigation';
 *    
 *    function Layout({ pages }) {
 *      return (
 *        <div className="flex min-h-screen">
 *          <Sidebar pages={pages} />
 *          <div className="flex-1 flex flex-col">
 *            <Header pages={pages} />
 *            <main>{children}</main>
 *          </div>
 *        </div>
 *      );
 *    }
 * 
 * 3. Access navigation state with useNavigation:
 * 
 *    import { useNavigation } from '@/Layouts/Navigation';
 *    
 *    function MyComponent() {
 *      const { 
 *        isMobile, 
 *        sidebarOpen, 
 *        toggleSidebar 
 *      } = useNavigation();
 *      
 *      return (
 *        <button onClick={toggleSidebar}>
 *          {sidebarOpen ? 'Close' : 'Open'} Menu
 *        </button>
 *      );
 *    }
 * 
 * 4. Menu item structure:
 * 
 *    const menuItem = {
 *      name: 'Dashboard',           // Required
 *      route: 'dashboard',          // Named route (preferred)
 *      path: '/dashboard',          // OR direct path
 *      icon: <HomeIcon />,          // Optional icon
 *      badge: 5,                    // Optional badge count
 *      subMenu: [                   // Optional nested items
 *        { name: 'Overview', route: 'dashboard.overview' },
 *        { name: 'Analytics', route: 'dashboard.analytics' },
 *      ],
 *      permission: 'view-dashboard', // Optional permission check
 *      hidden: false,               // Optional visibility flag
 *    };
 */
