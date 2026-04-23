/**
 * Header — Premium glassmorphic header
 *
 * Visual language matches Sidebar (blur, saturation, accent strips, glow rings).
 * Glassmorphism card · animated logo glow · glass search · pulse bell · accent strip.
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Badge,
  Tooltip,
  Input,
  Divider,
} from "@heroui/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  KeyIcon,
  BellAlertIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

import { useNavigation } from './NavigationProvider';
import { getMenuItemUrl, isItemActive, navigateToItem, getMenuItemId, hasRoute, normalizePath } from './navigationUtils.jsx';
import { useBranding } from '@/Hooks/theme/useBranding';
import ProfileAvatar from '@/Components/Profile/ProfileAvatar';
import LanguageSwitcher from '@/Components/Navigation/LanguageSwitcher';
import { useTheme } from '@/Context/ThemeContext';

const safeRoute = (routeName, fallback = '#') => {
  try {
    return hasRoute(routeName) ? route(routeName) : fallback;
  } catch {
    return fallback;
  }
};

/* ─── keyframe styles injected once ─── */
const headerKeyframes = `
@keyframes headerShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes headerAccentFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes headerGlowPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
@keyframes bellSwing {
  0% { transform: rotate(0deg); }
  15% { transform: rotate(12deg); }
  30% { transform: rotate(-10deg); }
  45% { transform: rotate(6deg); }
  60% { transform: rotate(-4deg); }
  75% { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}
`;

/* ─── HeaderLogo ─── */
const HeaderLogo = React.memo(({ onMenuClick, isMobile, showMenuButton = false }) => {
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="flex items-center gap-3 shrink-0">
      {showMenuButton && (
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={onMenuClick}
            className="shrink-0"
          >
            <Bars3Icon className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      <Link
        href={safeRoute('dashboard', '/dashboard')}
        className="flex items-center gap-3 group"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="relative"
        >
          {/* Glow ring */}
          <div
            className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `conic-gradient(from 0deg, var(--theme-primary, #006FEE), transparent, var(--theme-primary, #006FEE))`,
              filter: 'blur(6px)',
              animation: 'headerGlowPulse 2s ease-in-out infinite',
            }}
          />
          <div
            className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--theme-primary, #006FEE), color-mix(in srgb, var(--theme-primary, #006FEE) 70%, #000))`,
              boxShadow: `0 4px 16px -2px color-mix(in srgb, var(--theme-primary, #006FEE) 40%, transparent)`,
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
              <span className="text-white font-bold text-lg drop-shadow-sm">{firstLetter}</span>
            )}
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--theme-foreground) 25%, transparent) 50%, transparent 70%)',
                animation: 'headerShimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        </motion.div>

        {!isMobile && (
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span
              className="font-bold text-lg leading-tight tracking-tight"
              style={{ color: 'var(--theme-foreground, #11181C)' }}
            >
              {siteName}
            </span>
            <span
              className="text-[10px] font-medium tracking-wider uppercase"
              style={{ color: 'var(--theme-primary, #006FEE)', opacity: 0.7 }}
            >
              Enterprise Suite
            </span>
          </motion.div>
        )}
      </Link>
    </div>
  );
});

/* ─── HeaderNavItem ─── */
const HeaderNavItem = React.memo(({
  item,
  isActive,
  hasActiveChild,
  onNavigate,
}) => {
  const hasSubMenu = item.subMenu && item.subMenu.length > 0;
  const isHighlighted = isActive || hasActiveChild;

  if (hasSubMenu) {
    return (
      <Dropdown placement="bottom-start">
        <DropdownTrigger>
          <Button
            variant={isHighlighted ? "flat" : "light"}
            color={isHighlighted ? "primary" : "default"}
            size="sm"
            endContent={
              <motion.div animate={{ rotate: 0 }} whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <ChevronDownIcon className="w-3 h-3" />
              </motion.div>
            }
            className="gap-1"
            style={{ borderRadius: 'var(--borderRadius, 8px)' }}
          >
            {item.icon && React.cloneElement(item.icon, { className: 'w-4 h-4' })}
            <span className="text-xs font-medium">{item.name}</span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={`${item.name} submenu`}
          onAction={(key) => {
            const subItem = item.subMenu.find((s, i) => getMenuItemId(s, `${item.name}-${i}`) === key);
            if (subItem) onNavigate(subItem);
          }}
        >
          {item.subMenu.map((subItem, index) => {
            const subItemId = getMenuItemId(subItem, `${item.name}-${index}`);
            const subUrl = getMenuItemUrl(subItem);
            const isSubActive = subUrl && normalizePath(window.location.pathname) === subUrl;

            return (
              <DropdownItem
                key={subItemId}
                startContent={subItem.icon && React.cloneElement(subItem.icon, { className: 'w-4 h-4' })}
                description={subItem.description}
                className={isSubActive ? 'bg-primary-50 text-primary' : ''}
              >
                {subItem.name}
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className="relative">
      <Button
        variant={isActive ? "flat" : "light"}
        color={isActive ? "primary" : "default"}
        size="sm"
        onPress={() => onNavigate(item)}
        style={{ borderRadius: 'var(--borderRadius, 8px)' }}
      >
        {item.icon && React.cloneElement(item.icon, { className: 'w-4 h-4 mr-1' })}
        <span className="text-xs font-medium">{item.name}</span>
      </Button>
      {/* Active underline indicator */}
      {isActive && (
        <motion.div
          layoutId="headerActiveTab"
          className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full"
          style={{ background: 'var(--theme-primary, #006FEE)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );
});

/* ─── HeaderNav ─── */
const HeaderNav = React.memo(({
  menuItems,
  activePath,
  onNavigate,
  maxVisibleItems = 6,
}) => {
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(maxVisibleItems);

  useEffect(() => {
    const calc = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setVisibleCount(Math.min(Math.max(Math.floor(w / 120), 3), maxVisibleItems));
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [maxVisibleItems]);

  const visibleItems = menuItems.slice(0, visibleCount);
  const overflowItems = menuItems.slice(visibleCount);

  return (
    <div ref={containerRef} className="flex-1 flex items-center gap-1 px-4 overflow-hidden">
      {visibleItems.map((item, index) => {
        const itemUrl = getMenuItemUrl(item);
        const active = itemUrl && activePath === itemUrl;
        const hasActiveChild = isItemActive(item, activePath) && !active;

        return (
          <HeaderNavItem
            key={getMenuItemId(item, `header-${index}`)}
            item={item}
            isActive={active}
            hasActiveChild={hasActiveChild}
            onNavigate={onNavigate}
          />
        );
      })}

      {overflowItems.length > 0 && (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button isIconOnly variant="light" size="sm" style={{ borderRadius: 'var(--borderRadius, 8px)' }}>
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="More navigation"
            onAction={(key) => {
              const item = overflowItems.find((i, idx) => getMenuItemId(i, `overflow-${idx}`) === key);
              if (item) onNavigate(item);
            }}
          >
            {overflowItems.map((item, index) => {
              const itemUrl = getMenuItemUrl(item);
              const active = itemUrl && activePath === itemUrl;

              return (
                <DropdownItem
                  key={getMenuItemId(item, `overflow-${index}`)}
                  startContent={item.icon && React.cloneElement(item.icon, { className: 'w-4 h-4' })}
                  className={active ? 'bg-primary-50 text-primary' : ''}
                >
                  {item.name}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        </Dropdown>
      )}
    </div>
  );
});

/* ─── HeaderSearch — glass-morphic with focus expand ─── */
const HeaderSearch = React.memo(({ searchTerm, onSearchChange }) => {
  const [focused, setFocused] = useState(false);

  return (
    <>
      {/* Desktop glass search */}
      <motion.div
        className="hidden lg:block relative"
        animate={{ width: focused ? 260 : 200 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Input
          placeholder="Search..."
          value={searchTerm}
          onValueChange={onSearchChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          size="sm"
          startContent={
            <MagnifyingGlassIcon
              className="w-4 h-4 transition-colors"
              style={{ color: focused ? 'var(--theme-primary, #006FEE)' : 'color-mix(in srgb, var(--theme-foreground, #11181C) 45%, transparent)' }}
            />
          }
          endContent={
            !focused && !searchTerm ? (
              <div className="flex items-center gap-0.5 opacity-50">
                <kbd className="text-[10px] px-1 py-0.5 rounded border border-default-300 bg-default-100 font-mono">⌘</kbd>
                <kbd className="text-[10px] px-1 py-0.5 rounded border border-default-300 bg-default-100 font-mono">K</kbd>
              </div>
            ) : null
          }
          classNames={{
            inputWrapper: [
              "h-9 border-none shadow-none transition-all duration-300",
              focused
                ? "bg-default-100 ring-1 ring-primary/30"
                : "bg-default-100/50 hover:bg-default-100/80",
            ].join(' '),
            input: "text-sm",
          }}
          style={{ borderRadius: 'var(--borderRadius, 8px)' }}
        />
        {/* Focus glow */}
        {focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-1 rounded-xl pointer-events-none"
            style={{
              background: `color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent)`,
              filter: 'blur(8px)',
            }}
          />
        )}
      </motion.div>

      {/* Mobile search button */}
      <Tooltip content="Search (⌘K)" className="lg:hidden">
        <Button isIconOnly variant="light" size="sm" className="lg:hidden">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </Button>
      </Tooltip>
    </>
  );
});

/* ─── HeaderNotifications — animated bell + glow badge ─── */
const HeaderNotifications = React.memo(() => {
  const { subscription_alert, tenant } = usePage().props;
  const notifications = [];

  if (subscription_alert) {
    notifications.push({
      key: 'sub-alert',
      title: subscription_alert.severity === 'expired' ? 'Subscription Expired'
        : subscription_alert.severity === 'trial_ending' ? 'Trial Ending Soon'
        : subscription_alert.severity === 'past_due' ? 'Payment Past Due'
        : 'Subscription Alert',
      description: subscription_alert.message,
      icon: (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          subscription_alert.type === 'danger' ? 'bg-danger-100' : 'bg-warning-100'
        }`}>
          <span className={`text-xs ${subscription_alert.type === 'danger' ? 'text-danger' : 'text-warning'}`}>!</span>
        </div>
      ),
    });
  }

  if (tenant?.onTrial && tenant?.trialEndsAt) {
    const daysLeft = Math.max(0, Math.ceil((new Date(tenant.trialEndsAt) - new Date()) / 86400000));
    if (daysLeft <= 7 && !subscription_alert) {
      notifications.push({
        key: 'trial',
        title: 'Trial Period',
        description: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to keep access.`,
        icon: (
          <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center shrink-0">
            <ClockIcon className="w-4 h-4 text-warning" />
          </div>
        ),
      });
    }
  }

  if (notifications.length === 0) {
    notifications.push({
      key: 'empty',
      title: 'All caught up!',
      description: 'No new notifications right now.',
      icon: (
        <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center shrink-0">
          <span className="text-success text-xs">✓</span>
        </div>
      ),
    });
  }

  const count = subscription_alert ? notifications.length : 0;
  const hasAlerts = count > 0;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button isIconOnly variant="light" size="sm" className="relative group" style={{ color: 'var(--theme-foreground)' }}>
          {/* Background glow on hover */}
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent)`,
            }}
          />
          <div style={{ animation: hasAlerts ? 'bellSwing 2s ease-in-out infinite' : 'none' }}>
            <Badge
              content={count}
              color="danger"
              size="sm"
              isInvisible={!hasAlerts}
            >
              <BellIcon className="w-5 h-5 relative z-10" />
            </Badge>
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Notifications"
        className="w-80"
      >
        <DropdownSection title="Notifications">
          {notifications.map(notif => (
            <DropdownItem key={notif.key} description={notif.description} startContent={notif.icon}>
              {notif.title}
            </DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
});

/* ─── HeaderThemeToggle — orbital rotation ─── */
const HeaderThemeToggle = React.memo(() => {
  let mode = 'light';
  let setMode = null;

  try {
    const ctx = useTheme();
    mode = ctx?.mode || 'light';
    setMode = ctx?.setMode;
  } catch { /* theme context unavailable */ }

  const isDark = mode === 'dark';

  return (
    <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
      <Button
        isIconOnly
        variant="light"
        size="sm"
        onPress={() => setMode?.(isDark ? 'light' : 'dark')}
        className="relative group"
        style={{ color: 'var(--theme-foreground)' }}
      >
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: isDark
              ? 'color-mix(in srgb, #F5A623 10%, transparent)'
              : 'color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent)',
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 200 }}
            className="relative z-10"
          >
            {isDark ? (
              <SunIcon className="w-5 h-5" style={{ color: '#F5A623' }} />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </motion.div>
        </AnimatePresence>
      </Button>
    </Tooltip>
  );
});

/* ─── HeaderLanguageSwitcher ─── */
const HeaderLanguageSwitcher = React.memo(() => (
  <LanguageSwitcher variant="minimal" size="sm" showFlag />
));

/* ─── HeaderUserMenu — premium profile dropdown ─── */
const HeaderUserMenu = React.memo(({ user }) => {
  const handleLogout = useCallback(() => {
    router.post(safeRoute('logout', '/logout'));
  }, []);

  const roleName = user?.roles?.[0]?.name || user?.role?.name || user?.designation?.title || 'Team Member';

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="light"
          size="sm"
          className="gap-2 px-2 group relative"
        >
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `color-mix(in srgb, var(--theme-primary, #006FEE) 6%, transparent)` }}
          />
          <div className="relative">
            <ProfileAvatar
              size="sm"
              src={user?.profile_image_url || user?.profile_image}
              name={user?.name}
              className="w-7 h-7 ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-300"
            />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: 'var(--theme-success, #17C964)', borderColor: 'var(--theme-content1, #FAFAFA)' }}
            />
          </div>
          <div className="hidden sm:block text-left relative z-10">
            <p className="text-xs font-semibold truncate max-w-[100px] leading-tight" style={{ color: 'var(--theme-foreground, #11181C)' }}>
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] truncate max-w-[100px] leading-tight" style={{ color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 58%, transparent)' }}>
              {roleName}
            </p>
          </div>
          <ChevronDownIcon className="w-3 h-3 hidden sm:block relative z-10 transition-transform group-hover:rotate-180 duration-300" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="User menu" className="w-72">
        <DropdownSection showDivider>
          <DropdownItem key="profile-card" isReadOnly className="cursor-default opacity-100" textValue="Profile card">
            <div className="flex items-center gap-3 py-2">
              <div className="relative">
                <ProfileAvatar
                  size="md"
                  src={user?.profile_image_url || user?.profile_image}
                  name={user?.name}
                  className="ring-2 ring-primary/20"
                />
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                  style={{ background: 'var(--theme-success, #17C964)', borderColor: 'var(--theme-content1, #FAFAFA)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{user?.name || 'User'}</p>
                <p className="text-xs truncate" style={{ color: 'color-mix(in srgb, var(--theme-foreground, #11181C) 58%, transparent)' }}>{user?.email}</p>
                <div
                  className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent)',
                    color: 'var(--theme-primary, #006FEE)',
                  }}
                >
                  <ShieldCheckIcon className="w-3 h-3" />
                  {roleName}
                </div>
              </div>
            </div>
          </DropdownItem>
        </DropdownSection>

        <DropdownSection title="Account" showDivider>
          <DropdownItem
            key="profile"
            startContent={<UserIcon className="w-4 h-4" />}
            description="View and edit your profile"
            href={safeRoute('core.profile.index', '/profile')}
          >
            My Profile
          </DropdownItem>
          <DropdownItem
            key="security"
            startContent={<KeyIcon className="w-4 h-4" />}
            description="Password & two-factor auth"
            href={safeRoute('core.profile.index', '/profile') + '#security'}
          >
            Security
          </DropdownItem>
          <DropdownItem
            key="notifications"
            startContent={<BellAlertIcon className="w-4 h-4" />}
            description="Manage notification preferences"
            href={safeRoute('settings', '/settings') + '#notifications'}
          >
            Notifications
          </DropdownItem>
        </DropdownSection>

        <DropdownSection title="Workspace" showDivider>
          <DropdownItem
            key="settings"
            startContent={<Cog6ToothIcon className="w-4 h-4" />}
            description="Company & app settings"
            href={safeRoute('settings', '/settings')}
          >
            Settings
          </DropdownItem>
          <DropdownItem
            key="activity"
            startContent={<ClockIcon className="w-4 h-4" />}
            description="Your recent actions"
            href={safeRoute('audit-logs.index', '/audit-logs')}
          >
            Activity Log
          </DropdownItem>
          <DropdownItem
            key="help"
            startContent={<QuestionMarkCircleIcon className="w-4 h-4" />}
            description="Documentation & support"
            href="/help"
          >
            Help & Support
          </DropdownItem>
        </DropdownSection>

        <DropdownSection>
          <DropdownItem
            key="logout"
            color="danger"
            className="text-danger"
            startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
            description="End your current session"
            onPress={handleLogout}
          >
            Sign Out
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
});

/* ─── HeaderActions ─── */
const HeaderActions = React.memo(({ user, searchTerm, onSearchChange, sidebarCollapsed }) => (
  <div className="flex items-center gap-1 shrink-0">
    {sidebarCollapsed && <HeaderSearch searchTerm={searchTerm} onSearchChange={onSearchChange} />}
    <HeaderThemeToggle />
    <HeaderLanguageSwitcher />
    <HeaderNotifications />
    {/* Glass divider */}
    <div
      className="h-6 w-px mx-1.5"
      style={{
        background: `linear-gradient(180deg, transparent, var(--theme-divider, #E4E4E7), transparent)`,
      }}
    />
    <HeaderUserMenu user={user} />
  </div>
));

/* ─── Main Header ─── */
const Header = React.memo(({
  showNav = true,
  className = '',
}) => {
  const {
    navItems,
    isMobile,
    isTablet,
    user,
    activePath,
    searchTerm,
    setSearchTerm,
    setMobileDrawerOpen,
    sidebarOpen,
    sidebarCollapsed,
  } = useNavigation();

  const handleNavigate = useCallback((item) => {
    setSearchTerm('');
    navigateToItem(item);
  }, [setSearchTerm]);

  const topLevelItems = useMemo(() => {
    return navItems.filter(item => !item.hidden).slice(0, 10);
  }, [navItems]);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-30 ${className}`}
    >
      {/* Inject keyframes */}
      <style>{headerKeyframes}</style>

      <Card
        className="mx-3 mt-3 relative overflow-hidden group/header"
        style={{
          background: `color-mix(in srgb, var(--theme-content1, #FAFAFA) 75%, transparent)`,
          border: `var(--borderWidth, 1px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
          borderRadius: `var(--borderRadius, 12px)`,
          fontFamily: 'var(--fontFamily, "Inter")',
          color: 'var(--theme-foreground, #11181C)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          boxShadow: `
            0 1px 3px color-mix(in srgb, var(--theme-foreground, #000) 4%, transparent),
            0 8px 24px -8px color-mix(in srgb, var(--theme-foreground, #000) 6%, transparent),
            inset 0 1px 0 0 color-mix(in srgb, var(--theme-content4, #D4D4D8) 15%, transparent)
          `,
        }}
      >
        {/* Top accent strip — animated gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, 
              transparent, 
              color-mix(in srgb, var(--theme-primary, #006FEE) 60%, transparent) 20%,
              var(--theme-primary, #006FEE) 50%,
              color-mix(in srgb, var(--theme-primary, #006FEE) 60%, transparent) 80%,
              transparent)`,
            backgroundSize: '200% 100%',
            animation: 'headerAccentFlow 5s ease infinite',
          }}
        />

        {/* Shimmer overlay on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover/header:opacity-100 transition-opacity duration-700"
          style={{
            background: 'linear-gradient(110deg, transparent 40%, color-mix(in srgb, var(--theme-foreground) 3%, transparent) 50%, transparent 60%)',
            animation: 'headerShimmer 4s ease-in-out infinite',
          }}
        />

        <div className="relative flex items-center gap-3 px-4 py-2.5">
          {/* Mobile/tablet: hamburger only (branding is in the drawer) */}
          {(isMobile || isTablet) && (
            <motion.div whileTap={{ scale: 0.9 }} className="shrink-0">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setMobileDrawerOpen(true)}
                style={{ color: 'var(--theme-foreground)' }}
              >
                <Bars3Icon className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Desktop: show branding when sidebar is closed OR collapsed (icon-only) */}
          {!isMobile && !isTablet && (!sidebarOpen || sidebarCollapsed) && (
            <HeaderLogo isMobile={false} showMenuButton={false} />
          )}

          {/* Desktop + no full sidebar: show horizontal nav */}
          {showNav && !isMobile && !isTablet && (!sidebarOpen || sidebarCollapsed) && (
            <HeaderNav
              menuItems={topLevelItems}
              activePath={activePath}
              onNavigate={handleNavigate}
              maxVisibleItems={sidebarCollapsed ? 5 : 6}
            />
          )}

          {/* Spacer pushes actions to the right when no flex-1 nav fills the gap */}
          {(isMobile || isTablet || (sidebarOpen && !sidebarCollapsed) || (!showNav && (!sidebarOpen || sidebarCollapsed))) && <div className="flex-1" />}

          <HeaderActions
            user={user}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
      </Card>
    </motion.header>
  );
});

Header.displayName = 'Header';

export default Header;
