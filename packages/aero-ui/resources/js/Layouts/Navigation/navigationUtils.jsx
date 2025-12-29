/**
 * Navigation Utilities
 * Helper functions for the navigation system
 */

import { router } from '@inertiajs/react';

/**
 * Check if a route name exists (Ziggy)
 */
export const hasRoute = (routeName) => {
  try {
    return typeof route === 'function' && route().has(routeName);
  } catch {
    return false;
  }
};

/**
 * Get the URL for a menu item
 * Handles both named routes and URL paths
 */
export const getMenuItemUrl = (item) => {
  // Explicit path takes priority
  if (item.path) return item.path;
  
  // Check if route is a named route
  if (item.route) {
    if (hasRoute(item.route)) {
      try {
        return route(item.route);
      } catch {
        // Fall through to path handling
      }
    }
    // Treat as URL path
    return item.route.startsWith('/') ? item.route : `/${item.route}`;
  }
  
  return null;
};

/**
 * Navigate to a menu item
 */
export const navigateToItem = (item, options = {}) => {
  const url = getMenuItemUrl(item);
  if (!url) return false;
  
  const defaultOptions = {
    method: item.method || 'get',
    preserveState: false,
    preserveScroll: false,
    ...options,
  };
  
  try {
    router.visit(url, defaultOptions);
    return true;
  } catch (error) {
    console.error('Navigation failed:', error);
    // Fallback to window.location
    window.location.href = url;
    return true;
  }
};

/**
 * Check if a menu item or its children are active
 */
export const isItemActive = (item, currentPath) => {
  const itemUrl = getMenuItemUrl(item);
  
  // Direct match
  if (itemUrl && currentPath === itemUrl) {
    return true;
  }
  
  // Check children
  if (item.subMenu || item.children) {
    return (item.subMenu || item.children).some(child => isItemActive(child, currentPath));
  }
  
  return false;
};

/**
 * Filter menu items by search term
 */
export const filterMenuItems = (items, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return items;
  
  const search = searchTerm.toLowerCase().trim();
  
  const filterRecursive = (menuItems) => {
    return menuItems.reduce((acc, item) => {
      const nameMatch = item.name?.toLowerCase().includes(search);
      
      let filteredChildren = [];
      if (item.subMenu || item.children) {
        filteredChildren = filterRecursive(item.subMenu || item.children);
      }
      
      if (nameMatch || filteredChildren.length > 0) {
        acc.push({
          ...item,
          subMenu: item.subMenu ? filteredChildren : undefined,
          children: item.children ? filteredChildren : undefined,
        });
      }
      
      return acc;
    }, []);
  };
  
  return filterRecursive(items);
};

/**
 * Highlight search match in text
 */
export const highlightMatch = (text, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return text;
  
  const search = searchTerm.toLowerCase();
  const index = text.toLowerCase().indexOf(search);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-warning/30 text-inherit px-0.5 rounded">
        {text.slice(index, index + searchTerm.length)}
      </mark>
      {text.slice(index + searchTerm.length)}
    </>
  );
};

/**
 * Group menu items by category
 */
export const groupMenuItems = (items) => {
  const mainItems = [];
  const settingsItems = [];
  const otherGroups = {};
  
  items.forEach(item => {
    const category = item.category || item.group || 'main';
    
    if (category === 'main' || !category) {
      mainItems.push(item);
    } else if (category === 'settings') {
      settingsItems.push(item);
    } else {
      if (!otherGroups[category]) {
        otherGroups[category] = [];
      }
      otherGroups[category].push(item);
    }
  });
  
  return { mainItems, settingsItems, otherGroups };
};

/**
 * Count total items including nested
 */
export const countMenuItems = (items) => {
  return items.reduce((count, item) => {
    count += 1;
    if (item.subMenu || item.children) {
      count += countMenuItems(item.subMenu || item.children);
    }
    return count;
  }, 0);
};

/**
 * Flatten menu items (for search results)
 */
export const flattenMenuItems = (items, parentPath = []) => {
  return items.reduce((acc, item) => {
    const currentPath = [...parentPath, item.name];
    
    acc.push({
      ...item,
      breadcrumb: currentPath,
    });
    
    if (item.subMenu || item.children) {
      acc.push(...flattenMenuItems(item.subMenu || item.children, currentPath));
    }
    
    return acc;
  }, []);
};

/**
 * Generate unique ID for menu item
 */
export const getMenuItemId = (item, parentId = '') => {
  const id = item.id || item.name?.toLowerCase().replace(/\s+/g, '-') || '';
  return parentId ? `${parentId}-${id}` : id;
};

/**
 * Get theme-aware CSS variable value
 */
export const getThemeVar = (varName, fallback = '') => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName)?.trim();
  return value || fallback;
};

/**
 * Get border radius from theme
 */
export const getThemeRadius = () => {
  const radius = getThemeVar('--borderRadius', '12px');
  const value = parseInt(radius);
  
  if (value === 0) return 'none';
  if (value <= 4) return 'sm';
  if (value <= 8) return 'md';
  if (value <= 12) return 'lg';
  return 'xl';
};

/**
 * Generate 3D transform style
 */
export const get3DTransform = ({ rotateX = 0, rotateY = 0, translateZ = 0, translateY = 0, scale = 1 }) => {
  const transforms = [];
  
  if (rotateX !== 0) transforms.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== 0) transforms.push(`rotateY(${rotateY}deg)`);
  if (translateZ !== 0) transforms.push(`translateZ(${translateZ}px)`);
  if (translateY !== 0) transforms.push(`translateY(${translateY}px)`);
  if (scale !== 1) transforms.push(`scale(${scale})`);
  
  return transforms.length > 0 ? transforms.join(' ') : 'none';
};

/**
 * Common 3D styles
 */
export const get3DContainerStyle = (perspective = '1000px') => ({
  perspective,
  transformStyle: 'preserve-3d',
});

export const get3DHoverStyle = (isHovered, isActive = false) => {
  if (isActive) {
    return {
      transform: get3DTransform({ translateZ: 4 }),
      boxShadow: '0 4px 15px -3px var(--theme-primary, #006FEE)40',
    };
  }
  
  if (isHovered) {
    return {
      transform: get3DTransform({ rotateX: -2, translateZ: 8, translateY: -2, scale: 1.01 }),
      boxShadow: '0 8px 25px -5px rgba(0,0,0,0.15)',
    };
  }
  
  return {
    transform: 'none',
    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
  };
};
