/**
 * Sidebar - Main sidebar navigation component
 * 
 * Features:
 * - Responsive design (mobile drawer / desktop sidebar)
 * - Collapsible to icon mode
 * - 3D styling with hover effects
 * - Infinite nested menus
 * - Search functionality
 * - Scrollable content
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Tooltip,
  Kbd,
  ScrollShadow,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

import { useNavigation, motion3DConfig } from './NavigationProvider';
import MenuItem3D from './MenuItem3D';
import { 
  filterMenuItems, 
  groupMenuItems, 
  getMenuItemUrl, 
  isItemActive,
  getMenuItemId,
  navigateToItem,
  hasRoute,
} from './navigationUtils.jsx';
import { useBranding } from '@/Hooks/useBranding';
import ProfileAvatar from '@/Components/ProfileAvatar';

// Safe route helper that returns fallback if route doesn't exist
const safeRoute = (routeName, fallback = '#') => {
  try {
    return hasRoute(routeName) ? route(routeName) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * SidebarHeader - Branding section at top
 */
const SidebarHeader = React.memo(({ collapsed, onClose, isMobile }) => {
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName?.charAt(0)?.toUpperCase() || 'A';
  
  return (
    <motion.div 
      className="shrink-0 relative"
      style={{
        background: `linear-gradient(135deg, 
          color-mix(in srgb, var(--theme-primary, #006FEE) 10%, var(--theme-content1, #FAFAFA)) 0%, 
          var(--theme-content1, #FAFAFA) 100%)`,
        borderBottom: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
      }}
    >
      <div className={`flex items-center gap-3 ${collapsed ? 'p-3 justify-center' : 'p-4'}`}>
        {/* Logo */}
        <motion.div
          className={`shrink-0 ${collapsed ? '' : ''}`}
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            perspective: '500px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div 
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--theme-primary, #006FEE), var(--theme-primary-600, #0050B3))`,
              boxShadow: `0 4px 15px -3px var(--theme-primary, #006FEE)40`,
            }}
          >
            {squareLogo ? (
              <img 
                src={squareLogo} 
                alt={siteName} 
                className="w-8 h-8 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-white font-bold text-lg">{firstLetter}</span>
            )}
          </div>
        </motion.div>
        
        {/* Brand name - hidden when collapsed */}
        {!collapsed && (
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 
              className="font-bold text-lg truncate"
              style={{ color: 'var(--theme-foreground, #11181C)' }}
            >
              {siteName}
            </h1>
            <p 
              className="text-xs truncate"
              style={{ color: 'var(--theme-foreground-500, #71717A)' }}
            >
              Enterprise Suite
            </p>
          </motion.div>
        )}
        
        {/* Close button for mobile */}
        {isMobile && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            className="shrink-0"
            style={{
              color: 'var(--theme-foreground, #11181C)',
            }}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});

/**
 * SidebarSearch - Search bar component
 */
const SidebarSearch = React.memo(({ collapsed, searchTerm, onSearchChange }) => {
  if (collapsed) {
    return (
      <div className="p-2">
        <Tooltip content="Search (⌘K)" placement="right">
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            className="w-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)',
              borderRadius: 'var(--borderRadius, 8px)',
            }}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    );
  }
  
  return (
    <div className="p-3 pb-2">
      <Input
        placeholder="Search menus..."
        value={searchTerm}
        onValueChange={onSearchChange}
        size="sm"
        startContent={
          <MagnifyingGlassIcon 
            className="w-4 h-4"
            style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
          />
        }
        endContent={
          searchTerm ? (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => onSearchChange('')}
              className="min-w-6 w-6 h-6"
            >
              <XMarkIcon className="w-3 h-3" />
            </Button>
          ) : (
            <Kbd className="hidden sm:inline-flex" keys={["command"]}>K</Kbd>
          )
        }
        classNames={{
          inputWrapper: "bg-default-100/50 border-none shadow-none",
          input: "text-sm"
        }}
        style={{
          borderRadius: 'var(--borderRadius, 8px)',
        }}
      />
    </div>
  );
});

/**
 * SidebarContent - Scrollable navigation content
 */
const SidebarContent = React.memo(({ 
  menuItems, 
  collapsed, 
  searchTerm,
  expandedMenus,
  activePath,
  onToggleMenu,
  onNavigate,
}) => {
  const { mainItems, settingsItems } = useMemo(() => 
    groupMenuItems(menuItems), [menuItems]
  );
  
  const filteredMainItems = useMemo(() => 
    filterMenuItems(mainItems, searchTerm), [mainItems, searchTerm]
  );
  
  const filteredSettingsItems = useMemo(() => 
    filterMenuItems(settingsItems, searchTerm), [settingsItems, searchTerm]
  );
  
  const renderMenuItems = useCallback((items, groupName = '') => {
    return items.map((item, index) => {
      const itemId = getMenuItemId(item, groupName);
      const itemUrl = getMenuItemUrl(item);
      const active = itemUrl && activePath === itemUrl;
      const hasActiveChild = isItemActive(item, activePath) && !active;
      const expanded = expandedMenus.has(itemId) || (searchTerm && item.subMenu?.length > 0);
      
      return (
        <MenuItem3D
          key={itemId}
          item={item}
          level={0}
          isActive={active}
          hasActiveChild={hasActiveChild}
          isExpanded={expanded}
          onToggle={(id) => onToggleMenu(id)}
          onNavigate={onNavigate}
          searchTerm={searchTerm}
          variant="sidebar"
          collapsed={collapsed}
          parentId={groupName}
          expandedMenus={expandedMenus}
          activePath={activePath}
        />
      );
    });
  }, [expandedMenus, activePath, searchTerm, collapsed, onToggleMenu, onNavigate]);
  
  if (collapsed) {
    // Icon-only mode - show tooltip on hover
    return (
      <ScrollShadow className="flex-1 py-2 px-2">
        <div className="space-y-1">
          {filteredMainItems.map((item, index) => {
            const itemId = getMenuItemId(item, 'main');
            const itemUrl = getMenuItemUrl(item);
            const active = itemUrl && activePath === itemUrl;
            
            return (
              <Tooltip 
                key={itemId} 
                content={item.name} 
                placement="right"
                delay={200}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    isIconOnly
                    variant={active ? "solid" : "light"}
                    color={active ? "primary" : "default"}
                    size="sm"
                    className="w-full"
                    onPress={() => {
                      if (item.subMenu?.length > 0) {
                        onToggleMenu(itemId);
                      } else if (itemUrl) {
                        onNavigate(item);
                      }
                    }}
                    style={{
                      borderRadius: 'var(--borderRadius, 8px)',
                    }}
                  >
                    {item.icon && React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                  </Button>
                </motion.div>
              </Tooltip>
            );
          })}
        </div>
      </ScrollShadow>
    );
  }
  
  return (
    <ScrollShadow className="flex-1 py-2 px-3 overflow-y-auto">
      {/* Main Navigation */}
      {filteredMainItems.length > 0 && (
        <div className="mb-4">
          <div 
            className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
          >
            Navigation
          </div>
          <div className="space-y-0.5">
            {renderMenuItems(filteredMainItems, 'main')}
          </div>
        </div>
      )}
      
      {/* Settings Group */}
      {filteredSettingsItems.length > 0 && (
        <div className="mb-4">
          <div 
            className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
          >
            Settings
          </div>
          <div className="space-y-0.5">
            {renderMenuItems(filteredSettingsItems, 'settings')}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {filteredMainItems.length === 0 && filteredSettingsItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MagnifyingGlassIcon 
            className="w-10 h-10 mb-2"
            style={{ color: 'var(--theme-foreground-300, #D4D4D8)' }}
          />
          <p 
            className="text-sm"
            style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
          >
            No results found
          </p>
        </div>
      )}
    </ScrollShadow>
  );
});

/**
 * SidebarFooter - User info and actions
 */
const SidebarFooter = React.memo(({ collapsed, user, onCollapse }) => {
  const handleLogout = useCallback(() => {
    const logoutUrl = safeRoute('logout', '/logout');
    router.post(logoutUrl);
  }, []);
  
  if (collapsed) {
    return (
      <div 
        className="shrink-0 p-2 space-y-1"
        style={{
          borderTop: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
        }}
      >
        <Tooltip content={user?.name || 'User'} placement="right">
          <Button isIconOnly variant="light" size="sm" className="w-full">
            <ProfileAvatar 
              size="sm"
              src={user?.profile_image_url || user?.profile_image}
              name={user?.name}
            />
          </Button>
        </Tooltip>
        
        <Tooltip content="Expand sidebar" placement="right">
          <Button 
            isIconOnly 
            variant="light" 
            size="sm" 
            className="w-full"
            onPress={onCollapse}
          >
            <ChevronDoubleRightIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="shrink-0"
      style={{
        borderTop: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
        background: `linear-gradient(135deg, 
          var(--theme-content1, #FAFAFA) 0%, 
          color-mix(in srgb, var(--theme-primary, #006FEE) 5%, var(--theme-content1, #FAFAFA)) 100%)`,
      }}
    >
      {/* User info */}
      <div className="p-3 flex items-center gap-3">
        <div className="relative">
          <ProfileAvatar 
            size="sm"
            src={user?.profile_image_url || user?.profile_image}
            name={user?.name}
            className="ring-2 ring-white shadow-md"
          />
          <div 
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: 'var(--theme-success, #17C964)',
              borderColor: 'var(--theme-background, #FFFFFF)',
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p 
            className="font-semibold text-sm truncate"
            style={{ color: 'var(--theme-foreground, #11181C)' }}
          >
            {user?.name || 'User'}
          </p>
          <p 
            className="text-xs truncate"
            style={{ color: 'var(--theme-foreground-500, #71717A)' }}
          >
            {user?.role?.name || user?.designation?.title || 'Team Member'}
          </p>
        </div>
      </div>
      
      {/* Actions */}
      <div 
        className="px-3 pb-3 flex items-center gap-1"
      >
        <Tooltip content="Collapse sidebar">
          <Button 
            isIconOnly 
            variant="light" 
            size="sm"
            onPress={onCollapse}
            style={{
              borderRadius: 'var(--borderRadius, 8px)',
            }}
          >
            <ChevronDoubleLeftIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="Settings">
          <Button 
            isIconOnly 
            variant="light" 
            size="sm"
            as={Link}
            href={safeRoute('settings', '/settings')}
            style={{
              borderRadius: 'var(--borderRadius, 8px)',
            }}
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <div className="flex-1" />
        
        <Tooltip content="Logout">
          <Button 
            isIconOnly 
            variant="light" 
            size="sm"
            color="danger"
            onPress={handleLogout}
            style={{
              borderRadius: 'var(--borderRadius, 8px)',
            }}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </motion.div>
  );
});

/**
 * Main Sidebar Component
 */
const Sidebar = React.memo(({ pages = [], className = '' }) => {
  const {
    sidebarOpen,
    sidebarCollapsed,
    mobileDrawerOpen,
    isMobile,
    isTablet,
    user,
    activePath,
    searchTerm,
    expandedMenus,
    toggleSidebar,
    toggleCollapsed,
    toggleMenu,
    setSearchTerm,
    setMobileDrawerOpen,
    expandParentMenus,
    setActivePath,
  } = useNavigation();
  
  // Auto-expand parent menus for active item
  useEffect(() => {
    if (activePath && pages.length > 0) {
      expandParentMenus(activePath, pages);
    }
  }, [activePath, pages]);
  
  // Handle navigation
  const handleNavigate = useCallback((item) => {
    const url = getMenuItemUrl(item);
    if (url) {
      setActivePath(url);
      setSearchTerm('');
      if (isMobile) {
        setMobileDrawerOpen(false);
      }
      navigateToItem(item);
    }
  }, [isMobile, setActivePath, setSearchTerm, setMobileDrawerOpen]);
  
  // Handle menu toggle
  const handleToggleMenu = useCallback((menuId) => {
    // If sidebar is collapsed and menu has submenu, expand sidebar first
    if (sidebarCollapsed) {
      toggleCollapsed();
      // Delay menu toggle to allow sidebar animation to complete
      setTimeout(() => {
        toggleMenu(menuId);
      }, 200);
    } else {
      toggleMenu(menuId);
    }
  }, [toggleMenu, sidebarCollapsed, toggleCollapsed]);
  
  const sidebarWidth = sidebarCollapsed ? 72 : 320;
  
  // Mobile Drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[85vw] max-w-[320px]"
            >
              <Card
                className={`h-full flex flex-col ${className}`}
                style={{
                  borderRadius: 0,
                  background: `linear-gradient(180deg, 
                    var(--theme-content1, #FAFAFA) 0%, 
                    var(--theme-content2, #F4F4F5) 100%)`,
                  borderRight: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                }}
              >
                <SidebarHeader 
                  collapsed={false} 
                  onClose={() => setMobileDrawerOpen(false)}
                  isMobile={true}
                />
                <SidebarSearch 
                  collapsed={false}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
                <SidebarContent 
                  menuItems={pages}
                  collapsed={false}
                  searchTerm={searchTerm}
                  expandedMenus={expandedMenus}
                  activePath={activePath}
                  onToggleMenu={handleToggleMenu}
                  onNavigate={handleNavigate}
                />
                <SidebarFooter 
                  collapsed={false}
                  user={user}
                  onCollapse={toggleCollapsed}
                />
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
  
  // Desktop Sidebar
  if (!sidebarOpen) return null;
  
  return (
    <motion.div
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={`shrink-0 h-screen sticky top-0 ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <Card
        className="h-full flex flex-col m-3 mr-0 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, 
            var(--theme-content1, #FAFAFA) 0%, 
            var(--theme-content2, #F4F4F5) 100%)`,
          border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
          borderRadius: `var(--borderRadius, 12px)`,
          boxShadow: `
            0 10px 40px -10px rgba(0,0,0,0.1),
            0 0 0 1px var(--theme-divider, #E4E4E7),
            inset 0 1px 0 0 rgba(255,255,255,0.5)
          `,
        }}
      >
        <SidebarHeader 
          collapsed={sidebarCollapsed} 
          onClose={toggleSidebar}
          isMobile={false}
        />
        <SidebarSearch 
          collapsed={sidebarCollapsed}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <SidebarContent 
          menuItems={pages}
          collapsed={sidebarCollapsed}
          searchTerm={searchTerm}
          expandedMenus={expandedMenus}
          activePath={activePath}
          onToggleMenu={handleToggleMenu}
          onNavigate={handleNavigate}
        />
        <SidebarFooter 
          collapsed={sidebarCollapsed}
          user={user}
          onCollapse={toggleCollapsed}
        />
      </Card>
    </motion.div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
