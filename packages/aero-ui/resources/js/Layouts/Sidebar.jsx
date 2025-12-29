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
  
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useMotionSystem } from '@/config/motionDepthSystem';
import { useTheme } from '@/Context/ThemeContext';

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
  
  // Get theme context for reactive theme updates
  const { mode, themeSettings } = useTheme();
  
  // 3D Motion System
  const motionSystem = useMotionSystem();
  
  const {
    openSubMenus,
    setOpenSubMenus: updateOpenSubMenus,
    clearAllState
  } = useSidebarState();
  
  const [activePage, setActivePage] = useState(url);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cursor position for tilt effects
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  
  // Track cursor for 3D tilt interactions
  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);
  
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
    
    // 3D Motion variants based on state
    const itemVariants = {
      idle: {
        scale: 1,
        z: motionSystem.DEPTH_LAYERS.surface,
        rotateY: 0,
        rotateX: 0,
      },
      hover: {
        scale: 1.03,
        z: motionSystem.DEPTH_LAYERS.elevated,
        rotateY: isActive ? 0 : 3,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        },
      },
      active: {
        scale: 1,
        z: motionSystem.DEPTH_LAYERS.floating,
        rotateY: 0,
      },
      tap: {
        scale: 0.97,
        transition: { duration: 0.1 },
      },
    };
    
    if (page.subMenu) {
      return (
        <motion.div 
          key={`menu-item-${page.name}-${level}`} 
          className="w-full"
          style={{
            perspective: motionSystem.PERSPECTIVE.subtle,
            transformStyle: 'preserve-3d',
          }}
          variants={itemVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          animate={hasActiveSubPage ? "active" : "idle"}
        >
          <Button
            variant="light"
            color={hasActiveSubPage ? "primary" : "default"}
            startContent={
              <motion.div 
                style={{ color: hasActiveSubPage ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {React.cloneElement(page.icon, { className: iconSize })}
              </motion.div>
            }
            endContent={
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <ChevronRightIcon 
                  className={`w-3 h-3 transition-colors duration-200`}
                  style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                />
              </motion.div>
            }
            className={`w-full justify-start ${height} ${paddingLeft} bg-transparent relative overflow-hidden mb-0.5 ${motionSystem.glows.subtle}`}
            style={hasActiveSubPage ? {
              backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
              border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
              borderRadius: `var(--borderRadius, 8px)`,
              boxShadow: `0 4px 15px -3px var(--theme-primary, #006FEE)30`,
            } : {
              border: `var(--borderWidth, 2px) solid transparent`,
              borderRadius: `var(--borderRadius, 8px)`,
            }}
            onPress={() => handleSubMenuToggle(page.name)}
            size="sm"
          >
            {/* Glow effect for active items */}
            {hasActiveSubPage && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `radial-gradient(circle at center, var(--theme-primary, #006FEE)15, transparent 70%)`,
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            
            <div className="flex items-center justify-between w-full relative z-10">
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
                className={`text-xs ${isMobile ? 'h-5 min-w-5 px-1' : 'h-4 min-w-4 px-1'} ${motionSystem.shadows.subtle}`}
              >
                {page.subMenu.length}
              </Chip>
            </div>
          </Button>
          
          {/* Submenu with depth-based expansion */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={motionSystem.variants.submenu}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: motionSystem.PERSPECTIVE.moderate,
                }}
              >
                <div 
                  className={`${level === 0 ? (isMobile ? 'ml-8' : 'ml-6') : (isMobile ? 'ml-6' : 'ml-4')} mt-1 space-y-0.5 pl-3`}
                  style={{ 
                    borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
                  }}
                >
                  {page.subMenu.map((subPage, index) => (
                    <motion.div 
                      key={`subitem-${page.name}-${subPage.name}-${level}-${index}`}
                      initial={{ opacity: 0, x: -10, z: -10 }}
                      animate={{ opacity: 1, x: 0, z: 0 }}
                      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                    >
                      {renderCompactMenuItem(subPage, true, level + 1)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }
    
    // No submenu - leaf item (can have route name OR path URL)
    const leafHref = page.route ? route(page.route) : page.path;
    if (leafHref) {
      return (
        <motion.div 
          key={`route-item-${page.name}-${level}`}
          style={{
            perspective: motionSystem.PERSPECTIVE.subtle,
            transformStyle: 'preserve-3d',
          }}
          variants={itemVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          animate={isActive ? "active" : "idle"}
        >
          <Button
            as={Link}
            href={leafHref}
            method={page.method}
            preserveState
            preserveScroll
            variant="light"
            startContent={
              <motion.div 
                style={{ color: isActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {React.cloneElement(page.icon, { className: iconSize })}
              </motion.div>
            }
            className={`w-full justify-start ${height} ${paddingLeft} bg-transparent relative overflow-hidden mb-0.5`}
            style={isActive ? {
              backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
              border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
              borderRadius: `var(--borderRadius, 8px)`,
              boxShadow: `0 4px 15px -3px var(--theme-primary, #006FEE)40`,
            } : {
              border: `var(--borderWidth, 2px) solid transparent`,
              borderRadius: `var(--borderRadius, 8px)`,
            }}
            onPress={() => handlePageClick(leafHref)}
            size="sm"
          >
            {/* Glow beam for active items - creates "locked in space" effect */}
            {isActive && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, var(--theme-primary, #006FEE), transparent)`,
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scaleX: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            
            <span 
              className={`${textSize} font-medium whitespace-nowrap relative z-10`}
              style={{ color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}
            >
              {highlightSearchMatch(page.name, searchTerm)}
            </span>
          </Button>
        </motion.div>
      );
    }
    
    // Category header without route
    return (
      <motion.div 
        key={`category-item-${page.name}-${level}`} 
        className="w-full"
        style={{
          perspective: motionSystem.PERSPECTIVE.subtle,
          transformStyle: 'preserve-3d',
        }}
        variants={itemVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        animate={hasActiveSubPage ? "active" : "idle"}
      >
        <Button
          variant="light"
          color={hasActiveSubPage ? "primary" : "default"}
          startContent={
            <motion.div 
              style={{ color: hasActiveSubPage ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` }}
              whileHover={{ scale: 1.1 }}
            >
              {React.cloneElement(page.icon, { className: iconSize })}
            </motion.div>
          }
          endContent={
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <ChevronRightIcon 
                className={`w-3 h-3`}
                style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
              />
            </motion.div>
          }
          className={`w-full justify-start ${height} ${paddingLeft} bg-transparent relative overflow-hidden mb-0.5`}
          style={hasActiveSubPage ? {
            backgroundColor: `var(--theme-primary, #006FEE)`,
            border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
            borderRadius: `var(--borderRadius, 8px)`,
            color: `var(--theme-primary-foreground, #FFFFFF)`,
            boxShadow: `0 4px 15px -3px var(--theme-primary, #006FEE)40`,
          } : {
            borderRadius: `var(--borderRadius, 8px)`,
          }}
          onPress={() => handleSubMenuToggle(page.name)}
          size="sm"
        >
          {hasActiveSubPage && (
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `radial-gradient(circle at center, var(--theme-primary-foreground, #FFFFFF)10, transparent 70%)`,
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          )}
          
          <div className="flex items-center justify-between w-full relative z-10">
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
        
        {/* Submenu with depth expansion */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={motionSystem.variants.submenu}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <div 
                className={`${level === 0 ? (isMobile ? 'ml-8' : 'ml-6') : (isMobile ? 'ml-6' : 'ml-4')} mt-1 space-y-0.5 pl-3`}
                style={{ 
                  borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`
                }}
              >
                {page.subMenu?.map((subPage, index) => (
                  <motion.div 
                    key={`category-subitem-${page.name}-${subPage.name}-${level}-${index}`}
                    initial={{ opacity: 0, x: -10, z: -10 }}
                    animate={{ opacity: 1, x: 0, z: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                  >
                    {renderCompactMenuItem(subPage, true, level + 1)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
        transformOrigin: 'top left',
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, x: -20, z: -20 }}
      animate={{ opacity: 1, x: 0, z: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: motionSystem.easings.enterprise,
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Fixed Header - Enhanced with depth */}
      <motion.div 
        className="shrink-0 relative"
        style={{ 
          backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
          borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
          borderWidth: `var(--borderWidth, 2px)`,
          borderStyle: 'solid',
          borderRadius: `var(--borderRadius, 8px) var(--borderRadius, 8px) 0 0`,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, y: -10, z: -10 }}
        animate={{ opacity: 1, y: 0, z: motionSystem.DEPTH_LAYERS.surface }}
        transition={{ duration: 0.4, delay: 0.1 }}
        whileHover={{
          z: motionSystem.DEPTH_LAYERS.elevated,
          transition: { type: 'spring', stiffness: 400, damping: 30 },
        }}
      >
        {/* Ambient glow effect */}
        <motion.div
          className="absolute inset-0 rounded-t-lg pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, var(--theme-primary, #006FEE)15, transparent 70%)`,
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <div 
          className="p-3 relative z-10" 
          style={{ 
            borderBottom: `var(--borderWidth, '2px') solid var(--theme-divider, #E4E4E7)`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ scale: 0.9, rotateY: -10 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{
                scale: 1.05,
                transition: { type: 'spring', stiffness: 400 },
              }}
            >
              {/* Enhanced Logo Display with floating effect */}
              <motion.div 
                className="relative"
                whileHover={{
                  z: motionSystem.DEPTH_LAYERS.floating,
                  rotateY: 5,
                }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div 
                  className={`w-10 h-10 flex items-center justify-center overflow-hidden ${motionSystem.shadows.elevated}`}
                  style={{ 
                    backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
                    borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
                    borderWidth: `var(--borderWidth, 2px)`,
                    borderStyle: 'solid',
                    borderRadius: `var(--borderRadius, 8px)`,
                    boxShadow: `0 4px 12px -2px var(--theme-primary, #006FEE)20`,
                  }}
                >
                  {squareLogo ? (
                    <img 
                      src={squareLogo} 
                      alt={`${siteName} Logo`} 
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
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
                
                {/* Pulsing status indicator */}
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--theme-success, #17C964)',
                    borderColor: 'var(--theme-background, #FFFFFF)',
                    borderWidth: `var(--borderWidth, '2px')`,
                    borderStyle: 'solid',
                    borderRadius: '50%',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
              
              {/* Brand Information with glow on hover */}
              <motion.div 
                className="flex flex-col leading-tight"
                whileHover={{
                  x: 2,
                  transition: { type: 'spring', stiffness: 400 },
                }}
              >
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
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scrollable Navigation Content */}
      <motion.div 
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0, z: -10 }}
        animate={{ opacity: 1, z: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <ScrollShadow className="h-full" hideScrollBar size={5}>
          <div className="p-2 space-y-2">
            
            {/* Quick Search with floating effect */}
            <motion.div 
              className="px-1 mb-2"
              initial={{ opacity: 0, y: 10, z: -10 }}
              animate={{ opacity: 1, y: 0, z: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              whileHover={{
                z: motionSystem.DEPTH_LAYERS.elevated,
                transition: { type: 'spring', stiffness: 400 },
              }}
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
                className={`text-xs ${motionSystem.shadows.subtle}`}
                classNames={{
                  input: "text-xs",
                  inputWrapper: "h-8 min-h-8"
                }}
                style={{
                  backgroundColor: `var(--theme-content2, #F4F4F5)`,
                  borderColor: `var(--theme-divider, #E4E4E7)`,
                  borderRadius: `var(--borderRadius, 8px)`,
                  borderWidth: `var(--borderWidth, 2px)`,
                  borderStyle: 'solid',
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

      {/* Fixed Footer - Floating status with depth */}
      <motion.div 
        className="p-2 shrink-0 relative"
        style={{ 
          borderTop: `1px solid var(--theme-divider, #E4E4E7)`,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, y: 10, z: -10 }}
        animate={{ opacity: 1, y: 0, z: motionSystem.DEPTH_LAYERS.surface }}
        transition={{ duration: 0.3, delay: 1.1 }}
        whileHover={{
          z: motionSystem.DEPTH_LAYERS.elevated,
          transition: { type: 'spring', stiffness: 400, damping: 30 },
        }}
      >
        {/* Ambient bottom glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 100%, var(--theme-success, #17C964)10, transparent 60%)`,
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <Card 
          className={`flex items-center justify-between p-2 transition-all duration-300 relative ${motionSystem.shadows.subtle} ${motionSystem.glows.subtle}`}
          shadow="sm"
          style={{ 
            backgroundColor: `var(--theme-content1, #FAFAFA)`,
            borderRadius: `var(--borderRadius, '8px')`,
            borderWidth: `var(--borderWidth, '2px')`,
            borderColor: `var(--theme-divider, #E4E4E7)`,
            borderStyle: 'solid',
            boxShadow: `
              0 4px 12px -2px var(--theme-success, #17C964)10,
              0 0 0 1px var(--theme-divider, #E4E4E7)
            `,
          }}
        >
          <div className="flex items-center gap-1">
            <motion.div 
              className="w-1.5 h-1.5"
              style={{ 
                backgroundColor: `var(--theme-success, #17C964)`,
                borderRadius: '50%',
                boxShadow: `0 0 8px var(--theme-success, #17C964)60`,
              }}
              animate={{ 
                opacity: [1, 0.5, 1],
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut',
              }}
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
      style={{
        perspective: motionSystem.PERSPECTIVE.subtle,
        transformStyle: 'preserve-3d',
      }}
      initial={false}
      animate={{ 
        minWidth: isMobile ? 260 : 240,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 35,
        }
      }}
    >
      <motion.div 
        className="h-full flex flex-col bg-transparent"
        variants={motionSystem.variants.sidebar}
        animate={sideBarOpen ? "expanded" : "collapsed"}
      >
        <motion.div
          style={{
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
          whileHover={{
            z: motionSystem.DEPTH_LAYERS.elevated,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 30,
            },
          }}
        >
          <Card 
            className={`h-full flex flex-col overflow-visible ${motionSystem.shadows.elevated} ${motionSystem.glows.subtle}`}
            style={{
              background: `linear-gradient(135deg, 
                var(--theme-content1, #FAFAFA) 0%, 
                var(--theme-content2, #F4F4F5) 50%, 
                var(--theme-content3, #F1F3F4) 100%)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
              borderWidth: `var(--borderWidth, 2px)`,
              borderStyle: 'solid',
              borderRadius: `var(--borderRadius, 8px)`,
              boxShadow: `
                0 10px 40px -10px var(--theme-primary, #006FEE)15,
                0 0 0 1px var(--theme-divider, #E4E4E7),
                inset 0 1px 0 0 rgba(255,255,255,0.5)
              `,
              transformStyle: 'preserve-3d',
            }}
          >
            {SidebarContent}
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

// Add display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;
