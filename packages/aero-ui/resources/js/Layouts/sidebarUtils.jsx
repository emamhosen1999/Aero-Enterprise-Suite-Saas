import React, { useState, useCallback } from 'react';

/**
 * Helper function to highlight search matches in navigation
 */
export const highlightSearchMatch = (text, searchTerm) => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <span 
          key={index} 
          className="px-1.5 py-0.5 rounded-md font-semibold"
          style={{
            backgroundColor: 'var(--theme-primary, #3b82f6)',
            color: '#FFFFFF'
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

/**
 * Custom hook for sidebar layout state management with selective localStorage persistence
 */
export const useSidebarState = () => {
  // Initialize sidebar layout state from localStorage for UI persistence only
  const [openSubMenus, setOpenSubMenus] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebar_open_submenus');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save layout state to localStorage when it changes
  const updateOpenSubMenus = useCallback((newOpenSubMenus) => {
    // Ensure we always have a valid Set
    const validSet = newOpenSubMenus instanceof Set ? newOpenSubMenus : new Set();
    setOpenSubMenus(validSet);
    try {
      localStorage.setItem('sidebar_open_submenus', JSON.stringify([...validSet]));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, []);

  const clearAllState = () => {
    const clearedState = new Set();
    setOpenSubMenus(clearedState);
    try {
      localStorage.setItem('sidebar_open_submenus', JSON.stringify([]));
    } catch (error) {
      console.warn('Failed to clear sidebar state in localStorage:', error);
    }
  };

  return {
    openSubMenus,
    setOpenSubMenus: updateOpenSubMenus,
    clearAllState
  };
};

/**
 * Helper to get the page's URL path (supports both route name and path)
 * Returns the URL that matches how Inertia's url prop works
 */
export const getPagePath = (page) => {
  if (page.path) return page.path;
  if (page.route) {
    // Check if it's a named route and resolve it
    try {
      if (typeof route === 'function' && route().has(page.route)) {
        return route(page.route);
      }
    } catch {}
    // Treat as URL path - ensure it starts with /
    return page.route.startsWith('/') ? page.route : `/${page.route}`;
  }
  return null;
};

/**
 * Filter pages recursively based on search term
 */
export const filterPagesRecursively = (pagesList, searchTerm) => {
  const searchLower = searchTerm.toLowerCase();
  
  return pagesList.filter(page => {
    const nameMatches = page.name.toLowerCase().includes(searchLower);
    
    let hasMatchingSubMenu = false;
    if (page.subMenu) {
      const filteredSubMenu = filterPagesRecursively(page.subMenu, searchTerm);
      hasMatchingSubMenu = filteredSubMenu.length > 0;
      if (hasMatchingSubMenu) {
        page = { ...page, subMenu: filteredSubMenu };
      }
    }
    
    return nameMatches || hasMatchingSubMenu;
  });
};

/**
 * Get grouped pages (main vs settings)
 */
export const getGroupedPages = (pages, searchTerm = '') => {
  let allPages = pages;
  
  if (searchTerm.trim()) {
    allPages = filterPagesRecursively(pages, searchTerm);
  }
  
  const mainPages = allPages.filter(page => !page.category || page.category === 'main');
  const settingsPages = allPages.filter(page => page.category === 'settings');
  
  return { mainPages, settingsPages };
};

/**
 * Check if a page or any of its children are active
 */
export const checkPageActive = (page, activePage) => {
  const pagePath = getPagePath(page);
  if (pagePath && activePage === pagePath) return true;
  
  if (page.subMenu) {
    return page.subMenu.some(subPage => checkPageActive(subPage, activePage));
  }
  
  return false;
};
