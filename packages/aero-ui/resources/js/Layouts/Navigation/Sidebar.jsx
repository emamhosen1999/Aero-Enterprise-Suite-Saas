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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
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
import { useNavigationPersonalization } from '@/Hooks/useNavigationPersonalization.js';

// Safe route helper that returns fallback if route doesn't exist
const safeRoute = (routeName, fallback = '#') => {
  try {
    return hasRoute(routeName) ? route(routeName) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * SidebarHeader - Premium branding section with animated effects
 */
const SidebarHeader = React.memo(({ collapsed, onClose, isMobile }) => {
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName?.charAt(0)?.toUpperCase() || 'A';
  
  return (
    <motion.div 
      className="shrink-0 relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, 
          color-mix(in srgb, var(--theme-primary, #006FEE) 8%, var(--theme-content1, #FAFAFA)) 0%, 
          var(--theme-content1, #FAFAFA) 60%,
          color-mix(in srgb, var(--theme-primary, #006FEE) 4%, var(--theme-content1, #FAFAFA)) 100%)`,
        borderBottom: `1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
      }}
    >
      {/* Subtle animated shimmer across header */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, color-mix(in srgb, var(--theme-foreground) 12%, transparent) 50%, transparent 60%)',
          backgroundSize: '250% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
      />

      <div className={`relative flex items-center gap-3 ${collapsed ? 'p-3 justify-center' : 'px-4 py-3.5'}`}>
        {/* Animated Logo — hidden when collapsed since main header shows branding */}
        {!collapsed && (
          <motion.div
            className="shrink-0 relative"
            whileHover={{ scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div 
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary, #006FEE), var(--theme-primary-600, #0050B3))`,
                boxShadow: `0 4px 20px -4px var(--theme-primary, #006FEE)50`,
              }}
            >
              {squareLogo ? (
                <img 
                  src={squareLogo} 
                  alt={siteName} 
                  className="w-8 h-8 object-contain relative z-[1]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-white font-bold text-lg relative z-[1]">{firstLetter}</span>
              )}
            </div>
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-0.5 rounded-xl pointer-events-none"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary, #006FEE)30, transparent, var(--theme-primary, #006FEE)20)`,
                filter: 'blur(2px)',
              }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
        
        {/* Brand name */}
        {!collapsed && (
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h1 
              className="font-bold text-base truncate tracking-tight"
              style={{ color: 'var(--theme-foreground, #11181C)' }}
            >
              {siteName}
            </h1>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--theme-success, #17C964)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p 
                className="text-[11px] truncate font-medium"
                style={{ color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 45%, transparent)' }}
              >
                Enterprise Suite
              </p>
            </div>
          </motion.div>
        )}
        
        {isMobile && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            className="shrink-0"
            style={{ color: 'var(--theme-foreground, #11181C)' }}
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
const SidebarSearch = React.memo(({ collapsed, searchTerm, onSearchChange, onExpandAndSearch }) => {
  if (collapsed) {
    return null;
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
            style={{ color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 45%, transparent)' }}
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
  const sections = useMemo(() => 
    groupMenuItems(menuItems), [menuItems]
  );
  const { preferences } = useNavigationPersonalization();

  // All sections are collapsible
  const COLLAPSIBLE_SECTIONS = { has: () => true };

  // Track which collapsible sections are collapsed (stored in localStorage)
  const [collapsedSections, setCollapsedSections] = React.useState(() => {
    try {
      const stored = localStorage.getItem('nav_collapsed_sections');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleSection = useCallback((sectionKey) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      try {
        localStorage.setItem('nav_collapsed_sections', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  // Section display names and configurations
  const sectionConfig = {
    dashboards: { label: 'Dashboards', color: 'var(--theme-foreground, #11181C)' },
    'my-workspace': { label: 'My Workspace', color: 'var(--theme-foreground, #11181C)' },
    modules: { label: 'Modules', color: 'var(--theme-foreground, #11181C)' },
    administration: { label: 'Administration', color: 'var(--theme-foreground, #11181C)' },
    settings: { label: 'Settings', color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 45%, transparent)' },
    main: { label: 'Navigation', color: 'var(--theme-foreground, #11181C)' },
  };

  // Convert module code to label (e.g., 'hrm' -> 'Human Resources')
  const getModuleLabel = (moduleCode) => {
    const labels = {
      hrm: 'Human Resources',
      finance: 'Finance',
      crm: 'CRM',
      project: 'Project Management',
      ims: 'Inventory Management',
      pos: 'Point of Sale',
      scm: 'Supply Chain Management',
      dms: 'Document Management',
      quality: 'Quality Management',
      rfi: 'RFI',
      compliance: 'Compliance',
      cms: 'Content Management',
      commerce: 'Commerce',
      analytics: 'Analytics',
      education: 'Education',
      healthcare: 'Healthcare',
      'field-service': 'Field Service',
      'real-estate': 'Real Estate',
      manufacturing: 'Manufacturing',
    };
    return labels[moduleCode] || moduleCode.charAt(0).toUpperCase() + moduleCode.slice(1).replace(/-/g, ' ');
  };

  // Resolve pinned nav items from flat paths -> nav tree
  const pinnedItems = useMemo(() => {
    const paths = preferences?.pinned_items ?? [];
    if (!paths.length) return [];
    const flattenItems = (items) => {
      const result = [];
      items.forEach(item => {
        result.push(item);
        if (item.subMenu) result.push(...flattenItems(item.subMenu));
      });
      return result;
    };
    const flat = flattenItems(menuItems);
    return paths.map(p => flat.find(i => getMenuItemUrl(i) === p)).filter(Boolean);
  }, [preferences?.pinned_items, menuItems]);
  
  // Filter sections by search term
  const filteredSections = useMemo(() => {
    const filtered = {};
    Object.entries(sections).forEach(([sectionKey, items]) => {
      const filteredItems = filterMenuItems(items, searchTerm);
      if (filteredItems.length > 0) {
        filtered[sectionKey] = filteredItems;
      }
    });
    return filtered;
  }, [sections, searchTerm]);
  
  const renderMenuItems = useCallback((items, groupName = '') => {
    return items.map((item) => {
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

  // Render section header — collapsible if in COLLAPSIBLE_SECTIONS set
  const renderSectionHeader = (sectionKey) => {
    let config = sectionConfig[sectionKey];
    if (!config) {
      config = { label: getModuleLabel(sectionKey), color: 'var(--theme-foreground, #11181C)' };
    }

    const isCollapsible = COLLAPSIBLE_SECTIONS.has(sectionKey);
    const isSectionCollapsed = collapsedSections.has(sectionKey);

    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 mb-2 rounded ${isCollapsible ? 'cursor-pointer select-none hover:bg-default-100/50' : ''}`}
        onClick={isCollapsible ? () => toggleSection(sectionKey) : undefined}
        style={{ borderRadius: 'var(--borderRadius, 8px)' }}
      >
        <motion.div
          className="w-4 h-[2px] rounded-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }}
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] flex-1"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        {isCollapsible ? (
          <motion.div
            animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: config.color }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        ) : (
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, var(--theme-divider, #E4E4E7)40, transparent)` }} />
        )}
      </div>
    );
  };
  
  if (collapsed) {
    // Icon-only mode - flatten all sections and show tooltips
    const allItems = Object.values(sections).flat();
    const filteredItems = filterMenuItems(allItems, searchTerm);
    
    return (
      <ScrollShadow className="flex-1 py-2 px-2">
        <div className="space-y-1">
          {filteredItems.map((item) => {
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
                    style={{ borderRadius: 'var(--borderRadius, 8px)' }}
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
      {/* Pinned Items */}
      {!searchTerm && pinnedItems.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <motion.div
              className="w-4 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--theme-primary, #006FEE), var(--theme-primary-400, #338EF7))' }}
              animate={{ scaleX: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--theme-primary, #006FEE)' }}
            >
              Pinned
            </span>
          </div>
          <div className="space-y-0.5">
            {pinnedItems.map((item) => {
              const itemId = getMenuItemId(item, 'pinned');
              const itemUrl = getMenuItemUrl(item);
              const active = itemUrl && activePath === itemUrl;
              return (
                <MenuItem3D
                  key={itemId}
                  item={item}
                  level={0}
                  isActive={active}
                  hasActiveChild={false}
                  isExpanded={false}
                  onToggle={() => {}}
                  onNavigate={onNavigate}
                  searchTerm=""
                  variant="sidebar"
                  collapsed={collapsed}
                  parentId="pinned"
                  expandedMenus={expandedMenus}
                  activePath={activePath}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Render sections dynamically */}
      {Object.entries(filteredSections).map(([sectionKey, items]) => {
        const isSectionCollapsed = collapsedSections.has(sectionKey) && !searchTerm;

        return (
          <div key={sectionKey} className="mb-3">
            {renderSectionHeader(sectionKey)}
            <AnimatePresence initial={false}>
              {!isSectionCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="space-y-0.5">
                    {renderMenuItems(items, sectionKey)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      
      {/* Empty state */}
      {Object.keys(filteredSections).length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MagnifyingGlassIcon 
            className="w-10 h-10 mb-2"
            style={{ color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 30%, transparent)' }}
          />
          <p 
            className="text-sm"
            style={{ color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 45%, transparent)' }}
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
  if (collapsed) {
    return (
      <div 
        className="shrink-0 p-2 space-y-1"
        style={{
          borderTop: `1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)`,
        }}
      >
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
    <div 
      className="shrink-0 px-3 py-2.5 flex items-center gap-1"
      style={{
        borderTop: `1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)`,
      }}
    >
      <Tooltip content="Collapse sidebar">
        <Button 
          isIconOnly 
          variant="light" 
          size="sm"
          onPress={onCollapse}
          style={{ borderRadius: 'var(--borderRadius, 8px)' }}
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
          style={{ borderRadius: 'var(--borderRadius, 8px)' }}
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
});

/**
 * Main Sidebar Component
 */
const Sidebar = React.memo(({ className = '' }) => {
  const {
    navItems,
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
    if (activePath && navItems.length > 0) {
      expandParentMenus(activePath, navItems);
    }
  }, [activePath, navItems]);
  
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
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40"
              style={{
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
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
                  fontFamily: 'var(--fontFamily, "Inter")',
                  background: `linear-gradient(180deg, 
                    color-mix(in srgb, var(--theme-content1, #FAFAFA) 92%, transparent) 0%, 
                    color-mix(in srgb, var(--theme-content2, #F4F4F5) 90%, transparent) 100%)`,
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  borderRight: `var(--borderWidth, 1px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)`,
                  boxShadow: '4px 0 30px -5px rgba(0,0,0,0.1)',
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
                  menuItems={navItems}
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
        className="h-full flex flex-col m-3 mr-0 overflow-hidden relative"
        style={{
          fontFamily: 'var(--fontFamily, "Inter")',
          color: 'var(--theme-foreground, #11181C)',
          background: `linear-gradient(180deg, 
            color-mix(in srgb, var(--theme-content1, #FAFAFA) 92%, transparent) 0%, 
            color-mix(in srgb, var(--theme-content2, #F4F4F5) 90%, transparent) 100%)`,
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: `var(--borderWidth, 1px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)`,
          borderRadius: `var(--borderRadius, 12px)`,
          boxShadow: `
            0 20px 60px -15px rgba(0,0,0,0.08),
            0 0 0 1px color-mix(in srgb, var(--theme-divider, #E4E4E7) 30%, transparent),
            inset 0 1px 0 0 color-mix(in srgb, var(--theme-content4, #D4D4D8) 20%, transparent)
          `,
        }}
      >
        {/* Animated accent strip on left edge */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-[2px] z-10"
          style={{
            background: `linear-gradient(180deg, 
              var(--theme-primary, #006FEE)60, 
              var(--theme-primary, #006FEE)20, 
              var(--theme-primary, #006FEE)05,
              transparent)`,
            borderRadius: 'var(--borderRadius, 12px) 0 0 var(--borderRadius, 12px)',
          }}
          animate={{ 
            background: [
              'linear-gradient(180deg, var(--theme-primary, #006FEE)60, var(--theme-primary, #006FEE)20, transparent)',
              'linear-gradient(180deg, var(--theme-primary, #006FEE)30, var(--theme-primary, #006FEE)50, var(--theme-primary, #006FEE)20)',
              'linear-gradient(180deg, var(--theme-primary, #006FEE)60, var(--theme-primary, #006FEE)20, transparent)',
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <SidebarHeader 
          collapsed={sidebarCollapsed} 
          onClose={toggleSidebar}
          isMobile={false}
        />
        <SidebarSearch 
          collapsed={sidebarCollapsed}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onExpandAndSearch={toggleCollapsed}
        />
        <SidebarContent 
          menuItems={navItems}
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
