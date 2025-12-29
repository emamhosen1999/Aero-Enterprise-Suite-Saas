import React, { useEffect, useState, useCallback } from 'react';
import { Link, usePage } from "@inertiajs/react";
import { useBranding } from '@/Hooks/useBranding';
import {
  Button,
  Divider,
  ScrollShadow,
  Chip,
  Input,
  Card
} from "@heroui/react";
import {
  ChevronRightIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  StarIcon,
  ClockIcon,
  BuildingOffice2Icon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';
import { useMotionSystem } from '@/config/motionDepthSystem';
import { highlightSearchMatch, useSidebarState, getPagePath } from './sidebarUtils.jsx';

/**
 * DesktopSidebar - Full-featured desktop sidebar
 * Features: Enhanced branding, 3D depth effects, hover animations
 */
const DesktopSidebar = React.memo(({ 
  toggleSideBar, 
  pages, 
  url, 
  sideBarOpen,
  app,
  auth 
}) => {
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName.charAt(0).toUpperCase();
  
  // 3D Motion System
  const motionSystem = useMotionSystem();
  
  const {
    openSubMenus,
    setOpenSubMenus: updateOpenSubMenus,
  } = useSidebarState();
  
  const [activePage, setActivePage] = useState(url);
  const [searchTerm, setSearchTerm] = useState('');

  // Fresh grouped pages
  const groupedPages = (() => {
    let allPages = pages;
    
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
    const targetPath = pageRouteOrPath.startsWith('/') ? pageRouteOrPath : "/" + pageRouteOrPath;
    setActivePage(targetPath);
    setSearchTerm('');
  };

  const renderMenuItem = (page, level = 0) => {
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
    
    const paddingLeft = level === 0 ? 'px-2' : level === 1 ? 'px-3' : 'px-4';
    const height = level === 0 ? 'h-10' : level === 1 ? 'h-9' : 'h-8';
    const iconSize = level === 0 ? 'w-4 h-4' : 'w-3 h-3';
    const textSize = level === 0 ? 'text-sm' : 'text-xs';
    
    if (page.subMenu) {
      const showActiveStyle = hasActiveSubPage || isExpanded;
      
      return (
        <motion.div 
          key={`desktop-menu-${page.name}-${level}`} 
          className="w-full"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
          whileHover={{ 
            z: 10,
            transition: { type: 'spring', stiffness: 400, damping: 25 }
          }}
        >
          <motion.div
            whileHover={{ 
              scale: 1.01,
              rotateX: -1,
              y: -1,
              boxShadow: '0 8px 20px -5px rgba(0,0,0,0.15)',
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ borderRadius: 'var(--borderRadius, 8px)' }}
          >
            <Button
              variant="light"
              color={showActiveStyle ? "primary" : "default"}
              startContent={
                page.icon ? (
                  <motion.span 
                    style={{ color: showActiveStyle ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {React.cloneElement(page.icon, { className: iconSize })}
                  </motion.span>
                ) : null
              }
              endContent={
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <ChevronRightIcon 
                    className="w-3 h-3"
                    style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                  />
                </motion.div>
              }
              className={`w-full justify-start ${height} ${paddingLeft} relative overflow-hidden mb-0.5 transition-all duration-200`}
              style={showActiveStyle ? {
                backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)`,
                border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                borderRadius: `var(--borderRadius, 8px)`,
                boxShadow: `0 4px 15px -3px var(--theme-primary, #006FEE)40`,
              } : {
                backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                borderRadius: `var(--borderRadius, 8px)`,
                boxShadow: `0 2px 8px -2px rgba(0,0,0,0.05)`,
              }}
              onPress={() => handleSubMenuToggle(page.name)}
              size="sm"
            >
              {/* Glow effect for active/expanded items */}
              {showActiveStyle && (
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, var(--theme-primary, #006FEE)10, transparent 70%)`,
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
                  style={{ color: showActiveStyle ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                >
                  {highlightSearchMatch(page.name, searchTerm)}
                </span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={showActiveStyle ? "primary" : "default"}
                  className="h-4 min-w-4 px-1"
                >
                  {page.subMenu.length}
                </Chip>
              </div>
            </Button>
          </motion.div>
          
          {/* Submenu expansion with 3D depth */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, rotateX: -10 }}
                animate={{ opacity: 1, height: 'auto', rotateX: 0 }}
                exit={{ opacity: 0, height: 0, rotateX: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ transformOrigin: 'top', perspective: '1000px' }}
              >
                <div 
                  className={`ml-6 mt-1 space-y-0.5 pl-3`}
                  style={{ 
                    borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`,
                  }}
                >
                  {page.subMenu.map((subPage, index) => (
                    <motion.div 
                      key={`desktop-sub-${page.name}-${subPage.name}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                    >
                      {renderMenuItem(subPage, level + 1)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }
    
    // Leaf item - handle both named routes and URL paths
    const getLeafHref = () => {
      if (page.path) return page.path; // Explicit path takes priority
      if (page.route) {
        // Check if it's a named route
        try {
          if (typeof route === 'function' && route().has(page.route)) {
            return route(page.route);
          }
        } catch {}
        // Treat as URL path
        return page.route.startsWith('/') ? page.route : `/${page.route}`;
      }
      return null;
    };
    
    const leafHref = getLeafHref();
    if (leafHref) {
      return (
        <motion.div 
          key={`desktop-leaf-${page.name}-${level}`}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
          whileHover={{ 
            z: 10,
            transition: { type: 'spring', stiffness: 400, damping: 25 }
          }}
        >
          <motion.div
            whileHover={{ 
              scale: 1.01,
              rotateX: -1,
              y: -1,
              boxShadow: '0 6px 15px -5px rgba(0,0,0,0.12)',
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ borderRadius: 'var(--borderRadius, 8px)' }}
          >
            <Link
              href={leafHref}
              method={page.method}
              preserveState
              preserveScroll
              className={`w-full flex items-center gap-2 justify-start ${height} ${paddingLeft} relative overflow-hidden mb-0.5 transition-all duration-200 cursor-pointer`}
              style={isActive ? {
                backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 85%, transparent)`,
                border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                borderRadius: `var(--borderRadius, 8px)`,
                boxShadow: `0 4px 15px -3px var(--theme-primary, #006FEE)40`,
              } : {
                backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                borderRadius: `var(--borderRadius, 8px)`,
                boxShadow: `0 2px 8px -2px rgba(0,0,0,0.05)`,
              }}
              onClick={() => {
                setActivePage(leafHref);
                setSearchTerm('');
              }}
            >
              {page.icon && (
                <span style={{ color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}>
                  {React.cloneElement(page.icon, { className: iconSize })}
                </span>
              )}
              {/* Glow beam for active items */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent, var(--theme-primary-foreground, #FFFFFF), transparent)`,
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
            </Link>
          </motion.div>
        </motion.div>
      );
    }
    
    return null;
  };

  return (
    <motion.div 
      className="p-4 h-screen min-w-[240px] w-auto max-w-[320px] overflow-visible relative flex flex-col bg-transparent shrink-0"
      style={{
        perspective: motionSystem.PERSPECTIVE.subtle,
        transformStyle: 'preserve-3d',
      }}
      initial={false}
      animate={{ 
        minWidth: 240,
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
            {/* Enhanced Desktop Branding Header */}
            <motion.div 
              className="shrink-0 relative"
              style={{ 
                background: `linear-gradient(135deg, 
                  color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent) 0%, 
                  color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent) 50%,
                  color-mix(in srgb, var(--theme-primary, #006FEE) 5%, transparent) 100%)`,
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
                  background: `radial-gradient(ellipse at 50% 0%, var(--theme-primary, #006FEE)20, transparent 70%)`,
                }}
                animate={{
                  opacity: [0.4, 0.6, 0.4],
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
                  borderBottom: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <motion.div 
                    className="flex items-center gap-3"
                    initial={{ scale: 0.9, rotateY: -10 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    whileHover={{
                      scale: 1.02,
                      transition: { type: 'spring', stiffness: 400 },
                    }}
                  >
                    {/* 3D Logo Container */}
                    <motion.div 
                      className="relative"
                      style={{
                        perspective: '500px',
                        transformStyle: 'preserve-3d',
                      }}
                      whileHover={{
                        z: motionSystem.DEPTH_LAYERS.floating,
                        rotateY: 5,
                        scale: 1.05,
                      }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <div 
                        className={`w-10 h-10 flex items-center justify-center overflow-hidden ${motionSystem.shadows.elevated}`}
                        style={{ 
                          background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-primary, #006FEE) 15%, var(--theme-content1, #FFFFFF)) 0%, 
                            color-mix(in srgb, var(--theme-primary, #006FEE) 10%, var(--theme-content1, #FFFFFF)) 100%)`,
                          border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 25%, transparent)`,
                          borderRadius: `var(--borderRadius, 8px)`,
                          boxShadow: `
                            0 4px 12px -2px var(--theme-primary, #006FEE)25,
                            inset 0 1px 0 0 rgba(255,255,255,0.8)
                          `,
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
                            color: 'var(--theme-primary, #006FEE)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                          border: '2px solid var(--theme-background, #FFFFFF)',
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px var(--theme-success, #17C964)50',
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
                    
                    {/* Brand Information */}
                    <motion.div 
                      className="flex flex-col leading-tight"
                      whileHover={{
                        x: 2,
                        transition: { type: 'spring', stiffness: 400 },
                      }}
                    >
                      <h1 
                        className="font-bold text-base"
                        style={{ 
                          color: `var(--theme-primary, #006FEE)`,
                          textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        {app?.name || siteName || 'Company Name'}
                      </h1>
                      <div className="flex items-center gap-1">
                        <BuildingOffice2Icon 
                          className="w-3 h-3" 
                          style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
                        />
                        <p 
                          className="text-xs font-medium"
                          style={{ color: `var(--theme-foreground-500, #71717A)` }}
                        >
                          {auth?.tenant?.name || 'aeos365'}
                        </p>
                      </div>
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
              <ScrollShadow className="h-full overflow-y-auto" hideScrollBar={false} size={10}>
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
                  
                  {/* Main Navigation */}
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
                          key={`desktop-main-${page.name}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: 0.7 + (index * 0.05) }}
                        >
                          {renderMenuItem(page)}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Settings Section */}
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
                        />
                      </div>
                      {groupedPages.settingsPages.map((page, index) => (
                        <motion.div
                          key={`desktop-settings-${page.name}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: 0.9 + (index * 0.05) }}
                        >
                          {renderMenuItem(page)}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* No results */}
                  {searchTerm.trim() && groupedPages.mainPages.length === 0 && groupedPages.settingsPages.length === 0 && (
                    <motion.div 
                      className="flex flex-col items-center justify-center py-8 px-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
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
                        Try different keywords
                      </p>
                    </motion.div>
                  )}

                  {/* Quick Actions */}
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
                        />
                      </div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02, x: 2 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="light"
                          size="sm"
                          startContent={<ClockIcon className="w-3 h-3" />}
                          className="w-full justify-start h-8 px-4 text-xs"
                          style={{
                            borderRadius: `var(--borderRadius, 8px)`,
                            color: `var(--theme-foreground, #11181C)`,
                          }}
                        >
                          Recent Activities
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02, x: 2 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="light"
                          size="sm"
                          startContent={<StarIcon className="w-3 h-3" />}
                          className="w-full justify-start h-8 px-4 text-xs"
                          style={{
                            borderRadius: `var(--borderRadius, 8px)`,
                            color: `var(--theme-foreground, #11181C)`,
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

            {/* Enhanced Footer with Branding */}
            <motion.div 
              className="p-2 shrink-0 relative"
              style={{ 
                background: `linear-gradient(135deg, 
                  color-mix(in srgb, var(--theme-success, #17C964) 8%, transparent) 0%, 
                  color-mix(in srgb, var(--theme-success, #17C964) 4%, transparent) 100%)`,
                borderTop: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-success, #17C964) 15%, transparent)`,
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
                  background: `radial-gradient(circle at 50% 100%, var(--theme-success, #17C964)15, transparent 60%)`,
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
                className={`flex items-center justify-between p-2 transition-all duration-300 relative ${motionSystem.shadows.subtle}`}
                shadow="sm"
                style={{ 
                  background: `linear-gradient(135deg, 
                    var(--theme-content1, #FAFAFA) 0%, 
                    color-mix(in srgb, var(--theme-success, #17C964) 3%, var(--theme-content1, #FAFAFA)) 100%)`,
                  borderRadius: `var(--borderRadius, 8px)`,
                  borderWidth: `var(--borderWidth, 2px)`,
                  borderColor: `color-mix(in srgb, var(--theme-success, #17C964) 20%, var(--theme-divider, #E4E4E7))`,
                  borderStyle: 'solid',
                  boxShadow: `
                    0 4px 12px -2px var(--theme-success, #17C964)15,
                    inset 0 1px 0 0 rgba(255,255,255,0.5)
                  `,
                }}
              >
                <div className="flex items-center gap-1.5">
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
                    className="text-xs font-semibold"
                    style={{ color: `var(--theme-success, #17C964)` }}
                  >
                    Online
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <SparklesIcon 
                    className="w-3 h-3" 
                    style={{ color: `var(--theme-primary, #006FEE)` }}
                  />
                  <span 
                    className="text-[10px] font-bold"
                    style={{ color: `var(--theme-primary, #006FEE)` }}
                  >
                    AEOS
                  </span>
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color="primary"
                    className="h-4 text-[10px] font-bold px-1"
                  >
                    v2.1
                  </Chip>
                </div>
              </Card>
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';

export default DesktopSidebar;
