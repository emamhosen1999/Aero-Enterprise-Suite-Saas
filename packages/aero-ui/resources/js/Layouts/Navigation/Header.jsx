/**
 * Header - Main header navigation component
 * 
 * Features:
 * - Responsive design (mobile hamburger / desktop full nav)
 * - 3D styling with hover effects
 * - Horizontal navigation for desktop
 * - Overflow menu for items that don't fit
 * - Search, notifications, user profile
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
  Avatar,
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
} from "@heroicons/react/24/outline";

import { useNavigation, motion3DConfig } from './NavigationProvider';
import { getMenuItemUrl, isItemActive, navigateToItem, getMenuItemId, hasRoute } from './navigationUtils.jsx';

// Safe route helper that returns fallback if route doesn't exist
const safeRoute = (routeName, fallback = '#') => {
  try {
    return hasRoute(routeName) ? route(routeName) : fallback;
  } catch {
    return fallback;
  }
};
import { useBranding } from '@/Hooks/useBranding';
import ProfileAvatar from '@/Components/ProfileAvatar';
import { useTheme } from '@/Context/ThemeContext';

/**
 * HeaderLogo - Brand logo section
 */
const HeaderLogo = React.memo(({ onMenuClick, isMobile, showMenuButton = false }) => {
  const { squareLogo, siteName } = useBranding();
  const firstLetter = siteName?.charAt(0)?.toUpperCase() || 'A';
  
  return (
    <div className="flex items-center gap-3 shrink-0">
      {/* Mobile Menu Button - Only show when needed */}
      {showMenuButton && (
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onMenuClick}
          className="shrink-0"
        >
          <Bars3Icon className="w-5 h-5" />
        </Button>
      )}
      
      {/* Logo */}
      <Link 
        href={safeRoute('dashboard', '/dashboard')}
        className="flex items-center gap-3 group"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
        
        {!isMobile && (
          <motion.span 
            className="font-bold text-lg"
            style={{ color: 'var(--theme-foreground, #11181C)' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {siteName}
          </motion.span>
        )}
      </Link>
    </div>
  );
});

/**
 * HeaderNavItem - Individual nav item with dropdown for submenus
 */
const HeaderNavItem = React.memo(({ 
  item, 
  isActive, 
  hasActiveChild,
  onNavigate 
}) => {
  const hasSubMenu = item.subMenu && item.subMenu.length > 0;
  
  if (hasSubMenu) {
    return (
      <Dropdown placement="bottom-start">
        <DropdownTrigger>
          <Button
            variant={isActive || hasActiveChild ? "flat" : "light"}
            color={isActive || hasActiveChild ? "primary" : "default"}
            size="sm"
            endContent={<ChevronDownIcon className="w-3 h-3" />}
            className="gap-1"
            style={{
              borderRadius: 'var(--borderRadius, 8px)',
            }}
          >
            {item.icon && React.cloneElement(item.icon, { className: 'w-4 h-4' })}
            <span>{item.name}</span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu 
          aria-label={`${item.name} submenu`}
          onAction={(key) => {
            const subItem = item.subMenu.find((s, i) => getMenuItemId(s, `${item.name}-${i}`) === key);
            if (subItem) {
              onNavigate(subItem);
            }
          }}
        >
          {item.subMenu.map((subItem, index) => {
            const subItemId = getMenuItemId(subItem, `${item.name}-${index}`);
            const subUrl = getMenuItemUrl(subItem);
            const isSubActive = subUrl && window.location.pathname === subUrl;
            
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
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
    >
      <Button
        variant={isActive ? "flat" : "light"}
        color={isActive ? "primary" : "default"}
        size="sm"
        onPress={() => onNavigate(item)}
        style={{
          borderRadius: 'var(--borderRadius, 8px)',
        }}
      >
        {item.icon && React.cloneElement(item.icon, { className: 'w-4 h-4 mr-1' })}
        {item.name}
      </Button>
    </motion.div>
  );
});

/**
 * HeaderNav - Horizontal navigation section
 */
const HeaderNav = React.memo(({ 
  menuItems, 
  activePath, 
  onNavigate,
  maxVisibleItems = 6 
}) => {
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(maxVisibleItems);
  
  // Calculate visible items based on container width
  useEffect(() => {
    const calculateVisibleItems = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const itemWidth = 120; // Approximate width per item
        const maxItems = Math.floor(containerWidth / itemWidth);
        setVisibleCount(Math.min(Math.max(maxItems, 3), maxVisibleItems));
      }
    };
    
    calculateVisibleItems();
    window.addEventListener('resize', calculateVisibleItems);
    return () => window.removeEventListener('resize', calculateVisibleItems);
  }, [maxVisibleItems]);
  
  const visibleItems = menuItems.slice(0, visibleCount);
  const overflowItems = menuItems.slice(visibleCount);
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 flex items-center gap-1 px-4 overflow-hidden"
    >
      {visibleItems.map((item, index) => {
        const itemUrl = getMenuItemUrl(item);
        const isActive = itemUrl && activePath === itemUrl;
        const hasActiveChild = isItemActive(item, activePath) && !isActive;
        
        return (
          <HeaderNavItem
            key={getMenuItemId(item, `header-${index}`)}
            item={item}
            isActive={isActive}
            hasActiveChild={hasActiveChild}
            onNavigate={onNavigate}
          />
        );
      })}
      
      {/* Overflow menu */}
      {overflowItems.length > 0 && (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              style={{
                borderRadius: 'var(--borderRadius, 8px)',
              }}
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="More navigation"
            onAction={(key) => {
              const item = overflowItems.find((i, idx) => getMenuItemId(i, `overflow-${idx}`) === key);
              if (item) {
                onNavigate(item);
              }
            }}
          >
            {overflowItems.map((item, index) => {
              const itemUrl = getMenuItemUrl(item);
              const isActive = itemUrl && activePath === itemUrl;
              
              return (
                <DropdownItem
                  key={getMenuItemId(item, `overflow-${index}`)}
                  startContent={item.icon && React.cloneElement(item.icon, { className: 'w-4 h-4' })}
                  className={isActive ? 'bg-primary-50 text-primary' : ''}
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

/**
 * HeaderSearch - Search component
 */
const HeaderSearch = React.memo(({ searchTerm, onSearchChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Desktop - inline search */}
      <div className="hidden lg:block">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onValueChange={onSearchChange}
          size="sm"
          startContent={
            <MagnifyingGlassIcon 
              className="w-4 h-4"
              style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
            />
          }
          classNames={{
            base: "w-48",
            inputWrapper: "bg-default-100/50 border-none shadow-none h-9",
            input: "text-sm"
          }}
          style={{
            borderRadius: 'var(--borderRadius, 8px)',
          }}
        />
      </div>
      
      {/* Mobile/Tablet - icon button */}
      <Tooltip content="Search (⌘K)" className="lg:hidden">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setIsOpen(true)}
          className="lg:hidden"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </Button>
      </Tooltip>
    </>
  );
});

/**
 * HeaderNotifications - Notifications dropdown with real subscription/quota alerts
 */
const HeaderNotifications = React.memo(() => {
  const { subscription_alert, planLimits, tenant } = usePage().props;

  // Build notifications from real data sources
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

  // Placeholder for dynamic notifications (leave requests, etc.) — modules can push via API
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

  const notificationCount = subscription_alert ? notifications.length : 0;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          size="sm"
        >
          <Badge 
            content={notificationCount} 
            color="danger" 
            size="sm"
            isInvisible={notificationCount === 0}
          >
            <BellIcon className="w-5 h-5" />
          </Badge>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Notifications" className="w-80">
        <DropdownSection title="Notifications">
          {notifications.map(notif => (
            <DropdownItem
              key={notif.key}
              description={notif.description}
              startContent={notif.icon}
            >
              {notif.title}
            </DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
});

/**
 * HeaderThemeToggle - Dark/Light mode toggle
 */
const HeaderThemeToggle = React.memo(() => {
  let mode = 'light';
  let setMode = null;
  
  try {
    const themeContext = useTheme();
    mode = themeContext?.mode || 'light';
    setMode = themeContext?.setMode;
  } catch (error) {
    console.warn('Theme context not available:', error);
  }
  
  const isDark = mode === 'dark';
  
  const handleToggle = () => {
    if (setMode && typeof setMode === 'function') {
      setMode(isDark ? 'light' : 'dark');
    } else {
      console.warn('Theme toggle not available - setMode function is missing');
    }
  };
  
  return (
    <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
      <Button
        isIconOnly
        variant="light"
        size="sm"
        onPress={handleToggle}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isDark ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </motion.div>
        </AnimatePresence>
      </Button>
    </Tooltip>
  );
});

/**
 * HeaderUserMenu - User profile dropdown
 */
const HeaderUserMenu = React.memo(({ user }) => {
  const handleLogout = useCallback(() => {
    const logoutUrl = safeRoute('logout', '/logout');
    router.post(logoutUrl);
  }, []);
  
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="light"
          size="sm"
          className="gap-2 px-2"
        >
          <ProfileAvatar 
            size="sm"
            src={user?.profile_image_url || user?.profile_image}
            name={user?.name}
            className="w-7 h-7"
          />
          <div className="hidden sm:block text-left">
            <p 
              className="text-xs font-semibold truncate max-w-[100px]"
              style={{ color: 'var(--theme-foreground, #11181C)' }}
            >
              {user?.name || 'User'}
            </p>
          </div>
          <ChevronDownIcon className="w-3 h-3 hidden sm:block" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="User menu" className="w-56">
        <DropdownSection showDivider>
          <DropdownItem
            key="profile-info"
            isReadOnly
            className="cursor-default"
            textValue="Profile info"
          >
            <div className="flex items-center gap-3">
              <ProfileAvatar 
                size="md"
                src={user?.profile_image_url || user?.profile_image}
                name={user?.name}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {user?.name || 'User'}
                </p>
                <p 
                  className="text-xs truncate"
                  style={{ color: 'var(--theme-foreground-500, #71717A)' }}
                >
                  {user?.email}
                </p>
              </div>
            </div>
          </DropdownItem>
        </DropdownSection>
        
        <DropdownSection showDivider>
          <DropdownItem
            key="profile"
            startContent={<UserIcon className="w-4 h-4" />}
            href={safeRoute('core.profile.index', '/profile')}
          >
            My Profile
          </DropdownItem>
          <DropdownItem
            key="settings"
            startContent={<Cog6ToothIcon className="w-4 h-4" />}
            href={safeRoute('settings', '/settings')}
          >
            Settings
          </DropdownItem>
          <DropdownItem
            key="help"
            startContent={<QuestionMarkCircleIcon className="w-4 h-4" />}
            href="/help"
          >
            Help & Support
          </DropdownItem>
        </DropdownSection>
        
        <DropdownSection>
          <DropdownItem
            key="logout"
            color="danger"
            startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
            onPress={handleLogout}
          >
            Log Out
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
});

/**
 * HeaderActions - Right side actions (search, notifications, theme, profile)
 */
const HeaderActions = React.memo(({ user, searchTerm, onSearchChange }) => {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <HeaderSearch 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
      <HeaderThemeToggle />
      <HeaderNotifications />
      <Divider orientation="vertical" className="h-6 mx-1" />
      <HeaderUserMenu user={user} />
    </div>
  );
});

/**
 * Main Header Component
 */
const Header = React.memo(({ 
  pages = [], 
  showNav = true,
  className = '' 
}) => {
  const {
    isMobile,
    isTablet,
    user,
    activePath,
    searchTerm,
    setSearchTerm,
    setMobileDrawerOpen,
    sidebarOpen,
  } = useNavigation();
  
  // Handle navigation
  const handleNavigate = useCallback((item) => {
    setSearchTerm('');
    navigateToItem(item);
  }, [setSearchTerm]);
  
  // Get only top-level items for horizontal nav
  const topLevelItems = useMemo(() => {
    return pages.filter(item => !item.hidden).slice(0, 10);
  }, [pages]);
  
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-30 ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <Card
        className="mx-3 mt-3"
        style={{
          background: `linear-gradient(180deg, 
            var(--theme-content1, #FAFAFA) 0%, 
            color-mix(in srgb, var(--theme-content2, #F4F4F5) 80%, var(--theme-background, #FFFFFF)) 100%)`,
          border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
          borderRadius: `var(--borderRadius, 12px)`,
          boxShadow: `
            0 4px 20px -5px rgba(0,0,0,0.08),
            0 0 0 1px var(--theme-divider, #E4E4E7),
            inset 0 1px 0 0 rgba(255,255,255,0.5)
          `,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <HeaderLogo 
            isMobile={isMobile || isTablet}
            showMenuButton={isMobile || isTablet}
            onMenuClick={() => setMobileDrawerOpen(true)}
          />
          
          {/* Desktop horizontal navigation */}
          {showNav && !isMobile && !isTablet && !sidebarOpen && (
            <HeaderNav
              menuItems={topLevelItems}
              activePath={activePath}
              onNavigate={handleNavigate}
              maxVisibleItems={6}
            />
          )}
          
          {/* Spacer when sidebar is open or on mobile */}
          {(sidebarOpen || isMobile || isTablet) && <div className="flex-1" />}
          
          <HeaderActions
            user={user}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </Card>
    </motion.header>
  );
});

Header.displayName = 'Header';

export default Header;
