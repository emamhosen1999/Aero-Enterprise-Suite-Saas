/**
 * Header — aeos365 topbar (matches preview/app-shell.html exactly)
 *
 * Anatomy:
 *   - 14×28 padding, bottom hairline divider
 *   - .crumbs       — mono breadcrumb trail with cyan active segment
 *   - .search       — 320px input with magnifier glyph + ⌘K hint
 *   - .icon-btn[]   — 32×32 cyan-tint buttons (notifications + plus)
 *   - notification pip = 7px amber dot with glow
 *
 * No glass card wrapper, no shimmer, no animated gradients.
 *
 * @see aeos365-design-system/project/preview/app-shell.html (.topbar)
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Tooltip,
  Input,
  Divider,
} from '@heroui/react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

import { useNavigation } from './NavigationProvider';
import { getMenuItemUrl, isItemActive, navigateToItem, getMenuItemId, hasRoute, normalizePath } from './navigationUtils.jsx';
import { useBranding } from '@/Hooks/theme/useBranding';
import ProfileAvatar from '@/Components/Profile/ProfileAvatar';
import LanguageSwitcher from '@/Components/Navigation/LanguageSwitcher';
import { useTheme } from '@/Context/ThemeContext';

const safeRoute = (routeName, fallback = '#') => {
  try { return hasRoute(routeName) ? route(routeName) : fallback; } catch { return fallback; }
};

// ── Crumbs (mono trail with cyan active segment) ─────────────────────────
const Crumbs = React.memo(() => {
  const { tenant, app } = usePage().props || {};
  const { siteName } = useBranding();
  const tenantName = tenant?.name || app?.name || siteName || 'Workspace';
  const path = (typeof window !== 'undefined' ? window.location.pathname : '/').replace(/^\/+/, '');
  const segments = path === '' ? ['Overview'] : path.split('/').map((s) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );

  return (
    <div
      style={{
        fontFamily: 'var(--aeos-font-mono, "JetBrains Mono"), ui-monospace, monospace',
        fontSize: '0.72rem',
        color: 'var(--aeos-ink-muted, #8892A4)',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        minWidth: 0,
      }}
    >
      <span>{tenantName}</span>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={`${seg}-${i}`}>
            <ChevronRightIcon className="w-3 h-3 opacity-40" />
            <span style={isLast ? { color: 'var(--aeos-cyan, #00E5FF)' } : undefined}>{seg}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
});
Crumbs.displayName = 'Crumbs';

// ── Search (320px, ⌘K) ────────────────────────────────────────────────────
const TopbarSearch = React.memo(({ value, onChange, onCommandPalette }) => {
  return (
    <div
      style={{
        marginLeft: 'auto',
        position: 'relative',
        width: 320,
        minWidth: 0,
        flexShrink: 0,
      }}
      className="hidden md:block"
    >
      <button
        type="button"
        onClick={onCommandPalette}
        aria-label="Open command palette (⌘K)"
        style={{
          width: '100%',
          padding: '7px 12px 7px 32px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 6,
          color: 'var(--aeos-ink-muted, #8892A4)',
          fontSize: '0.84rem',
          textAlign: 'left',
          fontFamily: 'var(--aeos-font-body)',
          cursor: 'pointer',
          transition: 'border-color 180ms cubic-bezier(0.22,1,0.36,1), background 180ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.20)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        Search people, reports, runs…
      </button>
      <MagnifyingGlassIcon
        className="w-3.5 h-3.5"
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--aeos-ink-muted)' }}
      />
      <span
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          fontFamily: 'var(--aeos-font-mono)',
          fontSize: '0.65rem',
          padding: '2px 5px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 3,
          color: 'var(--aeos-ink-muted)',
        }}
      >
        ⌘K
      </span>
    </div>
  );
});
TopbarSearch.displayName = 'TopbarSearch';

// ── Icon button (32×32 cyan-tint with optional pip) ──────────────────────
const IconBtn = React.forwardRef(({ children, ariaLabel, pip, pipColor, onClick, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: 32,
      height: 32,
      borderRadius: 6,
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--aeos-ink-muted, #8892A4)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'color 180ms cubic-bezier(0.22,1,0.36,1), border-color 180ms, background 180ms',
      flexShrink: 0,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = 'var(--aeos-cyan, #00E5FF)';
      e.currentTarget.style.borderColor = 'rgba(0,229,255,0.20)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = 'var(--aeos-ink-muted, #8892A4)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
    }}
    {...rest}
  >
    {children}
    {pip && (
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 4, right: 4,
          width: 7, height: 7,
          borderRadius: '50%',
          background: pipColor || 'var(--aeos-amber, #FFB347)',
          boxShadow: `0 0 6px ${pipColor || 'var(--aeos-amber, #FFB347)'}`,
        }}
      />
    )}
  </button>
));
IconBtn.displayName = 'IconBtn';

// ── Profile menu (compact aeos drop) ─────────────────────────────────────
const ProfileMenu = React.memo(({ user }) => {
  const initials = useMemo(() => {
    const n = user?.name || user?.email || '';
    return n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [user]);

  return (
    <Dropdown placement="bottom-end" backdrop="opaque">
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Open profile menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 8px 4px 4px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--aeos-ink, #E8EDF5)',
            cursor: 'pointer',
            transition: 'border-color 180ms cubic-bezier(0.22,1,0.36,1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.20)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
        >
          <span
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--aeos-grad-cyan)',
              color: 'var(--aeos-obsidian)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--aeos-font-mono)',
              fontSize: '0.65rem', fontWeight: 700,
            }}
          >
            {initials}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }} className="hidden sm:inline">
            {user?.name || user?.email || 'Member'}
          </span>
          <ChevronDownIcon className="w-3 h-3 opacity-60" />
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile menu" variant="flat">
        <DropdownSection title={user?.email || 'Account'} showDivider>
          <DropdownItem key="profile" startContent={<UserIcon className="w-4 h-4" />} href={safeRoute('profile', '/profile')}>
            My profile
          </DropdownItem>
          <DropdownItem key="security" startContent={<ShieldCheckIcon className="w-4 h-4" />} href={safeRoute('security', '/profile/security')}>
            Security
          </DropdownItem>
          <DropdownItem key="api-keys" startContent={<KeyIcon className="w-4 h-4" />} href={safeRoute('api-keys', '/profile/api-keys')}>
            API keys
          </DropdownItem>
        </DropdownSection>
        <DropdownSection title="Workspace">
          <DropdownItem key="settings" startContent={<Cog6ToothIcon className="w-4 h-4" />} href={safeRoute('settings', '/settings')}>
            Settings
          </DropdownItem>
          <DropdownItem key="help" startContent={<QuestionMarkCircleIcon className="w-4 h-4" />} href={safeRoute('help', '/help')}>
            Help &amp; support
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
            onPress={() => router.post(safeRoute('logout', '/logout'))}
          >
            Sign out
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
});
ProfileMenu.displayName = 'ProfileMenu';

// ── Header root ──────────────────────────────────────────────────────────
const Header = React.memo(({ showNav = true, className = '' }) => {
  const {
    sidebarOpen, sidebarCollapsed, setMobileDrawerOpen, isMobile, isTablet,
    setSearchTerm, searchTerm, navItems, activePath, user,
  } = useNavigation();

  const onCommandPalette = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aeos:open-command-palette'));
    }
  }, []);

  const unreadCount = user?.unread_notifications ?? 0;

  return (
    <header
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 28px',
        borderBottom: '1px solid var(--aeos-divider)',
        background: 'transparent',
        flexShrink: 0,
        minWidth: 0,
      }}
    >
      {/* Mobile/tablet hamburger */}
      {(isMobile || isTablet) && (
        <IconBtn ariaLabel="Open menu" onClick={() => setMobileDrawerOpen(true)}>
          <Bars3Icon style={{ width: 16, height: 16 }} />
        </IconBtn>
      )}

      <Crumbs />

      <TopbarSearch value={searchTerm} onChange={setSearchTerm} onCommandPalette={onCommandPalette} />

      <LanguageSwitcher />

      <IconBtn ariaLabel="Notifications" pip={unreadCount > 0} onClick={() => router.visit(safeRoute('notifications', '/notifications'))}>
        <BellIcon style={{ width: 15, height: 15 }} />
      </IconBtn>

      <IconBtn ariaLabel="Quick add" onClick={onCommandPalette}>
        <PlusIcon style={{ width: 15, height: 15 }} />
      </IconBtn>

      <ProfileMenu user={user} />
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
