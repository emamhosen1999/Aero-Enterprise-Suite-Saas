/**
 * NavigationProvider - Central state management for navigation system
 * 
 * Provides:
 * - Sidebar open/collapsed state
 * - Mobile drawer state
 * - Active menu tracking
 * - Submenu expansion state
 * - Theme-aware 3D motion configuration
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { getIcon } from '@/Configs/navigationUtils.jsx';
import { getMenuItemId } from './navigationUtils.jsx';

// Navigation Context
const NavigationContext = createContext(null);

// Storage keys
const STORAGE_KEYS = {
  SIDEBAR_OPEN: 'nav_sidebar_open',
  SIDEBAR_COLLAPSED: 'nav_sidebar_collapsed',
  EXPANDED_MENUS: 'nav_expanded_menus',
};

/**
 * Custom hook to use navigation context
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

/**
 * 3D Motion configuration
 */
export const motion3DConfig = {
  perspective: {
    subtle: '1000px',
    moderate: '800px',
    dramatic: '600px',
  },
  
  depths: {
    surface: 0,
    raised: 4,
    elevated: 8,
    floating: 16,
    modal: 24,
  },
  
  transforms: {
    idle: {
      rotateX: 0,
      rotateY: 0,
      translateZ: 0,
      scale: 1,
    },
    hover: {
      rotateX: -2,
      rotateY: 0,
      translateZ: 8,
      translateY: -2,
      scale: 1.01,
    },
    active: {
      rotateX: 0,
      rotateY: 0,
      translateZ: 4,
      scale: 1,
    },
    pressed: {
      rotateX: 0,
      rotateY: 0,
      translateZ: 2,
      scale: 0.98,
    },
  },
  
  springs: {
    gentle: { type: 'spring', stiffness: 300, damping: 30 },
    snappy: { type: 'spring', stiffness: 400, damping: 25 },
    bouncy: { type: 'spring', stiffness: 500, damping: 20 },
  },
  
  shadows: {
    none: 'none',
    sm: '0 2px 8px -2px rgba(0,0,0,0.1)',
    md: '0 4px 15px -3px rgba(0,0,0,0.1)',
    lg: '0 8px 25px -5px rgba(0,0,0,0.15)',
    xl: '0 12px 35px -8px rgba(0,0,0,0.2)',
    glow: (color) => `0 0 20px ${color}40, 0 4px 15px -3px ${color}30`,
  },
};

/**
 * NavigationProvider Component
 */
/**
 * Convert backend nav item (from NavigationRegistry) to the format
 * consumed by Sidebar/Header/MenuItem3D (which use `subMenu` and `icon` element).
 */
const convertNavItem = (item) => {
  const converted = {
    ...item,
    icon: item.icon ? getIcon(item.icon) : null,
    path: item.path ?? null,
    subMenu: (item.children ?? []).map(convertNavItem),
  };
  delete converted.children;
  return converted;
};

export const NavigationProvider = ({ 
  children,
  defaultSidebarOpen = true,
  defaultCollapsed = false,
}) => {
  const { url, props } = usePage();
  const { auth, navigation: rawNavigation, userNavMetadata } = props;

  // Convert backend nav tree → sidebar format (icon strings → React elements, children → subMenu)
  const navItems = useMemo(() => {
    if (!rawNavigation || !Array.isArray(rawNavigation)) return [];
    return rawNavigation.map(convertNavItem);
  }, [rawNavigation]);
  
  // ===== CORE STATE =====
  
  // Sidebar visibility (open/closed for mobile)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultSidebarOpen;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
      return stored !== null ? JSON.parse(stored) : defaultSidebarOpen;
    } catch {
      return defaultSidebarOpen;
    }
  });
  
  // Sidebar mode (collapsed = icon only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return defaultCollapsed;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
      return stored !== null ? JSON.parse(stored) : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });
  
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Expanded menu items (for submenus)
  const [expandedMenus, setExpandedMenus] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPANDED_MENUS);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  // Active page path — always normalized (no query string, no host)
  const [activePath, setActivePath] = useState(() => {
    if (!url) return '/';
    return url.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  });
  
  // Search term for filtering menus
  const [searchTerm, setSearchTerm] = useState('');
  
  // ===== RESPONSIVE STATE =====
  
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Update responsive state on window resize
  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    
    updateResponsive();
    window.addEventListener('resize', updateResponsive);
    return () => window.removeEventListener('resize', updateResponsive);
  }, []);
  
  // ===== PERSISTENCE =====
  
  // Persist sidebar state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, JSON.stringify(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);
  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);
  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPANDED_MENUS, JSON.stringify([...expandedMenus]));
    } catch {}
  }, [expandedMenus]);
  
  // ===== URL SYNC =====
  
  // Update active path when URL changes — strip query string
  useEffect(() => {
    const clean = (url || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    setActivePath(clean);
  }, [url]);
  
  // ===== ACTIONS =====
  
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(prev => !prev);
    } else {
      setSidebarOpen(prev => !prev);
    }
  }, [isMobile]);
  
  const openSidebar = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);
  
  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);
  
  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  
  const toggleMenu = useCallback((menuId) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  }, []);
  
  const expandMenu = useCallback((menuId) => {
    setExpandedMenus(prev => new Set([...prev, menuId]));
  }, []);
  
  const collapseMenu = useCallback((menuId) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      next.delete(menuId);
      return next;
    });
  }, []);
  
  const collapseAllMenus = useCallback(() => {
    setExpandedMenus(new Set());
  }, []);
  
  const expandParentMenus = useCallback((targetPath, menuItems) => {
    // Helper to generate ID consistent with getMenuItemId
    const findParents = (items, path, parentId = 'main', parents = []) => {
      for (const item of items) {
        const itemPath = item.path || (item.route ? `/${item.route}` : null);
        const itemId = getMenuItemId(item, parentId);
        const currentParents = [...parents, itemId];
        
        if (itemPath === path) {
          return currentParents.slice(0, -1);
        }
        
        if (item.subMenu || item.children) {
          const found = findParents(item.subMenu || item.children, path, itemId, currentParents);
          if (found) return found;
        }
      }
      return null;
    };
    
    const parents = findParents(menuItems, targetPath);
    if (parents && parents.length > 0) {
      setExpandedMenus(prev => new Set([...prev, ...parents]));
    }
  }, []);
  
  const isMenuExpanded = useCallback((menuId) => {
    return expandedMenus.has(menuId);
  }, [expandedMenus]);
  
  const isPathActive = useCallback((path) => {
    if (!path) return false;
    return activePath === path || activePath.startsWith(path + '/');
  }, [activePath]);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  // ===== CONTEXT VALUE =====
  
  const value = useMemo(() => ({  
    // Navigation data (from backend NavigationRegistry via Inertia shared props)
    navItems,
    // State
    sidebarOpen,
    sidebarCollapsed,
    mobileDrawerOpen,
    expandedMenus,
    activePath,
    searchTerm,
    
    // Responsive
    isMobile,
    isTablet,
    isDesktop,
    
    // Auth
    user: auth?.user,
    permissions: auth?.permissions,
    userNavMetadata: userNavMetadata ?? null,
    
    // Actions
    toggleSidebar,
    openSidebar,
    closeSidebar,
    setSidebarOpen,
    toggleCollapsed,
    setSidebarCollapsed,
    setMobileDrawerOpen,
    
    // Menu actions
    toggleMenu,
    expandMenu,
    collapseMenu,
    collapseAllMenus,
    expandParentMenus,
    isMenuExpanded,
    isPathActive,
    setActivePath,
    
    // Search
    setSearchTerm,
    clearSearch,
    
    // 3D Config
    motion3D: motion3DConfig,
  }), [
    sidebarOpen,
    sidebarCollapsed,
    mobileDrawerOpen,
    expandedMenus,
    activePath,
    searchTerm,
    isMobile,
    isTablet,
    isDesktop,
    auth,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleCollapsed,
    toggleMenu,
    expandMenu,
    collapseMenu,
    collapseAllMenus,
    expandParentMenus,
    isMenuExpanded,
    isPathActive,
    clearSearch,
  ]);
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;
