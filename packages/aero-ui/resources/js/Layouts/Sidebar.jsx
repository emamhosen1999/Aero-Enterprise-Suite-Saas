import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, usePage } from "@inertiajs/react";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { useBranding } from '@/Hooks/useBranding';
import {
  Button,
  Accordion,
  AccordionItem,
  Divider,
  ScrollShadow,
  Chip,
  Input,
  Avatar,
  Badge,
  Tooltip,
  Card
} from "@heroui/react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  StarIcon,
  ClockIcon
} from "@heroicons/react/24/outline"; 
  
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to highlight search matches
const highlightSearchMatch = (text, searchTerm) => {
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

// Custom hook for sidebar layout state management with selective localStorage persistence
const useSidebarState = () => {
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

const Sidebar = React.memo(({ toggleSideBar, pages, url, sideBarOpen }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 768px)');
  const { auth } = usePage().props;
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName.charAt(0).toUpperCase();
  
  const {
    openSubMenus,
    setOpenSubMenus: updateOpenSubMenus,
    clearAllState
  } = useSidebarState();
  
  const [activePage, setActivePage] = useState(url);
  const [searchTerm, setSearchTerm] = useState('');
  
  // HeroUI will handle theming automatically through semantic colors
  
  // Fresh grouped pages - always recalculate for latest data
  const groupedPages = (() => {
    let allPages = pages;
    
    // Filter pages based on search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      
      const filterPagesRecursively = (pagesList) => {
        return pagesList.filter(page => {
          const nameMatches = page.name.toLowerCase().includes(searchLower);
          
          let hasMatchingSubMenu = false;
          if (page.subMenu) {
            const filteredSubMenu = filterPagesRecursively(page.subMenu);
            hasMatchingSubMenu = filteredSubMenu.length > 0;
            if (hasMatchingSubMenu) {
              page = { ...page, subMenu: filteredSubMenu };
            }
          }
          
          return nameMatches || hasMatchingSubMenu;
        });
      };
      
      allPages = filterPagesRecursively(pages);
    }
    
    const mainPages = allPages.filter(page => !page.category || page.category === 'main');
    const settingsPages = allPages.filter(page => page.category === 'settings');
    
    return { mainPages, settingsPages };
  })();

  // Auto-expand menus when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const expandAllWithMatches = (pagesList, expandedSet = new Set()) => {
        pagesList.forEach(page => {
          if (page.subMenu) {
            const searchLower = searchTerm.toLowerCase();
            const hasMatches = page.subMenu.some(subPage => {
              const matches = subPage.name.toLowerCase().includes(searchLower);
              if (subPage.subMenu) {
                return matches || expandAllWithMatches([subPage], expandedSet);
              }
              return matches;
            });
            
            if (hasMatches) {
              expandedSet.add(page.name);
              expandAllWithMatches(page.subMenu, expandedSet);
            }
          }
        });
        return expandedSet;
      };
      
      const newExpandedMenus = expandAllWithMatches(pages);
      updateOpenSubMenus(newExpandedMenus);
    }
  }, [searchTerm, pages]);

  // Update active page when URL changes
  useEffect(() => {
    setActivePage(url);
    
    // Auto-expand parent menus if a submenu item is active
    const expandParentMenus = (menuItems, targetUrl, parentNames = []) => {
      for (const page of menuItems) {
        const currentParents = [...parentNames, page.name];
        
        if (page.route && "/" + page.route === targetUrl) {
          const newSet = new Set([...openSubMenus, ...currentParents.slice(0, -1)]);
          updateOpenSubMenus(newSet);
          return true;
        }
        
        if (page.subMenu) {
          if (expandParentMenus(page.subMenu, targetUrl, currentParents)) {
            return true;
          }
        }
      }
      return false;
    };
    
    expandParentMenus(pages, url);
  }, [url, pages]);

  // Simple callback handlers - no useCallback for fresh execution
  const handleSubMenuToggle = (pageName) => {
    const newSet = new Set(openSubMenus);
    if (newSet.has(pageName)) {
      newSet.delete(pageName);
    } else {
      newSet.add(pageName);
    }
    updateOpenSubMenus(newSet);
  };

  const handlePageClick = (pageRouteOrPath) => {
    // Handle both route names and paths
    const targetPath = pageRouteOrPath.startsWith('/') ? pageRouteOrPath : "/" + pageRouteOrPath;
    setActivePage(targetPath);
    // Clear search when navigating to a page
    setSearchTerm('');
    if (isMobile) {
      toggleSideBar();
    }
  };

  // Helper to get the page's URL path (supports both route name and path)
  const getPagePath = (page) => {
    if (page.path) return page.path;
    if (page.route) return "/" + page.route;
    return null;
  };

  const renderCompactMenuItem = (page, isSubMenu = false, level = 0) => {
    const pagePath = getPagePath(page);
    const isActive = pagePath && activePage === pagePath;
    const hasActiveSubPage = page.subMenu?.some(
      subPage => {
        const subPath = getPagePath(subPage);
        if (subPath) return subPath === activePage;
        if (subPage.subMenu) return subPage.subMenu.some(nestedPage => getPagePath(nestedPage) === activePage);
        return false;
      }
    );
    const isExpanded = openSubMenus.has(page.name);
    
    // Enhanced responsive sizing
    const paddingLeft = level === 0 ? (isMobile ? 'px-3' : 'px-2') : level === 1 ? (isMobile ? 'px-4' : 'px-3') : (isMobile ? 'px-5' : 'px-4');
    const height = level === 0 ? (isMobile ? 'h-11' : 'h-10') : level === 1 ? (isMobile ? 'h-10' : 'h-9') : (isMobile ? 'h-9' : 'h-8');
    const iconSize = level === 0 ? (isMobile ? 'w-4 h-4' : 'w-3 h-3') : level === 1 ? 'w-3 h-3' : 'w-3 h-3';
    const textSize = level === 0 ? (isMobile ? 'text-sm' : 'text-sm') : level === 1 ? 'text-xs' : 'text-xs';
    
    if (page.subMenu) {
      return (
        <div 
          key={`menu-item-${page.name}-${level}`} 
          className="w-full"
        >
          <Button
            variant="light"
            color={hasActiveSubPage ? "primary" : "default"}
            startContent={
              <div style={{ color: hasActiveSubPage ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}>
                {React.cloneElement(page.icon, { className: iconSize })}
              </div>
            }
            endContent={
              <ChevronRightIcon 
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
              />
            }
            className={`w-full justify-start ${height} ${paddingLeft} bg-transparent transition-all duration-200 mb-0.5`}
            style={hasActiveSubPage ? {
              backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
              border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
              borderRadius: `var(--borderRadius, 8px)`
            } : {
              border: `var(--borderWidth, 2px) solid transparent`,
              borderRadius: `var(--borderRadius, 8px)`
            }}
            onMouseEnter={(e) => {
              if (!hasActiveSubPage) {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
              }
              e.currentTarget.style.borderRadius = `var(--borderRadius, 8px)`;
            }}
            onMouseLeave={(e) => {
              if (!hasActiveSubPage) {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
              }
            }}
            onPress={() => handleSubMenuToggle(page.name)}
            size="sm"
          >
            <div className="flex items-center justify-between w-full">
              <span 
                className={`${textSize} font-medium flex-1 mr-2 whitespace-nowrap`} 
                style={{ color: hasActiveSubPage ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}
              >
                {highlightSearchMatch(page.name, searchTerm)}
              </span>
              <Chip
                size="sm"
                variant="flat"
                color={hasActiveSubPage ? "primary" : "default"}
                className={`text-xs ${isMobile ? 'h-5 min-w-5 px-1' : 'h-4 min-w-4 px-1'}`}
              >
                {page.subMenu.length}
              </Chip>
            </div>
          </Button>
          {/* Submenu with CSS transitions */}
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div 
              className={`${level === 0 ? (isMobile ? 'ml-8' : 'ml-6') : (isMobile ? 'ml-6' : 'ml-4')} mt-1 space-y-0.5 pl-3`}
              style={{ 
                borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`
              }}
            >
              {page.subMenu.map((subPage, index) => (
                <div key={`subitem-${page.name}-${subPage.name}-${level}-${index}`}>
                  {renderCompactMenuItem(subPage, true, level + 1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // No submenu - leaf item (can have route name OR path URL)
    const leafHref = page.route ? route(page.route) : page.path;
    if (leafHref) {
      return (
        <div key={`route-item-${page.name}-${level}`}>
          <Button
            as={Link}
            href={leafHref}
            method={page.method}
            preserveState
            preserveScroll
            variant="light"
            startContent={
              <div style={{ color: isActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}>
                {React.cloneElement(page.icon, { className: iconSize })}
              </div>
            }
            className={`w-full justify-start ${height} ${paddingLeft} bg-transparent transition-all duration-200 mb-0.5`}
            style={isActive ? {
              backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
              border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
              borderRadius: `var(--borderRadius, 8px)`
            } : {
              border: `var(--borderWidth, 2px) solid transparent`,
              borderRadius: `var(--borderRadius, 8px)`
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
              }
              e.currentTarget.style.borderRadius = `var(--borderRadius, 8px)`;
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
              }
            }}
            onPress={() => handlePageClick(leafHref)}
            size="sm"
          >
            <span 
              className={`${textSize} font-medium whitespace-nowrap`}
              style={{ color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}
            >
              {highlightSearchMatch(page.name, searchTerm)}
            </span>
          </Button>
        </div>
      );
    }
    
    // Category header without route
    return (
      <div 
        key={`category-item-${page.name}-${level}`} 
        className="w-full"
      >
        <Button
          variant="light"
          color={hasActiveSubPage ? "primary" : "default"}
          startContent={
            <div style={{ color: hasActiveSubPage ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}>
              {React.cloneElement(page.icon, { className: iconSize })}
            </div>
          }
          endContent={
            <ChevronRightIcon 
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
            />
          }
          className={`w-full justify-start ${height} ${paddingLeft} bg-transparent transition-all duration-200 mb-0.5`}
          style={hasActiveSubPage ? {
            backgroundColor: `var(--theme-primary, #006FEE)`,
            border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
            borderRadius: `var(--borderRadius, 8px)`,
            color: `var(--theme-primary-foreground, #FFFFFF)`
          } : {
            borderRadius: `var(--borderRadius, 8px)`
          }}
          onMouseEnter={(e) => {
            if (!hasActiveSubPage) {
              e.currentTarget.style.backgroundColor = `var(--theme-content2, #F4F4F5)`;
            }
            e.currentTarget.style.borderRadius = `var(--borderRadius, 8px)`;
          }}
          onMouseLeave={(e) => {
            if (!hasActiveSubPage) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onPress={() => handleSubMenuToggle(page.name)}
          size="sm"
        >
          <div className="flex items-center justify-between w-full">
            <span 
              className={`${textSize} font-medium flex-1 mr-2 whitespace-nowrap`} 
              style={{ color: hasActiveSubPage ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}
            >
              {highlightSearchMatch(page.name, searchTerm)}
            </span>
            <Chip
              size="sm"
              variant="flat"
              color={hasActiveSubPage ? "primary" : "default"}
              className={`text-xs ${isMobile ? 'h-5 min-w-5 px-1' : 'h-4 min-w-4 px-1'}`}
            >
              {page.subMenu?.length || 0}
            </Chip>
          </div>
        </Button>
        {/* Submenu with CSS transitions */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div 
            className={`${level === 0 ? (isMobile ? 'ml-8' : 'ml-6') : (isMobile ? 'ml-6' : 'ml-4')} mt-1 space-y-0.5 pl-3`}
            style={{ 
              borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`
            }}
          >
            {page.subMenu?.map((subPage, index) => (
              <div key={`category-subitem-${page.name}-${subPage.name}-${level}-${index}`}>
                {renderCompactMenuItem(subPage, true, level + 1)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMenuItem = (page, isSubMenu = false, level = 0) => {
    const pagePath = getPagePath(page);
    const isActive = pagePath && activePage === pagePath;
    const hasActiveSubPage = page.subMenu?.some(
      subPage => {
        const subPath = getPagePath(subPage);
        if (subPath) return subPath === activePage;
        if (subPage.subMenu) return subPage.subMenu.some(nestedPage => getPagePath(nestedPage) === activePage);
        return false;
      }
    );
    const isExpanded = openSubMenus.has(page.name);

    const marginLeft = level === 0 ? '' : level === 1 ? 'ml-8' : 'ml-12';
    const paddingLeft = level === 0 ? 'pl-4' : level === 1 ? 'pl-6' : 'pl-8';

    if (page.subMenu) {
      return (
        <div key={`full-menu-item-${page.name}-${level}`} className="w-full">
          <Button
            color={hasActiveSubPage ? "primary" : "default"}
            startContent={
              <div style={{ color: hasActiveSubPage ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}>
                {page.icon}
              </div>
            }
            endContent={
              <ChevronRightIcon 
                className={`w-4 h-4 transition-all duration-300 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
              />
            }
            variant={hasActiveSubPage ? "flat" : "light"}
            className={`w-full justify-start h-14 ${paddingLeft} pr-4 transition-all duration-300 group hover:scale-105`}
            style={hasActiveSubPage ? {
              backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
              border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
              borderRadius: `var(--borderRadius, 8px)`
            } : {
              border: `var(--borderWidth, 2px) solid transparent`,
              borderRadius: `var(--borderRadius, 8px)`
            }}
            onMouseEnter={(e) => {
              if (!hasActiveSubPage) {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!hasActiveSubPage) {
                e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
              }
            }}
            onPress={() => handleSubMenuToggle(page.name)}
            size="md"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <span className={`font-semibold text-sm`} style={{ color: hasActiveSubPage ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}>
                  {highlightSearchMatch(page.name, searchTerm)}
                </span>
                <span className="text-xs text-default-400 group-hover:text-default-500 transition-colors">
                  {page.subMenu.length} {level === 0 ? 'categories' : 'modules'}
                </span>
              </div>
              <Chip
                size="sm"
                color={hasActiveSubPage ? "primary" : "default"}
                variant="flat"
                className="transition-all duration-300"
              >
                {page.subMenu.length}
              </Chip>
            </div>
          </Button>
          
          {/* Submenu Items with Animation */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div 
              className={`${marginLeft} mt-2 space-y-1 pl-4 relative`}
              style={{ 
                borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`
              }}
            >
              {page.subMenu.map((subPage, index) => (
                <div
                  key={`full-submenu-${page.name}-${subPage.name}-${level}-${index}`}
                  className={`transform transition-all duration-300 delay-${index * 50} ${
                    isExpanded ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  }`}
                >
                  {renderMenuItem(subPage, true, level + 1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // No submenu - leaf item (can have route name OR path URL)
    const leafHref = page.route ? route(page.route) : pagePath;
    if (leafHref) {
      return (
        <Button
          key={`full-route-item-${page.name}-${level}`}
          as={Link}
          href={leafHref}
          method={page.method}
          preserveState
          preserveScroll
          startContent={
            <div style={{ color: isActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}>
              {page.icon}
            </div>
          }
          color={isActive ? "primary" : "default"}
          variant={isActive ? "flat" : "light"}
          className={`w-full justify-start h-11 ${paddingLeft} pr-4 transition-all duration-300 group hover:scale-105`}
          style={isActive ? {
            backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
            border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
            borderRadius: `var(--borderRadius, 8px)`
          } : {
            border: `var(--borderWidth, 2px) solid transparent`,
            borderRadius: `var(--borderRadius, 8px)`
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.border = `var(--borderWidth, 2px) solid transparent`;
            }
          }}
          onPress={() => handlePageClick(leafHref)}
          size="sm"
        >
          <span className="text-sm font-medium" style={{ color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}>
            {highlightSearchMatch(page.name, searchTerm)}
          </span>
        </Button>
      );
    }

    // Category without route - just display as header
    return (
      <div key={`full-category-item-${page.name}-${level}`} className="w-full">
        <div className={`${paddingLeft} pr-4 py-2`}>
          <div className="flex items-center gap-2">
            <div>
              {page.icon}
            </div>
            <span className="text-sm font-semibold text-foreground/80">
              {highlightSearchMatch(page.name, searchTerm)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const SidebarContent = (
    <motion.div 
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ 
        fontFamily: `var(--fontFamily, 'Inter')`,
        transform: `scale(var(--scale, 1))`,
        transformOrigin: 'top left'
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Fixed Header - Using PageHeader theming */}
      <motion.div 
        className="shrink-0"
        style={{ 
          backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
          borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
          borderWidth: `var(--borderWidth, 2px)`,
          borderStyle: 'solid',
          borderRadius: `var(--borderRadius, 8px) var(--borderRadius, 8px) 0 0`
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div 
          className="p-3" 
          style={{ 
            borderBottom: `var(--borderWidth, '2px') solid var(--theme-divider, #E4E4E7)`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Enhanced Logo Display */}
              <div className="relative">
                <div 
                  className="w-10 h-10 flex items-center justify-center shadow-xl overflow-hidden"
                  style={{ 
                    backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
                    borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderStyle: 'solid',
                    borderRadius: `var(--borderRadius, 8px)`
                  }}
                >
                  {squareLogo ? (
                    <img 
                      src={squareLogo} 
                      alt={`${siteName} Logo`} 
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to text logo if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="font-black text-sm absolute inset-0 flex items-center justify-center"
                    style={{ 
                      display: squareLogo ? 'none' : 'flex',
                      color: 'var(--theme-foreground, #11181C)'
                    }}
                  >
                    {firstLetter}
                  </div>
                </div>
                {/* Status Indicator */}
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 animate-pulse shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--theme-success, #17C964)',
                    borderColor: 'var(--theme-background, #FFFFFF)',
                    borderWidth: `var(--borderWidth, '2px')`,
                    borderStyle: 'solid',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>
              
              {/* Brand Information */}
              <div className="flex flex-col leading-tight">
                <h1 
                  className="font-bold text-base"
                  style={{ color: `var(--theme-primary, #006FEE)` }}
                >
                  {app?.name || 'Company Name'}
                </h1>
                <p 
                  className="text-xs font-medium"
                  style={{ color: `var(--theme-foreground-500, #71717A)` }}
                >
                  aeos365
                </p>
              </div>
            </motion.div>
          </div>
          
         
        </div>
      </motion.div>

      {/* Scrollable Navigation Content */}
      <motion.div 
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <ScrollShadow className="h-full" hideScrollBar size={5}>
          <div className="p-2 space-y-2">
            
            {/* Quick Search */}
            <motion.div 
              className="px-1 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Input
                size="sm"
                placeholder="Search navigation..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={
                  <MagnifyingGlassIcon 
                    className="w-3 h-3" 
                    style={{ color: `var(--theme-foreground-400, #A1A1AA)` }}
                  />
                }
                isClearable
                variant="bordered"
                className="text-xs"
                classNames={{
                  input: "text-xs",
                  inputWrapper: "h-8 min-h-8"
                }}
                style={{
                  backgroundColor: `var(--theme-content2, #F4F4F5)`,
                  borderColor: `var(--theme-divider, #E4E4E7)`,
                  borderRadius: `var(--borderRadius, 8px)`,
                  borderWidth: `var(--borderWidth, 2px)`,
                  borderStyle: 'solid'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = `var(--theme-primary, #006FEE)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `var(--theme-divider, #E4E4E7)`;
                }}
              />
            </motion.div>
            
            {/* Main Navigation - Enhanced */}
            {groupedPages.mainPages.length > 0 && (
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <HomeIcon 
                    className="w-3 h-3" 
                    style={{ color: `var(--theme-primary, #006FEE)` }}
                  />
                  <span 
                    className="font-bold text-xs uppercase tracking-wide"
                    style={{ color: `var(--theme-primary, #006FEE)` }}
                  >
                    Main
                  </span>
                  <Divider className="flex-1" />
                </div>
                {groupedPages.mainPages.map((page, index) => (
                  <motion.div
                    key={`main-page-${page.name}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.7 + (index * 0.05) }}
                  >
                    {renderCompactMenuItem(page)}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Settings Section - Enhanced */}
            {groupedPages.settingsPages.length > 0 && (
              <motion.div 
                className="space-y-1 mt-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <ShieldCheckIcon 
                    className="w-3 h-3" 
                    style={{ color: `var(--theme-warning, #F5A524)` }}
                  />
                  <span 
                    className="font-bold text-xs uppercase tracking-wide"
                    style={{ color: `var(--theme-warning, #F5A524)` }}
                  >
                    Admin
                  </span>
                  <div 
                    className="flex-1 h-px"
                    style={{ backgroundColor: `color-mix(in srgb, var(--theme-warning, #F5A524) 20%, transparent)` }}
                  ></div>
                </div>
                {groupedPages.settingsPages.map((page, index) => (
                  <motion.div
                    key={`settings-page-${page.name}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.9 + (index * 0.05) }}
                  >
                    {renderCompactMenuItem(page)}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* All Pages fallback - Enhanced */}
            {groupedPages.mainPages.length === 0 && groupedPages.settingsPages.length === 0 && !searchTerm.trim() && (
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <StarIcon className="w-3 h-3 text-secondary" />
                  <span className="text-secondary font-bold text-xs uppercase tracking-wide">
                    Modules
                  </span>
                  <div className="flex-1 h-px bg-secondary/20"></div>
                </div>
                {pages.map((page, index) => (
                  <motion.div
                    key={`all-page-${page.name}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.7 + (index * 0.05) }}
                  >
                    {renderCompactMenuItem(page)}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* No search results message */}
            {searchTerm.trim() && groupedPages.mainPages.length === 0 && groupedPages.settingsPages.length === 0 && (
              <motion.div 
                className="flex flex-col items-center justify-center py-8 px-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <MagnifyingGlassIcon 
                  className="w-8 h-8 mb-3" 
                  style={{ color: `var(--theme-foreground-300, #D4D4D8)` }}
                />
                <p 
                  className="text-center text-sm font-medium mb-1"
                  style={{ color: `var(--theme-foreground-400, #A1A1AA)` }}
                >
                  No results found
                </p>
                <p 
                  className="text-center text-xs"
                  style={{ color: `var(--theme-foreground-300, #D4D4D8)` }}
                >
                  Try searching with different keywords
                </p>
              </motion.div>
            )}

            {/* Quick Actions - New Feature */}
            {!searchTerm.trim() && (
              <motion.div 
                className="space-y-1 mt-6 pt-4"
                style={{ borderTop: `1px solid var(--theme-divider, #E4E4E7)` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.0 }}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <ClockIcon 
                    className="w-3 h-3" 
                    style={{ color: `var(--theme-success, #17C964)` }}
                  />
                  <span 
                    className="font-bold text-xs uppercase tracking-wide"
                    style={{ color: `var(--theme-success, #17C964)` }}
                  >
                    Quick Actions
                  </span>
                  <div 
                    className="flex-1 h-px"
                    style={{ backgroundColor: `var(--theme-success, #17C964)20` }}
                  ></div>
                </div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="light"
                    size="sm"
                    startContent={<ClockIcon className="w-3 h-3" />}
                    className="w-full justify-start h-8 px-4 bg-transparent transition-all duration-200 text-xs"
                    style={{
                      '--button-hover': `var(--theme-success, #17C964)10`,
                      borderRadius: `var(--borderRadius, '8px')`
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `var(--theme-success, #17C964)10`;
                      e.target.style.borderRadius = `var(--borderRadius, '8px')`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    Recent Activities
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="light"
                    size="sm"
                    startContent={<StarIcon className="w-3 h-3" />}
                    className="w-full justify-start h-8 px-4 bg-transparent transition-all duration-200 text-xs"
                    style={{
                      '--button-hover': `var(--theme-warning, #F5A524)10`,
                      borderRadius: `var(--borderRadius, '8px')`
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `var(--theme-warning, #F5A524)10`;
                      e.target.style.borderRadius = `var(--borderRadius, '8px')`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    Favorites
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </ScrollShadow>
      </motion.div>

      {/* Fixed Footer - Using PageHeader theming */}
      <motion.div 
        className="p-2 shrink-0"
        style={{ borderTop: `1px solid var(--theme-divider, #E4E4E7)` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.1 }}
      >
        <Card 
          className="flex items-center justify-between p-2 transition-all duration-300" 
          shadow="sm"
          style={{ 
            backgroundColor: `var(--theme-content1, #FAFAFA)`,
            borderRadius: `var(--borderRadius, '8px')`,
            borderWidth: `var(--borderWidth, '2px')`,
            borderColor: `var(--theme-divider, #E4E4E7)`,
            borderStyle: 'solid'
          }}
        >
          <div className="flex items-center gap-1">
            <motion.div 
              className="w-1.5 h-1.5"
              style={{ 
                backgroundColor: `var(--theme-success, #17C964)`,
                borderRadius: '50%'
              }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span 
              className="text-xs font-medium"
              style={{ color: `var(--theme-foreground, #11181C)` }}
            >
              Online
            </span>
          </div>
          <span 
            className="text-xs"
            style={{ color: `var(--theme-foreground-500, #71717A)` }}
          >
            v2.1.0
          </span>
        </Card>
      </motion.div>
    </motion.div>
  );
  
  // Unified Sidebar for both Mobile and Desktop
  return (
    <motion.div 
      className={`
        ${isMobile ? 'p-0' : 'p-4'} 
        h-screen
        ${isMobile ? 'min-w-[260px]' : 'min-w-[240px]'}
        w-auto
        max-w-[400px]
        overflow-visible
        relative
        flex
        flex-col
        bg-transparent
        shrink-0
      `}
      initial={false}
      animate={{ 
        minWidth: isMobile ? 260 : 240,
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
    >
      <div className="h-full flex flex-col bg-transparent">
        <Card 
          className="h-full flex flex-col overflow-visible"
          style={{
            background: `linear-gradient(to bottom right, 
              var(--theme-content1, #FAFAFA) 20%, 
              var(--theme-content2, #F4F4F5) 10%, 
              var(--theme-content3, #F1F3F4) 20%)`,
            borderColor: `var(--theme-divider, #E4E4E7)`,
            borderWidth: `var(--borderWidth, 2px)`,
            borderStyle: 'solid',
            borderRadius: `var(--borderRadius, 8px)`
          }}
        >
          {SidebarContent}
        </Card>
      </div>
    </motion.div>
  );
});

// Add display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;
