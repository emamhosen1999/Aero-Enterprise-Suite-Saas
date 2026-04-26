/**
 * Sidebar — aeos365 (matches preview/app-shell.html exactly)
 *
 * Width: 240px (collapsed: 64px)
 * Surface: rgba(0,0,0,0.4) translucent over the page mesh, with cyan-tinted
 * right divider. NOT solid onyx — the mesh + grid show through.
 *
 * Anatomy (top → bottom):
 *   1. .side-brand   — diamond glyph + "aeos365" Syne wordmark
 *   2. .ws-switch    — workspace card (logo tile + name + role + chevron)
 *   3. nav sections  — mono kicker (WORKSPACE / INSIGHTS / ADMIN) + items
 *   4. .side-foot    — avatar + name + role + status dot (no buttons)
 *
 * Active nav item: rgba(0,229,255,0.08) bg + cyan border + cyan text.
 * Count badge: cyan-filled with obsidian text when item is active.
 *
 * @see aeos365-design-system/project/preview/app-shell.html
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  ChevronUpDownIcon,
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
} from './navigationUtils.jsx';
import { useBranding } from '@/Hooks/theme/useBranding';
import { useNavigationPersonalization } from '@/Hooks/navigation/useNavigationPersonalization.js';

// ── Diamond glyph (matches spec's `.side-brand .glyph`) ───────────────────
const AeosGlyph = ({ size = 22 }) => (
  <span
    aria-hidden
    style={{
      width: size,
      height: size,
      position: 'relative',
      flexShrink: 0,
      display: 'inline-block',
    }}
  >
    <span style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      background: 'var(--aeos-grad-cyan)',
    }} />
    <span style={{
      position: 'absolute', inset: `${size * 0.18}px ${size * 0.18}px ${size * 0.18}px ${size * 0.41}px`,
      borderRadius: '0 50% 50% 0',
      background: 'var(--aeos-obsidian, #03040A)',
    }} />
  </span>
);

// ── Side brand row ────────────────────────────────────────────────────────
const SidebarBrand = React.memo(({ collapsed, onClose, isMobile }) => {
  const { siteName } = useBranding();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '18px 12px' : '18px 20px',
        borderBottom: '1px solid var(--aeos-divider)',
        fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '1.05rem',
        color: 'var(--aeos-ink, #E8EDF5)',
        letterSpacing: '-0.025em',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}
    >
      <AeosGlyph size={22} />
      {!collapsed && (
        <>
          <span style={{ textTransform: 'lowercase' }}>{(siteName || 'aeos').replace(/365$/, '')}</span>
          <sup style={{ color: 'var(--aeos-cyan, #00E5FF)', fontSize: '0.55rem', fontFamily: 'var(--aeos-font-mono)' }}>365</sup>
          {isMobile && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="shrink-0 ml-auto"
              style={{ color: 'var(--aeos-ink-muted)' }}
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
});
SidebarBrand.displayName = 'SidebarBrand';

// ── Workspace switcher card ───────────────────────────────────────────────
const WorkspaceSwitcher = React.memo(({ collapsed }) => {
  const { app, auth, tenant } = usePage().props || {};
  const { siteName } = useBranding();
  const tenantName = tenant?.name || app?.name || siteName || 'Workspace';
  const roleLabel = auth?.user?.is_super_admin
    ? 'Super admin'
    : auth?.isSuperAdmin || auth?.isPlatformSuperAdmin
      ? 'Platform admin'
      : auth?.isAdmin || auth?.isTenantSuperAdmin
        ? 'Workspace admin'
        : auth?.user?.role_name || 'Member';
  const initial = (tenantName || 'W').charAt(0).toUpperCase();

  if (collapsed) return null;

  return (
    <div
      style={{
        margin: 14,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(0, 229, 255, 0.04)',
        border: '1px solid rgba(0, 229, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'background 180ms cubic-bezier(0.22,1,0.36,1), border-color 180ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 229, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.20)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 229, 255, 0.04)';
        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.12)';
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'var(--aeos-grad-amber)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--aeos-obsidian, #03040A)',
          fontFamily: 'var(--aeos-font-display, "Syne"), system-ui, sans-serif',
          fontWeight: 700,
          fontSize: '0.85rem',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--aeos-ink)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{tenantName}</div>
        <div style={{
          fontSize: '0.68rem',
          color: 'var(--aeos-ink-muted)',
          fontFamily: 'var(--aeos-font-mono)',
        }}>{roleLabel}</div>
      </div>
      <ChevronUpDownIcon className="w-3.5 h-3.5" style={{ color: 'var(--aeos-ink-muted)', flexShrink: 0 }} />
    </div>
  );
});
WorkspaceSwitcher.displayName = 'WorkspaceSwitcher';

// ── Section group kicker (WORKSPACE / INSIGHTS / ADMIN) ──────────────────
const NavGroupKicker = React.memo(({ label, isCollapsible, isCollapsed, onToggle }) => (
  <div
    onClick={isCollapsible ? onToggle : undefined}
    style={{
      fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
      fontSize: '0.6rem',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--aeos-ink-faint, #4A5468)',
      padding: '14px 8px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      cursor: isCollapsible ? 'pointer' : 'default',
      userSelect: 'none',
    }}
  >
    <span style={{ flex: 1 }}>{label}</span>
    {isCollapsible && (
      <motion.span
        animate={{ rotate: isCollapsed ? -90 : 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'inline-flex' }}
      >
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.span>
    )}
  </div>
));
NavGroupKicker.displayName = 'NavGroupKicker';

// ── Search ────────────────────────────────────────────────────────────────
const SidebarSearch = React.memo(({ collapsed, searchTerm, onSearchChange }) => {
  if (collapsed) return null;
  return (
    <div style={{ padding: '6px 14px' }}>
      <Input
        placeholder="Search menus..."
        value={searchTerm}
        onValueChange={onSearchChange}
        size="sm"
        startContent={<MagnifyingGlassIcon className="w-4 h-4" style={{ color: 'var(--aeos-ink-muted)' }} />}
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
        classNames={{ inputWrapper: 'border-none shadow-none', input: 'text-sm' }}
      />
    </div>
  );
});
SidebarSearch.displayName = 'SidebarSearch';

// ── Section labels ────────────────────────────────────────────────────────
const SECTION_LABELS = {
  dashboards: 'WORKSPACE',
  'my-workspace': 'WORKSPACE',
  workspace: 'WORKSPACE',
  modules: 'MODULES',
  hrm: 'HR',
  finance: 'FINANCE',
  crm: 'CRM',
  project: 'PROJECTS',
  ims: 'INVENTORY',
  pos: 'POS',
  scm: 'SUPPLY CHAIN',
  dms: 'DOCUMENTS',
  quality: 'QUALITY',
  rfi: 'RFI',
  compliance: 'COMPLIANCE',
  cms: 'CMS',
  commerce: 'COMMERCE',
  analytics: 'INSIGHTS',
  education: 'EDUCATION',
  healthcare: 'HEALTHCARE',
  'field-service': 'FIELD SERVICE',
  'real-estate': 'REAL ESTATE',
  manufacturing: 'MANUFACTURING',
  administration: 'ADMIN',
  settings: 'SETTINGS',
  main: 'NAVIGATION',
};

// ── Content ───────────────────────────────────────────────────────────────
const SidebarContent = React.memo(({
  menuItems, collapsed, searchTerm, expandedMenus, activePath, onToggleMenu, onNavigate,
}) => {
  const sections = useMemo(() => groupMenuItems(menuItems), [menuItems]);
  const { preferences } = useNavigationPersonalization();

  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const stored = localStorage.getItem('nav_collapsed_sections');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
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
    SECTION_LABELS[key] || key.toUpperCase().replace(/-/g, ' ');

  const pinnedItems = useMemo(() => {
    const paths = preferences?.pinned_items ?? [];
    if (!paths.length) return [];
    const flatten = (items) => items.flatMap((it) => [it, ...(it.subMenu ? flatten(it.subMenu) : [])]);
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

  const renderItems = (items, groupName = '') => items.map((item) => {
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
  });

  // Collapsed (icon-only)
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
    <ScrollShadow className="flex-1 overflow-y-auto" style={{ padding: '6px 14px' }}>
      {!searchTerm && pinnedItems.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <NavGroupKicker label="PINNED" />
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
          <div key={sectionKey}>
            <NavGroupKicker
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
                  <div className="space-y-0.5">{renderItems(items, sectionKey)}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {Object.keys(filteredSections).length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MagnifyingGlassIcon className="w-10 h-10 mb-2" style={{ color: 'var(--aeos-ink-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--aeos-ink-muted)' }}>No results found</p>
        </div>
      )}
    </ScrollShadow>
  );
});
SidebarContent.displayName = 'SidebarContent';

// ── Footer (avatar + name + role + status dot) ───────────────────────────
const SidebarFooter = React.memo(({ collapsed, user, onCollapse }) => {
  const initials = useMemo(() => {
    const n = user?.name || user?.email || '';
    return n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [user]);
  const role = user?.role_name || user?.role || 'Member';

  if (collapsed) {
    return (
      <div
        style={{
          marginTop: 'auto',
          padding: 12,
          borderTop: '1px solid var(--aeos-divider)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--aeos-grad-cyan)',
            color: 'var(--aeos-obsidian)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--aeos-font-mono)',
            fontSize: '0.7rem', fontWeight: 700,
          }}
        >
          {initials}
        </div>
        <Tooltip content="Expand sidebar" placement="right">
          <Button isIconOnly variant="light" size="sm" onPress={onCollapse}>
            <ChevronDoubleRightIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 'auto',
        padding: 14,
        borderTop: '1px solid var(--aeos-divider)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--aeos-grad-cyan)',
          color: 'var(--aeos-obsidian)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--aeos-font-mono)',
          fontSize: '0.72rem', fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: 500, color: 'var(--aeos-ink)', lineHeight: 1.1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.name || user?.email || 'Member'}
        </div>
        <div style={{
          fontSize: '0.68rem', color: 'var(--aeos-ink-muted)',
          fontFamily: 'var(--aeos-font-mono)', marginTop: 2,
        }}>
          {role}
        </div>
      </div>
      <Tooltip content="Collapse sidebar">
        <button
          onClick={onCollapse}
          aria-label="Collapse sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--aeos-ink-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'inline-flex',
          }}
        >
          <ChevronDoubleLeftIcon className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
      <span
        aria-hidden
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--aeos-success, #22C55E)',
          boxShadow: '0 0 6px var(--aeos-success, #22C55E)',
          flexShrink: 0,
        }}
      />
    </div>
  );
});
SidebarFooter.displayName = 'SidebarFooter';

// ── Sidebar root ──────────────────────────────────────────────────────────
const Sidebar = React.memo(({ className = '' }) => {
  const {
    navItems, sidebarOpen, sidebarCollapsed, mobileDrawerOpen, isMobile, user,
    activePath, searchTerm, expandedMenus, toggleSidebar, toggleCollapsed, toggleMenu,
    setSearchTerm, setMobileDrawerOpen, expandParentMenus, setActivePath,
  } = useNavigation();

  useEffect(() => {
    if (activePath && navItems.length > 0) expandParentMenus(activePath, navItems);
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
      setTimeout(() => toggleMenu(menuId), 200);
    } else {
      toggleMenu(menuId);
    }
  }, [toggleMenu, sidebarCollapsed, toggleCollapsed]);

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  // Spec exact: `rgba(0,0,0,0.4)` translucent panel + cyan-tinted right divider + 8px backdrop blur
  const panelStyle = {
    fontFamily: 'var(--aeos-font-body, "DM Sans"), system-ui, sans-serif',
    color: 'var(--aeos-ink, #E8EDF5)',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRight: '1px solid var(--aeos-divider)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
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
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed left-0 top-0 bottom-0 z-50 w-[85vw] max-w-[280px] ${className}`}
              style={panelStyle}
            >
              <SidebarBrand collapsed={false} onClose={() => setMobileDrawerOpen(false)} isMobile />
              <WorkspaceSwitcher collapsed={false} />
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop
  if (!sidebarOpen) return null;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`shrink-0 h-screen sticky top-0 ${className}`}
      style={panelStyle}
    >
      <SidebarBrand collapsed={sidebarCollapsed} onClose={toggleSidebar} isMobile={false} />
      <WorkspaceSwitcher collapsed={sidebarCollapsed} />
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
    </motion.aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
