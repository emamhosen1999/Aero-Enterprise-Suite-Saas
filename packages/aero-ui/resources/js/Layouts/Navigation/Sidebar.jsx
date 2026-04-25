/**
 * Sidebar — aeos365 navigation
 *
 * Surface: --aeos-onyx with right border at rgba(0,229,255,0.08).
 * No 3D perspective, no gradient washes, no animated background colors.
 * Brand wordmark uses Syne 700 (lowercase). Section headers use the
 * .aeos-label-mono kicker (UPPERCASE JetBrains Mono +0.15em tracking).
 *
 * Preserved features: collapsible (264 / 64 px), icon-only collapsed mode,
 * mobile drawer, infinite nested menus via MenuItem3D, search, pinned items,
 * collapsible section groups, settings shortcut.
 *
 * @see aeos365-design-system/project/colors_and_type.css
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Input,
  Button,
  Tooltip,
  Kbd,
  ScrollShadow,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

import { useNavigation } from './NavigationProvider';
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
import { useBranding } from '@/Hooks/theme/useBranding';
import { useNavigationPersonalization } from '@/Hooks/navigation/useNavigationPersonalization.js';

const safeRoute = (routeName, fallback = '#') => {
  try {
    return hasRoute(routeName) ? route(routeName) : fallback;
  } catch {
    return fallback;
  }
};

// ── Header ─────────────────────────────────────────────────────────────────
const SidebarHeader = React.memo(({ collapsed, onClose, isMobile }) => {
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div
      className="shrink-0 relative"
      style={{
        background: 'var(--aeos-onyx, #070B14)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
      }}
    >
      <div className={`flex items-center gap-3 ${collapsed ? 'p-3 justify-center' : 'px-4 py-3.5'}`}>
        {!collapsed && (
          <div className="shrink-0 relative">
            <div
              className="w-10 h-10 flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'var(--aeos-grad-cyan)',
                borderRadius: 10,
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.20)',
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
                <span className="font-bold text-lg relative z-[1]" style={{ color: 'var(--aeos-obsidian, #03040A)' }}>{firstLetter}</span>
              )}
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1
              className="truncate"
              style={{
                fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '-0.025em',
                color: 'var(--aeos-ink, #E8EDF5)',
                lineHeight: 1.1,
                textTransform: 'lowercase',
              }}
            >
              {siteName}
            </h1>
            <p
              className="truncate mt-0.5"
              style={{
                fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--aeos-ink-muted, #8892A4)',
                fontWeight: 500,
              }}
            >
              Enterprise Suite
            </p>
          </div>
        )}

        {isMobile && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            className="shrink-0"
            style={{ color: 'var(--aeos-ink, #E8EDF5)' }}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
});
SidebarHeader.displayName = 'SidebarHeader';

// ── Search ─────────────────────────────────────────────────────────────────
const SidebarSearch = React.memo(({ collapsed, searchTerm, onSearchChange }) => {
  if (collapsed) return null;

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
            style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
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
            <Kbd className="hidden sm:inline-flex" keys={['command']}>K</Kbd>
          )
        }
        classNames={{
          inputWrapper: 'border-none shadow-none',
          input: 'text-sm',
        }}
      />
    </div>
  );
});
SidebarSearch.displayName = 'SidebarSearch';

// ── Section header (.aeos-label-mono kicker) ──────────────────────────────
const SectionHeader = React.memo(({ label, isCollapsible, isCollapsed, onToggle }) => (
  <div
    className={`flex items-center gap-2 px-2 py-1.5 mb-2 rounded ${isCollapsible ? 'cursor-pointer select-none' : ''}`}
    onClick={isCollapsible ? onToggle : undefined}
  >
    <span
      className="w-3 h-px shrink-0"
      style={{ background: 'rgba(0, 229, 255, 0.30)' }}
    />
    <span
      className="aeos-label-mono flex-1"
      style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
    >
      {label}
    </span>
    {isCollapsible ? (
      <motion.span
        animate={{ rotate: isCollapsed ? -90 : 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex shrink-0"
        style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.span>
    ) : (
      <span
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(90deg, rgba(0,229,255,0.18), transparent)' }}
      />
    )}
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// ── Content ───────────────────────────────────────────────────────────────
const MODULE_LABELS = {
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

const SECTION_LABELS = {
  dashboards: 'Dashboards',
  'my-workspace': 'Workspace',
  modules: 'Modules',
  administration: 'Administration',
  settings: 'Settings',
  main: 'Navigation',
};

const SidebarContent = React.memo(({
  menuItems,
  collapsed,
  searchTerm,
  expandedMenus,
  activePath,
  onToggleMenu,
  onNavigate,
}) => {
  const sections = useMemo(() => groupMenuItems(menuItems), [menuItems]);
  const { preferences } = useNavigationPersonalization();

  const [collapsedSections, setCollapsedSections] = React.useState(() => {
    try {
      const stored = localStorage.getItem('nav_collapsed_sections');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleSection = useCallback((sectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey); else next.add(sectionKey);
      try { localStorage.setItem('nav_collapsed_sections', JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  }, []);

  const getSectionLabel = (key) =>
    SECTION_LABELS[key] || MODULE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');

  const pinnedItems = useMemo(() => {
    const paths = preferences?.pinned_items ?? [];
    if (!paths.length) return [];
    const flatten = (items) => {
      const out = [];
      items.forEach((item) => {
        out.push(item);
        if (item.subMenu) out.push(...flatten(item.subMenu));
      });
      return out;
    };
    const flat = flatten(menuItems);
    return paths.map((p) => flat.find((i) => getMenuItemUrl(i) === p)).filter(Boolean);
  }, [preferences?.pinned_items, menuItems]);

  const filteredSections = useMemo(() => {
    const out = {};
    Object.entries(sections).forEach(([key, items]) => {
      const filtered = filterMenuItems(items, searchTerm);
      if (filtered.length > 0) out[key] = filtered;
    });
    return out;
  }, [sections, searchTerm]);

  const renderMenuItems = useCallback((items, groupName = '') => items.map((item) => {
    const itemId = getMenuItemId(item, groupName);
    const itemUrl = getMenuItemUrl(item);
    const active = itemUrl && activePath === itemUrl;
    const hasActiveChild = isItemActive(item, activePath) && !active;
    const expanded = expandedMenus.has(itemId) || (!!searchTerm && (item.subMenu?.length > 0 || item.children?.length > 0));

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
  }), [expandedMenus, activePath, searchTerm, collapsed, onToggleMenu, onNavigate]);

  // Collapsed (icon-only) mode
  if (collapsed) {
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
              <Tooltip key={itemId} content={item.name} placement="right" delay={200}>
                <Button
                  isIconOnly
                  variant={active ? 'solid' : 'light'}
                  color={active ? 'primary' : 'default'}
                  size="sm"
                  className="w-full"
                  onPress={() => {
                    if (item.subMenu?.length > 0) onToggleMenu(itemId);
                    else if (itemUrl) onNavigate(item);
                  }}
                >
                  {item.icon && React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                </Button>
              </Tooltip>
            );
          })}
        </div>
      </ScrollShadow>
    );
  }

  return (
    <ScrollShadow className="flex-1 py-2 px-3 overflow-y-auto">
      {!searchTerm && pinnedItems.length > 0 && (
        <div className="mb-3">
          <SectionHeader label="Pinned" isCollapsible={false} />
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
                  collapsed={false}
                  parentId="pinned"
                  expandedMenus={expandedMenus}
                  activePath={activePath}
                />
              );
            })}
          </div>
        </div>
      )}

      {Object.entries(filteredSections).map(([sectionKey, items]) => {
        const isSectionCollapsed = collapsedSections.has(sectionKey) && !searchTerm;
        return (
          <div key={sectionKey} className="mb-3">
            <SectionHeader
              label={getSectionLabel(sectionKey)}
              isCollapsible
              isCollapsed={isSectionCollapsed}
              onToggle={() => toggleSection(sectionKey)}
            />
            <AnimatePresence initial={false}>
              {!isSectionCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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

      {Object.keys(filteredSections).length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MagnifyingGlassIcon
            className="w-10 h-10 mb-2"
            style={{ color: 'var(--aeos-ink-faint, #4A5468)' }}
          />
          <p className="text-sm" style={{ color: 'var(--aeos-ink-muted, #8892A4)' }}>
            No results found
          </p>
        </div>
      )}
    </ScrollShadow>
  );
});
SidebarContent.displayName = 'SidebarContent';

// ── Footer ─────────────────────────────────────────────────────────────────
const SidebarFooter = React.memo(({ collapsed, user, onCollapse }) => {
  const footerStyle = {
    borderTop: '1px solid rgba(0, 229, 255, 0.08)',
    background: 'var(--aeos-onyx, #070B14)',
  };

  if (collapsed) {
    return (
      <div className="shrink-0 p-2 space-y-1" style={footerStyle}>
        <Tooltip content="Expand sidebar" placement="right">
          <Button isIconOnly variant="light" size="sm" className="w-full" onPress={onCollapse}>
            <ChevronDoubleRightIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-3 py-2.5 flex items-center gap-1" style={footerStyle}>
      <Tooltip content="Collapse sidebar">
        <Button isIconOnly variant="light" size="sm" onPress={onCollapse}>
          <ChevronDoubleLeftIcon className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Settings">
        <Button isIconOnly variant="light" size="sm" as={Link} href={safeRoute('settings', '/settings')}>
          <Cog6ToothIcon className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
});
SidebarFooter.displayName = 'SidebarFooter';

// ── Sidebar root ──────────────────────────────────────────────────────────
const Sidebar = React.memo(({ className = '' }) => {
  const {
    navItems,
    sidebarOpen,
    sidebarCollapsed,
    mobileDrawerOpen,
    isMobile,
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

  useEffect(() => {
    if (activePath && navItems.length > 0) {
      expandParentMenus(activePath, navItems);
    }
  }, [activePath, navItems, expandParentMenus]);

  const handleNavigate = useCallback((item) => {
    const url = getMenuItemUrl(item);
    if (url) {
      setActivePath(url);
      setSearchTerm('');
      if (isMobile) setMobileDrawerOpen(false);
      navigateToItem(item);
    }
  }, [isMobile, setActivePath, setSearchTerm, setMobileDrawerOpen]);

  const handleToggleMenu = useCallback((menuId) => {
    if (sidebarCollapsed) {
      toggleCollapsed();
      setTimeout(() => { toggleMenu(menuId); }, 200);
    } else {
      toggleMenu(menuId);
    }
  }, [toggleMenu, sidebarCollapsed, toggleCollapsed]);

  const sidebarWidth = sidebarCollapsed ? 64 : 264;

  // Common Card style — flat aeos onyx panel
  const cardStyle = {
    fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
    color: 'var(--aeos-ink, #E8EDF5)',
    background: 'var(--aeos-onyx, #070B14)',
    border: '1px solid rgba(0, 229, 255, 0.08)',
    borderRadius: 0,
    boxShadow: 'none',
  };

  // Mobile Drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-40"
              style={{
                background: 'rgba(3, 4, 10, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onClick={() => setMobileDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[85vw] max-w-[320px]"
            >
              <Card
                className={`h-full flex flex-col ${className}`}
                style={{ ...cardStyle, borderRight: '1px solid rgba(0, 229, 255, 0.08)' }}
              >
                <SidebarHeader collapsed={false} onClose={() => setMobileDrawerOpen(false)} isMobile />
                <SidebarSearch collapsed={false} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <SidebarContent
                  menuItems={navItems}
                  collapsed={false}
                  searchTerm={searchTerm}
                  expandedMenus={expandedMenus}
                  activePath={activePath}
                  onToggleMenu={handleToggleMenu}
                  onNavigate={handleNavigate}
                />
                <SidebarFooter collapsed={false} user={user} onCollapse={toggleCollapsed} />
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
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`shrink-0 h-screen sticky top-0 ${className}`}
    >
      <Card
        className="h-full flex flex-col overflow-hidden relative"
        style={{ ...cardStyle, borderRight: '1px solid rgba(0, 229, 255, 0.08)' }}
      >
        <SidebarHeader collapsed={sidebarCollapsed} onClose={toggleSidebar} isMobile={false} />
        <SidebarSearch collapsed={sidebarCollapsed} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <SidebarContent
          menuItems={navItems}
          collapsed={sidebarCollapsed}
          searchTerm={searchTerm}
          expandedMenus={expandedMenus}
          activePath={activePath}
          onToggleMenu={handleToggleMenu}
          onNavigate={handleNavigate}
        />
        <SidebarFooter collapsed={sidebarCollapsed} user={user} onCollapse={toggleCollapsed} />
      </Card>
    </motion.div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
