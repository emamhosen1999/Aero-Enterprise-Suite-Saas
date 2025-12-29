import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, usePage } from "@inertiajs/react";
import { useBranding } from '@/Hooks/useBranding';
import {
  Button,
  Divider,
  ScrollShadow,
  Chip,
  Input,
  Avatar,
  Badge,
  Card
} from "@heroui/react";
import {
  ChevronRightIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  StarIcon,
  ClockIcon,
  XMarkIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';
import { useMotionSystem } from '@/config/motionDepthSystem';
import { highlightSearchMatch, useSidebarState, getPagePath } from './sidebarUtils.jsx';

/**
 * MobileSidebar - Touch-optimized sidebar for mobile devices
 * Features: Enhanced branding, 3D depth effects, touch-friendly interactions
 */
const MobileSidebar = React.memo(({ 
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
    toggleSideBar();
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
    
    const paddingLeft = level === 0 ? 'px-3' : level === 1 ? 'px-4' : 'px-5';
    const height = level === 0 ? 'h-12' : level === 1 ? 'h-11' : 'h-10';
    const iconSize = level === 0 ? 'w-5 h-5' : 'w-4 h-4';
    const textSize = level === 0 ? 'text-sm' : 'text-xs';
    
    if (page.subMenu) {
      const showActiveStyle = hasActiveSubPage || isExpanded;
      
      return (
        <motion.div 
          key={`mobile-menu-${page.name}-${level}`} 
          className="w-full"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          <motion.div
            whileHover={{ 
              scale: 1.01,
              y: -1,
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ borderRadius: 'var(--borderRadius, 8px)' }}
          >
            <Button
              variant="light"
              color={showActiveStyle ? "primary" : "default"}
              startContent={
                page.icon ? (
                  <span style={{ color: showActiveStyle ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}>
                    {React.cloneElement(page.icon, { className: iconSize })}
                  </span>
                ) : null
              }
              endContent={
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <ChevronRightIcon 
                    className="w-4 h-4"
                    style={{ color: isExpanded ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                  />
                </motion.div>
              }
              className={`w-full justify-start ${height} ${paddingLeft} relative mb-1`}
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
              size="md"
            >
              <div className="flex items-center justify-between w-full">
                <span 
                  className={`${textSize} font-medium flex-1 mr-2`} 
                  style={{ color: showActiveStyle ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` }}
                >
                  {highlightSearchMatch(page.name, searchTerm)}
                </span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={showActiveStyle ? "primary" : "default"}
                  className="h-5 min-w-5 px-1.5"
                >
                  {page.subMenu.length}
                </Chip>
              </div>
            </Button>
          </motion.div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div 
                  className={`ml-8 mt-1 space-y-0.5 pl-3`}
                  style={{ 
                    borderLeft: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`,
                  }}
                >
                  {page.subMenu.map((subPage, index) => (
                    <motion.div 
                      key={`mobile-sub-${page.name}-${subPage.name}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
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
          key={`mobile-leaf-${page.name}-${level}`}
          whileTap={{ scale: 0.98 }}
          style={{ borderRadius: 'var(--borderRadius, 8px)' }}
        >
          <Link
            href={leafHref}
            method={page.method}
            preserveState
            preserveScroll
            className={`w-full flex items-center gap-2 justify-start ${height} ${paddingLeft} relative mb-1 cursor-pointer`}
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
              toggleSideBar();
            }}
          >
            {page.icon && (
              <span style={{ color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}>
                {React.cloneElement(page.icon, { className: iconSize })}
              </span>
            )}
            <span 
              className={`${textSize} font-medium`}
              style={{ color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` }}
            >
              {highlightSearchMatch(page.name, searchTerm)}
            </span>
          </Link>
        </motion.div>
      );
    }
    
    return null;
  };

  return (
    <motion.div 
      className="p-0 h-screen min-w-[280px] w-auto max-w-[320px] overflow-visible relative flex flex-col bg-transparent shrink-0"
      style={{
        perspective: motionSystem.PERSPECTIVE.subtle,
        transformStyle: 'preserve-3d',
      }}
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -280, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <motion.div className="h-full flex flex-col bg-transparent">
        <Card 
          className={`h-full flex flex-col overflow-visible ${motionSystem.shadows.elevated}`}
          style={{
            background: `linear-gradient(135deg, 
              var(--theme-content1, #FAFAFA) 0%, 
              var(--theme-content2, #F4F4F5) 50%, 
              var(--theme-content3, #F1F3F4) 100%)`,
            borderColor: `var(--theme-divider, #E4E4E7)`,
            borderWidth: `var(--borderWidth, 2px)`,
            borderStyle: 'solid',
            borderRadius: 0,
            boxShadow: `
              0 10px 40px -10px var(--theme-primary, #006FEE)15,
              0 0 0 1px var(--theme-divider, #E4E4E7),
              inset 0 1px 0 0 rgba(255,255,255,0.5)
            `,
          }}
        >
          {/* Enhanced Mobile Branding Header */}
          <motion.div 
            className="shrink-0 relative"
            style={{ 
              background: `linear-gradient(135deg, 
                color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent) 0%, 
                color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent) 50%,
                color-mix(in srgb, var(--theme-primary, #006FEE) 5%, transparent) 100%)`,
              borderBottom: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Ambient glow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
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
            
            <div className="p-4 relative z-10">
              {/* Header Row with Close Button */}
              <div className="flex items-center justify-between mb-3">
                <motion.div 
                  className="flex items-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {/* 3D Logo Container */}
                  <motion.div 
                    className="relative"
                    style={{
                      perspective: '500px',
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={{
                      rotateY: 5,
                      scale: 1.05,
                    }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div 
                      className={`w-12 h-12 flex items-center justify-center overflow-hidden ${motionSystem.shadows.elevated}`}
                      style={{ 
                        background: `linear-gradient(135deg, 
                          color-mix(in srgb, var(--theme-primary, #006FEE) 15%, var(--theme-content1, #FFFFFF)) 0%, 
                          color-mix(in srgb, var(--theme-primary, #006FEE) 10%, var(--theme-content1, #FFFFFF)) 100%)`,
                        border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 25%, transparent)`,
                        borderRadius: `var(--borderRadius, 12px)`,
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
                          className="w-9 h-9 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="font-black text-lg absolute inset-0 flex items-center justify-center"
                        style={{ 
                          display: squareLogo ? 'none' : 'flex',
                          color: 'var(--theme-primary, #006FEE)',
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {firstLetter}
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <motion.div 
                      className="absolute -top-1 -right-1 w-3.5 h-3.5"
                      style={{ 
                        backgroundColor: 'var(--theme-success, #17C964)',
                        border: '2px solid var(--theme-background, #FFFFFF)',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px var(--theme-success, #17C964)50',
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                  
                  {/* Brand Info */}
                  <div className="flex flex-col">
                    <h1 
                      className="font-bold text-lg leading-tight"
                      style={{ 
                        color: `var(--theme-primary, #006FEE)`,
                        textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      {app?.name || siteName || 'Company Name'}
                    </h1>
                    <div className="flex items-center gap-1.5">
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
                  </div>
                </motion.div>

                {/* Close Button */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={toggleSideBar}
                    className="w-9 h-9"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 80%, transparent)`,
                      border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                      borderRadius: `var(--borderRadius, 8px)`,
                    }}
                    aria-label="Close sidebar"
                  >
                    <XMarkIcon className="w-5 h-5" style={{ color: 'var(--theme-foreground, #11181C)' }} />
                  </Button>
                </motion.div>
              </div>

              {/* User Quick Info */}
              {auth?.user && (
                <motion.div 
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--theme-content1, #FFFFFF) 80%, transparent)`,
                    border: `1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)`,
                    borderRadius: `var(--borderRadius, 8px)`,
                  }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Badge
                    content=""
                    color="success"
                    shape="circle"
                    placement="bottom-right"
                    size="sm"
                  >
                    <Avatar
                      src={auth.user.avatar}
                      name={auth.user.name}
                      size="sm"
                      className="w-8 h-8"
                      style={{
                        border: `2px solid color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`,
                      }}
                    />
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--theme-foreground, #11181C)' }}
                    >
                      {auth.user.name}
                    </p>
                    <p 
                      className="text-xs truncate"
                      style={{ color: 'var(--theme-foreground-500, #71717A)' }}
                    >
                      {auth.user.designation?.title || auth.user.email}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Scrollable Navigation Content */}
          <motion.div 
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <ScrollShadow className="h-full overflow-y-auto" hideScrollBar={false} size={10}>
              <div className="p-3 space-y-3">
                
                {/* Search */}
                <motion.div className="mb-3">
                  <Input
                    size="md"
                    placeholder="Search navigation..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    startContent={
                      <MagnifyingGlassIcon 
                        className="w-4 h-4" 
                        style={{ color: `var(--theme-foreground-400, #A1A1AA)` }}
                      />
                    }
                    isClearable
                    variant="bordered"
                    classNames={{
                      inputWrapper: "h-10 min-h-10"
                    }}
                    style={{
                      backgroundColor: `var(--theme-content2, #F4F4F5)`,
                      borderColor: `var(--theme-divider, #E4E4E7)`,
                      borderRadius: `var(--borderRadius, 8px)`,
                      borderWidth: `var(--borderWidth, 2px)`,
                    }}
                  />
                </motion.div>
                
                {/* Main Navigation */}
                {groupedPages.mainPages.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <HomeIcon 
                        className="w-4 h-4" 
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
                      <div key={`mobile-main-${page.name}-${index}`}>
                        {renderMenuItem(page)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Settings Section */}
                {groupedPages.settingsPages.length > 0 && (
                  <div className="space-y-1 mt-4">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <ShieldCheckIcon 
                        className="w-4 h-4" 
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
                      <div key={`mobile-settings-${page.name}-${index}`}>
                        {renderMenuItem(page)}
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {searchTerm.trim() && groupedPages.mainPages.length === 0 && groupedPages.settingsPages.length === 0 && (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-10 px-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <MagnifyingGlassIcon 
                      className="w-10 h-10 mb-3" 
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
              </div>
            </ScrollShadow>
          </motion.div>

          {/* Enhanced Footer with Branding */}
          <motion.div 
            className="p-3 shrink-0 relative"
            style={{ 
              background: `linear-gradient(135deg, 
                color-mix(in srgb, var(--theme-success, #17C964) 8%, transparent) 0%, 
                color-mix(in srgb, var(--theme-success, #17C964) 4%, transparent) 100%)`,
              borderTop: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-success, #17C964) 15%, transparent)`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {/* Ambient glow */}
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
              className="flex items-center justify-between p-3 relative"
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
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2"
                  style={{ 
                    backgroundColor: `var(--theme-success, #17C964)`,
                    borderRadius: '50%',
                    boxShadow: `0 0 10px var(--theme-success, #17C964)60`,
                  }}
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                  }}
                />
                <span 
                  className="text-sm font-semibold"
                  style={{ color: `var(--theme-success, #17C964)` }}
                >
                  Online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-medium"
                  style={{ color: `var(--theme-foreground-500, #71717A)` }}
                >
                  Powered by
                </span>
                <span 
                  className="text-xs font-bold"
                  style={{ color: `var(--theme-primary, #006FEE)` }}
                >
                  AEOS
                </span>
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color="primary"
                  className="h-5 text-[10px] font-bold"
                >
                  v2.1
                </Chip>
              </div>
            </Card>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  );
});

MobileSidebar.displayName = 'MobileSidebar';

export default MobileSidebar;
