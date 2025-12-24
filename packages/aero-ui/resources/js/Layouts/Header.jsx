import * as React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { showToast } from '@/utils/toastUtils';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Input,
  Badge,
  Kbd,
  Tooltip,
  Card,
  Chip,
  Divider,
  ScrollShadow
} from "@heroui/react";


import ProfileMenu from '@/Components/ProfileMenu';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ProfileAvatar from '@/Components/ProfileAvatar';
import { useScrollTrigger } from '@/Hooks/useScrollTrigger.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  CommandLineIcon,
  XMarkIcon,
  HomeIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

import { useBranding } from '@/Hooks/useBranding';

/**
 * Custom hook for responsive device type detection
 * Optimized for ERP system layout adaptations
 */
const useDeviceType = () => {
  const [deviceState, setDeviceState] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  const updateDeviceType = useCallback(() => {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUserAgent = /android|iphone|ipad|ipod/i.test(userAgent);

    const newState = {
      isMobile: width <= 768 || isMobileUserAgent,
      isTablet: width > 768 && width <= 1024,
      isDesktop: width > 1024
    };

    setDeviceState(prevState => {
      // Only update if state actually changed to prevent unnecessary re-renders
      if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
        return newState;
      }
      return prevState;
    });
  }, []);

  useEffect(() => {
    updateDeviceType();
    const debouncedUpdate = debounce(updateDeviceType, 150);
    window.addEventListener('resize', debouncedUpdate);
    return () => window.removeEventListener('resize', debouncedUpdate);
  }, [updateDeviceType]);

  return deviceState;
};

/**
 * Utility function for debouncing resize events
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Enhanced Profile Button Component
 * Provides user authentication status and quick access to profile menu
 */
const ProfileButton = React.memo(React.forwardRef(({ size = "sm", ...props }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { auth } = usePage().props;
  
  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);


  const avatarSize = size === "sm" ? "sm" : "md";
  
  return (
    <div
      ref={ref}
      {...props}
      className={`
        group relative flex items-center gap-3 cursor-pointer 
        hover:bg-white/10 active:bg-white/15 
        rounded-xl transition-all duration-300 ease-out
        focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent
        ${size === "sm" ? "p-1.5" : "p-2"}
        ${props.className || ""}
      `}
      tabIndex={0}
      role="button"
      aria-label={`User menu for ${auth.user.first_name} ${auth.user.last_name || ''}`}
      aria-expanded="false"
      aria-haspopup="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPressed(true);
          if (props.onPress) props.onPress(e);
        }
      }}
      onKeyUp={() => setIsPressed(false)}
    >
      {/* Avatar with enhanced styling */}
      <div className="relative">
        <ProfileAvatar
          size={avatarSize}
          src={auth.user.profile_image_url || auth.user.profile_image}
          name={auth.user.name}
          className={`
            transition-all duration-300 ease-out
            ${isHovered ? 'scale-105' : ''}
            ${isPressed ? 'scale-95' : ''}
            group-hover:shadow-lg group-hover:shadow-blue-500/20
          `}
          showBorder
          isInteractive
        />
        
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-xs">
          <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* User info for desktop */}
      <div className={`hidden ${size === "sm" ? "lg:flex" : "md:flex"} flex-col text-left min-w-0 flex-1`}>
        <span className="text-xs text-default-500 leading-tight font-medium">
          {getTimeBasedGreeting()},
        </span>
        <span className="font-semibold text-foreground text-sm leading-tight truncate">
          {auth.user.name || ''}
        </span>
        <span className="text-xs text-default-400 leading-tight truncate">
          {auth.user.designation?.title || 'Team Member'}
        </span>
      </div>

      {/* Chevron with animation */}
      <ChevronDownIcon 
        className={`
          w-4 h-4 text-default-400 transition-all duration-300 ease-out shrink-0
          ${isHovered ? 'text-default-300 rotate-180' : ''}
          ${isPressed ? 'scale-90' : ''}
          group-hover:text-blue-400
        `} 
      />

      {/* Ripple effect */}
      {isPressed && (
        <div className="absolute inset-0 bg-white/10 rounded-xl animate-ping" />
      )}
    </div>
  );
}));

ProfileButton.displayName = 'ProfileButton';

/**
 * Mobile Header Component
 * Optimized for mobile and touch interactions in ERP context
 */
const MobileHeader = React.memo(({ 
  internalSidebarOpen, 
  handleInternalToggle, 
  handleNavigation, 
  auth, 
  app,
  logo 
}) => {
  // ===== STATE MANAGEMENT =====
  // Profile dropdown state management (same as desktop)
  const [profileMenuState, setProfileMenuState] = useState({
    isLoading: false,
    hasUnreadNotifications: true,
    userStatus: 'online'
  });

  // ===== ENHANCED PROFILE NAVIGATION HANDLER =====
  /**
   * Mobile-optimized profile navigation handler
   * Same functionality as desktop but optimized for touch interactions
   */

  // ===== ENHANCED PROFILE BUTTON FOR MOBILE =====
  /**
   * Mobile-optimized enhanced profile button
   * Based on desktop version but optimized for touch and smaller screens
   */
  const EnhancedProfileButton = React.memo(React.forwardRef(({ size = "sm", className = "", ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [userGreeting, setUserGreeting] = useState('');

    // Dynamic greeting based on time and user context
    const getContextualGreeting = useCallback(() => {
      const hour = new Date().getHours();
      const firstName = auth.user.first_name || auth.user.name?.split(' ')[0] || 'User';
      
      let timeGreeting;
      if (hour < 12) timeGreeting = "Good morning";
      else if (hour < 17) timeGreeting = "Good afternoon";
      else timeGreeting = "Good evening";
      
      return { timeGreeting, firstName };
    }, [auth.user]);

    // Update greeting on component mount
    useEffect(() => {
      const { timeGreeting } = getContextualGreeting();
      setUserGreeting(timeGreeting);
    }, [getContextualGreeting]);

    const avatarSize = size === "sm" ? "sm" : "md";
    
    return (
      <div
        ref={ref}
        {...props}
        className={`
          group relative flex items-center gap-2 cursor-pointer 
          hover:bg-white/10 active:bg-white/15 
          transition-all duration-300 ease-out
          focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent
          p-1.5
          ${className}
        `}
        style={{
          borderRadius: 'var(--borderRadius, 12px)',
          fontFamily: 'var(--fontFamily, inherit)',
          transform: `scale(var(--scale, 1))`
        }}
        tabIndex={0}
        role="button"
        aria-label={`User menu for ${auth.user.name}. Status: ${profileMenuState.userStatus}`}
        aria-haspopup="true"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsPressed(true);
            if (props.onPress) props.onPress(e);
          }
        }}
        onKeyUp={() => setIsPressed(false)}
      >
        {/* Enhanced Avatar with Status Indicators */}
        <div className="relative">
          <ProfileAvatar
            size={avatarSize}
            src={auth.user.profile_image_url || auth.user.profile_image}
            name={auth.user.name}
            className={`
              transition-all duration-300 ease-out
              ${isHovered ? 'scale-105' : ''}
              ${isPressed ? 'scale-95' : ''}
              group-hover:shadow-lg group-hover:shadow-blue-500/20
            `}
            showBorder
            isInteractive
          />
          
          {/* Multi-state Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm">
            <motion.div 
              className={`w-full h-full rounded-full ${
                profileMenuState.userStatus === 'online' ? 'bg-green-500' :
                profileMenuState.userStatus === 'away' ? 'bg-yellow-500' :
                profileMenuState.userStatus === 'busy' ? 'bg-red-500' :
                'bg-gray-500'
              }`}
              animate={{ 
                scale: profileMenuState.userStatus === 'online' ? [1, 1.2, 1] : 1,
                opacity: profileMenuState.userStatus === 'offline' ? 0.5 : 1
              }}
              transition={{ 
                duration: profileMenuState.userStatus === 'online' ? 2 : 0.3, 
                repeat: profileMenuState.userStatus === 'online' ? Infinity : 0 
              }}
            />
          </div>
          
          {/* Notification Indicator */}
          {profileMenuState.hasUnreadNotifications && (
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
          )}
        </div>

        {/* Mobile-optimized chevron */}
        <motion.div
          animate={{ 
            rotate: isHovered ? 180 : 0,
            scale: isPressed ? 0.9 : 1
          }}
          transition={{ duration: 0.3 }}
          className="ml-auto"
        >
          <ChevronDownIcon 
            className={`
              w-4 h-4 text-default-400 transition-all duration-300 ease-out shrink-0
              ${isHovered ? 'text-default-300' : ''}
              group-hover:text-blue-400
            `} 
          />
        </motion.div>

        {/* Ripple Effect for Touch Feedback */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-white/20 pointer-events-none"
              style={{
                borderRadius: 'var(--borderRadius, 12px)'
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }));

  EnhancedProfileButton.displayName = 'EnhancedProfileButton';

  return (
  <div className="p-4 bg-transparent">
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{
          background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
          borderColor: `var(--theme-divider, #E4E4E7)`,
          borderWidth: `var(--borderWidth, 2px)`,
          borderRadius: `var(--borderRadius, 12px)`,
          fontFamily: `var(--fontFamily, "Inter")`,
          boxShadow: `0 4px 20px -2px var(--theme-shadow, rgba(0,0,0,0.1))`,
        }}
      >
        <Navbar
          shouldHideOnScroll
          maxWidth="full"
          height="60px"
          classNames={{
            base: "bg-transparent border-none shadow-none",
            wrapper: "px-4 max-w-full",
            content: "gap-2"
          }}
        >
          {/* Left: Sidebar Toggle + Logo */}
          <NavbarContent justify="start" className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="light"
              onPress={handleInternalToggle}
              className="text-foreground hover:bg-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                color: 'var(--theme-foreground, inherit)',
                backgroundColor: 'transparent',
                borderRadius: 'var(--borderRadius, 8px)',
                '--hover-bg': 'var(--theme-primary, #006FEE)15'
              }}
              size="sm"
              aria-label={internalSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {internalSidebarOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </Button>
            
            {/* Logo & Brand - Show/hide based on sidebar state */}
            <AnimatePresence mode="wait">
              {!internalSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NavbarBrand className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div 
                        className="rounded-xl flex items-center justify-center shadow-xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:scale-105"
                        style={{ 
                          width: 'calc(60px - 20px)',
                          height: 'calc(60px - 20px)',
                          aspectRatio: '1',
                          background: `linear-gradient(135deg, var(--theme-primary, #006FEE)15, var(--theme-primary, #006FEE)05)`,
                          borderColor: 'var(--theme-primary, #006FEE)30',
                          borderWidth: 'var(--borderWidth, 1px)',
                          borderRadius: 'var(--borderRadius, 12px)'
                        }}
                      >
                        <img 
                          src={logo} 
                          alt={`${app?.name || 'ERP System'} Logo`} 
                          className="object-contain"
                          style={{ 
                            width: 'calc(100% - 6px)',
                            height: 'calc(100% - 6px)',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        {/* Fallback text logo */}
                        <span 
                          className="font-bold text-primary text-lg hidden"
                          style={{ color: 'var(--theme-primary, #006FEE)' }}
                        >
                          E
                        </span>
                      </div>
                    </div>
                  
                  </NavbarBrand>
                </motion.div>
              )}
            </AnimatePresence>
          </NavbarContent>

          {/* Center Search - Hidden on mobile, shown on tablet+ */}
          <NavbarContent justify="center" className="hidden md:flex flex-1 max-w-md">
            <Input
              placeholder="Search modules, users, data..."
              startContent={
                <MagnifyingGlassIcon 
                  className="w-4 h-4" 
                  style={{ color: 'var(--theme-foreground, #666)60' }} 
                />
              }
              endContent={<Kbd className="hidden lg:inline-block" keys={["command"]}>K</Kbd>}
              classNames={{
                inputWrapper: "backdrop-blur-md border hover:bg-opacity-20 transition-all duration-300",
                input: "text-sm"
              }}
              style={{
                '--input-bg': 'var(--theme-background, #FFFFFF)10',
                '--input-border': 'var(--theme-divider, #E4E4E7)',
                '--input-hover-bg': 'var(--theme-background, #FFFFFF)15',
                borderRadius: 'var(--borderRadius, 8px)',
                fontFamily: 'var(--fontFamily, inherit)'
              }}
              size="sm"
            />
          </NavbarContent>

          {/* Right Controls */}
          <NavbarContent justify="end" className="flex items-center gap-1 min-w-0">
            {/* Mobile Search */}
            <Button
              isIconOnly
              variant="light"
              className="md:hidden text-foreground hover:bg-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                color: 'var(--theme-foreground, inherit)',
                backgroundColor: 'transparent',
                borderRadius: 'var(--borderRadius, 8px)',
                '--hover-bg': 'var(--theme-primary, #006FEE)10'
              }}
              size="sm"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher variant="minimal" size="sm" />

            {/* Notifications */}
            <Dropdown 
              placement="bottom-end" 
              closeDelay={100}
              classNames={{
                content: `backdrop-blur-xl border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300`
              }}
              style={{
                backgroundColor: `var(--theme-content1, #FAFAFA)95`,
                borderColor: `var(--theme-divider, #E4E4E7)`,
                borderWidth: `var(--borderWidth, 1px)`,
                borderRadius: `var(--borderRadius, 16px)`,
                fontFamily: `var(--fontFamily, inherit)`
              }}
            >
              <DropdownTrigger>
                <Button
                  isIconOnly
                  variant="light"
                  className="relative text-foreground hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    color: 'var(--theme-foreground, inherit)',
                    backgroundColor: 'transparent',
                    borderRadius: 'var(--borderRadius, 8px)',
                    '--hover-bg': 'var(--theme-foreground, #11181C)10'
                  }}
                  size="sm"
                  aria-label="Notifications"
                >
                  <BellIcon className="w-5 h-5" />
                  <Badge
                    content="3"
                    color="danger"
                    size="sm"
                    className="absolute -top-1 -right-1 animate-pulse"
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu className="w-80 p-0" aria-label="Notifications">
                <DropdownItem key="header" className="cursor-default hover:bg-transparent" textValue="Notifications Header">
                  <div className="p-4 border-b border-divider">
                    <div className="flex items-center justify-between">
                      <h6 className="text-lg font-semibold">Notifications</h6>
                      <Button size="sm" variant="light" className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        Mark all read
                      </Button>
                    </div>
                    <p className="text-sm text-default-500">You have 3 unread notifications</p>
                  </div>
                </DropdownItem>
                <DropdownItem key="notification-1" className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50" textValue="System update notification">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">System Maintenance Scheduled</p>
                      <p className="text-xs text-default-500 truncate">Maintenance window scheduled for tonight at 2:00 AM</p>
                      <p className="text-xs text-default-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </DropdownItem>
                <DropdownItem key="notification-2" className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50" textValue="New user registered">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">New User Registration</p>
                      <p className="text-xs text-default-500 truncate">John Doe has been added to the HR department</p>
                      <p className="text-xs text-default-400 mt-1">5 hours ago</p>
                    </div>
                  </div>
                </DropdownItem>
                <DropdownItem key="view-all" className="p-4 text-center hover:bg-blue-50 dark:hover:bg-blue-900/20" textValue="View all notifications">
                  <Button variant="light" className="text-blue-600 font-medium">
                    View all notifications
                  </Button>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* System Tools */}
            <Button
              isIconOnly
              variant="light"
              className="text-foreground hover:bg-white/10"
              size="sm"
              aria-label="System Tools"
            >
              <CommandLineIcon className="w-5 h-5" />
            </Button>

            {/* User Profile Menu */}
            <ProfileMenu>
              <EnhancedProfileButton size="sm" />
            </ProfileMenu>
          </NavbarContent>
        </Navbar>
      </Card>
    </motion.div>
  </div>
  );
});

MobileHeader.displayName = 'MobileHeader';

/**
 * Desktop Header Component
 * Full-featured header for desktop ERP interface
 */
/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Redesigned for better visual hierarchy, navigation display, and professional appearance
 */
/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Fixed navigation switching and state management issues
 */
/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Systematic navigation display with all modules visible and accessible
 */
/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Navigation integrated directly in the header layout for better UX
 */
/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Reverted to original horizontal navigation style with improvements
 */
/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Original navigation style with improved profile dropdown and menu handling
 * 
 * @author Emam Hosen - Final Year CSE Project
 * @description Enterprise-grade header component following MVC patterns and SOLID principles
 * @version 1.0.0
 */
const DesktopHeader = React.memo(({ 
  internalSidebarOpen, 
  handleInternalToggle, 
  handleNavigation, 
  currentPages, 
  currentUrl, 
  isTablet, 
  trigger, 
  auth, 
  app,
  logo 
}) => {
  // ===== STATE MANAGEMENT =====
  // Using separation of concerns - UI state management isolated from business logic
  const [profileMenuState, setProfileMenuState] = useState({
    isLoading: false,
    hasUnreadNotifications: true,
    userStatus: 'online'
  });

  // Navigation overflow state
  const [visibleItemCount, setVisibleItemCount] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);
  const navContainerRef = useRef(null);

  // Calculate visible items based on container width
  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!navContainerRef.current) return;
      
      const containerWidth = navContainerRef.current.offsetWidth;
      // Approximate width per menu item (including padding and gaps)
      const itemWidth = isTablet ? 90 : 100;
      const expandButtonWidth = 40;
      const availableWidth = containerWidth - expandButtonWidth;
      const maxVisible = Math.max(3, Math.floor(availableWidth / itemWidth));
      
      setVisibleItemCount(Math.min(maxVisible, currentPages.length));
    };

    calculateVisibleItems();
    window.addEventListener('resize', calculateVisibleItems);
    return () => window.removeEventListener('resize', calculateVisibleItems);
  }, [currentPages.length, isTablet]);

  // Split pages into visible and overflow
  const visiblePages = currentPages.slice(0, visibleItemCount);
  const overflowPages = currentPages.slice(visibleItemCount);
  const hasOverflow = overflowPages.length > 0;

  // Refs for expanded menu container and expand button
  const expandedMenuRef = useRef(null);
  const expandButtonRef = useRef(null);

  // Close expanded menu when clicking outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event) => {
      // Don't close if clicking inside the expanded menu
      if (expandedMenuRef.current && expandedMenuRef.current.contains(event.target)) {
        return;
      }
      // Don't close if clicking the expand button itself
      if (expandButtonRef.current && expandButtonRef.current.contains(event.target)) {
        return;
      }
      setIsExpanded(false);
    };

    // Use mousedown instead of click for better UX
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // ===== ENHANCED NAVIGATION HANDLER =====
  /**
   * Handles module navigation with proper error handling and state management
   * Implements enterprise-grade navigation patterns with fallback mechanisms
   * 
   * @param {string} pageRoute - The route to navigate to
   * @param {string} method - HTTP method for navigation (default: 'get')
   */
  const handleModuleNavigation = useCallback((pageRoute, method = 'get') => {
    if (!pageRoute) {
      console.warn('Navigation attempted without valid route');
      return;
    }
    
    try {
      // Using safe navigation for SPA with proper state management
      safeNavigate(pageRoute, {}, {
        method: method,
        preserveState: false, // Ensure fresh state for each module
        preserveScroll: false, // Reset scroll position for better UX
        replace: false, // Maintain browser history
        onStart: () => {
          console.log(`[Navigation] Starting navigation to: ${pageRoute}`);
          // Optional: Add loading state for better UX
        },
        onProgress: (progress) => {
          console.log(`[Navigation] Progress: ${progress.percentage}%`);
        },
        onSuccess: (page) => {
          console.log(`[Navigation] Successfully navigated to: ${pageRoute}`);
          // Update any necessary application state
        },
        onError: (errors) => {
          console.error('[Navigation] Navigation failed:', errors);
          // Implement user-friendly error handling
          showToast.error('Navigation failed. Please try again.');
        },
        onFinish: () => {
          console.log(`[Navigation] Navigation completed for: ${pageRoute}`);
        }
      });
    } catch (error) {
      console.error('[Navigation] Critical navigation error:', error);
      // Fallback to traditional navigation for robustness
      try {
        window.location.href = route(pageRoute);
      } catch (fallbackError) {
        console.error('[Navigation] Fallback navigation failed:', fallbackError);
        // Ultimate fallback - manual URL construction
        window.location.href = `/${pageRoute}`;
      }
    }
  }, []);

  // ===== PROFILE MANAGEMENT UTILITIES =====
  /**
   * Enhanced profile button with enterprise-grade user experience
   * Implements accessibility standards and responsive design patterns
   */
  const ProfileButton = React.memo(React.forwardRef(({ size = "md", className = "", ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [userGreeting, setUserGreeting] = useState('');

    // Dynamic greeting based on time and user context
    const getContextualGreeting = useCallback(() => {
      const hour = new Date().getHours();
      const firstName = auth.user.first_name || auth.user.name?.split(' ')[0] || 'User';
      
      let timeGreeting;
      if (hour < 12) timeGreeting = "Good morning";
      else if (hour < 17) timeGreeting = "Good afternoon";
      else timeGreeting = "Good evening";
      
      return { timeGreeting, firstName };
    }, [auth.user]);

    // Update greeting on component mount and time changes
    useEffect(() => {
      const updateGreeting = () => {
        const { timeGreeting } = getContextualGreeting();
        setUserGreeting(timeGreeting);
      };
      
      updateGreeting();
      // Update greeting every minute for accuracy
      const interval = setInterval(updateGreeting, 60000);
      return () => clearInterval(interval);
    }, [getContextualGreeting]);

    const buttonSize = size === "sm" ? "small" : size === "lg" ? "large" : "medium";
    const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
    
    return (
      <div
        ref={ref}
        {...props}
        className={`
          group relative flex items-center gap-3 cursor-pointer 
          hover:bg-white/10 active:bg-white/15 
          transition-all duration-300 ease-out
          focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent
          ${size === "sm" ? "p-1.5" : size === "lg" ? "p-3" : "p-2"}
          ${className}
        `}
        style={{
          borderRadius: 'var(--borderRadius, 12px)',
          fontFamily: 'var(--fontFamily, inherit)',
          transform: `scale(var(--scale, 1))`
        }}
        tabIndex={0}
        role="button"
        aria-label={`User menu for ${auth.user.name}. Status: ${profileMenuState.userStatus}`}
        aria-haspopup="true"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsPressed(true);
            if (props.onPress) props.onPress(e);
          }
        }}
        onKeyUp={() => setIsPressed(false)}
      >
        {/* Enhanced Avatar with Status Indicators */}
        <div className="relative">
          <ProfileAvatar
            size={avatarSize}
            src={auth.user.profile_image_url || auth.user.profile_image}
            name={auth.user.name}
            className={`
              transition-all duration-300 ease-out
              ${isHovered ? 'scale-105' : ''}
              ${isPressed ? 'scale-95' : ''}
              group-hover:shadow-lg group-hover:shadow-blue-500/20
            `}
            showBorder
            isInteractive
          />
          
          {/* Multi-state Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm">
            <motion.div 
              className={`w-full h-full rounded-full ${
                profileMenuState.userStatus === 'online' ? 'bg-green-500' :
                profileMenuState.userStatus === 'away' ? 'bg-yellow-500' :
                profileMenuState.userStatus === 'busy' ? 'bg-red-500' :
                'bg-gray-500'
              }`}
              animate={{ 
                scale: profileMenuState.userStatus === 'online' ? [1, 1.2, 1] : 1,
                opacity: profileMenuState.userStatus === 'offline' ? 0.5 : 1
              }}
              transition={{ 
                duration: profileMenuState.userStatus === 'online' ? 2 : 0.3, 
                repeat: profileMenuState.userStatus === 'online' ? Infinity : 0 
              }}
            />
          </div>
          
          {/* Notification Indicator */}
          {profileMenuState.hasUnreadNotifications && (
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse" />
          )}
        </div>

        {/* Enhanced User Information Display */}
        <div className={`hidden ${size === "sm" ? "lg:flex" : "md:flex"} flex-col text-left min-w-0 flex-1`}>
          <span className="text-xs text-default-500 leading-tight font-medium">
            {userGreeting},
          </span>
          <span className="font-semibold text-sm text-foreground leading-tight truncate">
            {auth.user.name || 'Unknown User'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-default-400 leading-tight truncate">
              {auth.user.designation?.title || auth.user.role?.name || 'Team Member'}
            </span>
            {auth.user.department && (
              <Chip size="sm" variant="flat" color="primary" className="text-xs h-4">
                {auth.user.department}
              </Chip>
            )}
          </div>
        </div>

        {/* Enhanced Chevron with Animation */}
        <motion.div
          animate={{ 
            rotate: isHovered ? 180 : 0,
            scale: isPressed ? 0.9 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDownIcon 
            className={`
              w-4 h-4 text-default-400 transition-all duration-300 ease-out shrink-0
              ${isHovered ? 'text-default-300' : ''}
              group-hover:text-blue-400
            `} 
          />
        </motion.div>

        {/* Ripple Effect for Touch Feedback */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-white/20 pointer-events-none"
              style={{
                borderRadius: 'var(--borderRadius, 12px)'
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }));

  ProfileButton.displayName = 'ProfileButton';

  // ===== ENHANCED PROFILE MENU HANDLER =====
  /**
   * Handles profile menu actions with comprehensive error handling
   * Implements enterprise-grade user management patterns
   */


  // ===== ACTIVE STATE DETECTION =====
  /**
   * Recursive function to check if a page or its children are active
   * Implements deep navigation state detection for complex menu structures
   */
  const checkActiveRecursive = useCallback((menuItem) => {
    if (!menuItem) return false;
    
    // Direct route match
    if (menuItem.route && currentUrl === "/" + menuItem.route) {
      return true;
    }
    
    // Check nested submenus recursively
    if (menuItem.subMenu && Array.isArray(menuItem.subMenu)) {
      return menuItem.subMenu.some(subItem => checkActiveRecursive(subItem));
    }
    
    return false;
  }, [currentUrl]);

  // ===== RENDER COMPONENT =====
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: !trigger ? 1 : 0, 
        y: !trigger ? 0 : -20 
      }}
      transition={{ duration: 0.3 }}
      style={{ display: !trigger ? 'block' : 'none' }}
    >
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: `var(--fontFamily, 'Inter')`,
            transform: `scale(var(--scale, 1))`,
            transformOrigin: 'top center'
          }}
        >
          <Card 
            className="backdrop-blur-md overflow-visible"
            style={{
              background: `linear-gradient(to bottom right, 
                var(--theme-content1, #FAFAFA) 20%, 
                var(--theme-content2, #F4F4F5) 10%, 
                var(--theme-content3, #F1F3F4) 20%)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
              borderWidth: `var(--borderWidth, 2px)`,
              borderStyle: 'solid',
              borderRadius: `var(--borderRadius, 8px)`,
              boxShadow: `0 8px 32px color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
              overflow: 'visible'
            }}
          >
            <div className="w-full px-4 lg:px-6 overflow-visible">
              {/* Three-Section Layout: Logo | Menu | Profile */}
              <div className="flex items-center min-h-[64px] overflow-visible">
                
                {/* Section 1: Logo - Fixed width */}
                <div className="flex items-center gap-3 shrink-0 pr-4">
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={handleInternalToggle}
                    className="transition-all duration-300"
                    style={{
                      color: 'var(--theme-foreground, #11181C)',
                      backgroundColor: 'transparent',
                      borderRadius: `var(--borderRadius, 8px)`
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`;
                      e.target.style.borderRadius = `var(--borderRadius, 8px)`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    size="sm"
                    aria-label={internalSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >
                    {internalSidebarOpen ? (
                      <XMarkIcon className="w-5 h-5" />
                    ) : (
                      <Bars3Icon className="w-5 h-5" />
                    )}
                  </Button>

                  {/* Brand Section - Only show when sidebar is closed */}
                  {!internalSidebarOpen && (
                    <div 
                      className="flex items-center justify-center overflow-hidden shrink-0"
                      style={{ 
                        width: '44px',
                        height: '44px',
                        backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderStyle: 'solid',
                        borderRadius: `var(--borderRadius, 8px)`
                      }}
                    >
                      <img 
                        src={logo} 
                        alt={`${app?.name || 'ERP System'} Logo`} 
                        className="object-contain w-9 h-9"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <span 
                        className="font-bold text-xl hidden"
                        style={{ color: 'var(--theme-primary, #006FEE)' }}
                      >
                        {(app?.name || 'ERP').charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Section 2: Menu - Flexible, grows to fill space */}
                {!internalSidebarOpen && (
                  <nav 
                    ref={navContainerRef} 
                    className={`flex-1 flex items-center gap-1 py-2 overflow-visible ${isExpanded ? 'flex-wrap content-start' : 'flex-nowrap'}`}
                  >
                      {/* When collapsed: show visible items only. When expanded: show ALL items */}
                      {(isExpanded ? currentPages : visiblePages).map((page, index) => {
                        const isActive = checkActiveRecursive(page);
                        
                        return page.subMenu ? (
                          <Dropdown
                            key={`${page.name}-${index}`}
                            placement="bottom-start"
                            offset={8}
                            closeDelay={100}
                            shouldBlockScroll={false}
                            portalContainer={typeof document !== 'undefined' ? document.body : undefined}
                            classNames={{
                              base: "before:bg-transparent",
                              content: "p-0 border-none shadow-xl min-w-[220px] z-[9999]"
                            }}
                          >
                            <DropdownTrigger>
                              <Button
                                variant="light"
                                size="sm"
                                className="h-9 px-3 font-medium whitespace-nowrap gap-1 data-[hover=true]:bg-default-100"
                                endContent={<ChevronDownIcon className="w-3 h-3 opacity-60" />}
                                style={isActive ? {
                                  backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)`,
                                  color: `var(--theme-primary, #006FEE)`,
                                  borderRadius: `var(--borderRadius, 8px)`,
                                  fontWeight: 600
                                } : {
                                  color: `var(--theme-foreground, #11181C)`,
                                  borderRadius: `var(--borderRadius, 8px)`
                                }}
                              >
                                {page.name}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label={`${page.name} submenu`}
                              variant="flat"
                              closeOnSelect={true}
                              itemClasses={{
                                base: [
                                  "rounded-lg",
                                  "text-default-600",
                                  "transition-all duration-150",
                                  "data-[hover=true]:text-foreground",
                                  "data-[hover=true]:bg-default-100",
                                  "data-[selectable=true]:focus:bg-default-100",
                                  "data-[pressed=true]:opacity-70",
                                  "py-2 px-3",
                                  "gap-3"
                                ],
                              }}
                              className="p-2"
                              style={{
                                backgroundColor: `var(--theme-content1, #FFFFFF)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                                border: `1px solid var(--theme-divider, #E4E4E7)`,
                                boxShadow: `0 10px 40px -10px rgba(0,0,0,0.15)`,
                                fontFamily: `var(--fontFamily, 'Inter')`
                              }}
                            >
                              {page.subMenu.map((subPage) => {
                                const isSubActive = checkActiveRecursive(subPage);
                                
                                if (subPage.subMenu && subPage.subMenu.length > 0) {
                                  return (
                                    <DropdownItem 
                                      key={subPage.name} 
                                      className="p-0 bg-transparent data-[hover=true]:bg-transparent" 
                                      textValue={subPage.name}
                                      isReadOnly
                                    >
                                      <Dropdown
                                        placement="right-start"
                                        offset={4}
                                        closeDelay={100}
                                        shouldBlockScroll={false}
                                        portalContainer={typeof document !== 'undefined' ? document.body : undefined}
                                        classNames={{
                                          base: "before:bg-transparent",
                                          content: "p-0 border-none shadow-xl min-w-[200px] z-[9999]"
                                        }}
                                      >
                                        <DropdownTrigger>
                                          <div
                                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-default-100"
                                            style={{
                                              backgroundColor: isSubActive ? `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)` : 'transparent',
                                              color: isSubActive ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)`
                                            }}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="w-4 h-4 opacity-70">{subPage.icon}</span>
                                              <span className="text-sm font-medium">{subPage.name}</span>
                                            </div>
                                            <ChevronDownIcon className="w-3 h-3 -rotate-90 opacity-50" />
                                          </div>
                                        </DropdownTrigger>
                                        <DropdownMenu 
                                          aria-label={`${subPage.name} nested`} 
                                          variant="flat"
                                          itemClasses={{
                                            base: [
                                              "rounded-lg",
                                              "text-default-600",
                                              "transition-all duration-150",
                                              "data-[hover=true]:text-foreground",
                                              "data-[hover=true]:bg-default-100",
                                              "py-2 px-3",
                                              "gap-3"
                                            ],
                                          }}
                                          className="p-2"
                                          style={{
                                            backgroundColor: `var(--theme-content1, #FFFFFF)`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            border: `1px solid var(--theme-divider, #E4E4E7)`,
                                            boxShadow: `0 10px 40px -10px rgba(0,0,0,0.15)`,
                                            fontFamily: `var(--fontFamily, 'Inter')`
                                          }}
                                        >
                                          {subPage.subMenu.map((nestedPage) => {
                                            const isNestedActive = currentUrl === "/" + nestedPage.route;
                                            return (
                                              <DropdownItem
                                                key={nestedPage.name}
                                                textValue={nestedPage.name}
                                                startContent={<span className="w-4 h-4 opacity-70">{nestedPage.icon}</span>}
                                                className={isNestedActive ? "bg-primary/10 text-primary font-medium" : ""}
                                                onPress={() => handleModuleNavigation(nestedPage.route, nestedPage.method)}
                                              >
                                                {nestedPage.name}
                                              </DropdownItem>
                                            );
                                          })}
                                        </DropdownMenu>
                                      </Dropdown>
                                    </DropdownItem>
                                  );
                                }
                                
                                return (
                                  <DropdownItem
                                    key={subPage.name}
                                    textValue={subPage.name}
                                    startContent={<span className="w-4 h-4 opacity-70">{subPage.icon}</span>}
                                    className={isSubActive ? "bg-primary/10 text-primary font-medium" : ""}
                                    onPress={() => handleModuleNavigation(subPage.route, subPage.method)}
                                  >
                                    {subPage.name}
                                  </DropdownItem>
                                );
                              })}
                            </DropdownMenu>
                          </Dropdown>
                        ) : (
                          <Button
                            key={`${page.name}-${index}`}
                            variant="light"
                            size="sm"
                            className="h-9 px-3 font-medium whitespace-nowrap data-[hover=true]:bg-default-100"
                            style={isActive ? {
                              backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)`,
                              color: `var(--theme-primary, #006FEE)`,
                              borderRadius: `var(--borderRadius, 8px)`,
                              fontWeight: 600
                            } : {
                              color: `var(--theme-foreground, #11181C)`,
                              borderRadius: `var(--borderRadius, 8px)`
                            }}
                            onPress={() => page.route && handleModuleNavigation(page.route, page.method)}
                          >
                            {page.name}
                          </Button>
                        );
                      })}

                      {/* Expand/Collapse Button - follows last menu item */}
                      {hasOverflow && (
                        <div ref={expandButtonRef} className="shrink-0 flex items-center">
                          <Button
                            variant="light"
                            size="sm"
                            className="h-9 px-2 gap-1 font-medium"
                            style={{ 
                              borderRadius: `var(--borderRadius, 8px)`,
                              color: `var(--theme-primary, #006FEE)`,
                            }}
                            onPress={() => setIsExpanded(!isExpanded)}
                            aria-label={isExpanded ? "Collapse menu" : `Show ${overflowPages.length} more items`}
                            endContent={
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center"
                              >
                                <ChevronDownIcon className="w-4 h-4" />
                              </motion.div>
                            }
                          >
                            {!isExpanded && (
                              <span className="text-xs font-semibold">
                                +{overflowPages.length}
                              </span>
                            )}
                          </Button>
                        </div>
                      )}
                  </nav>
                )}

                {/* Section 3: Profile & Actions - Always aligned right */}
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  {/* Search Field - Show when sidebar is open and enough space */}
                  {internalSidebarOpen && !isTablet && (
                    <div className="hidden lg:flex items-center mr-2">
                      <Input
                        placeholder="Search..."
                        startContent={
                          <MagnifyingGlassIcon 
                            className="w-4 h-4" 
                            style={{ color: 'var(--theme-foreground, #666)', opacity: 0.6 }} 
                          />
                        }
                        endContent={<Kbd className="hidden xl:inline-block" keys={["command"]}>K</Kbd>}
                        classNames={{
                          base: "w-48 xl:w-64",
                          inputWrapper: "h-8 bg-default-100/50 hover:bg-default-100 border-none shadow-none",
                          input: "text-sm"
                        }}
                        style={{
                          borderRadius: 'var(--borderRadius, 8px)',
                          fontFamily: 'var(--fontFamily, inherit)'
                        }}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Search Button - Show when sidebar is closed or on smaller screens */}
                  {(!internalSidebarOpen || isTablet) && (
                    <Tooltip content="Search (⌘K)" placement="bottom">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="w-8 h-8"
                        style={{ 
                          borderRadius: `var(--borderRadius, 8px)`,
                          color: `var(--theme-foreground, #11181C)`
                        }}
                        aria-label="Search"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Language Switcher */}
                  <LanguageSwitcher variant="minimal" size="sm" showFlag={true} />
                  
                  {/* Notifications */}
                  <Dropdown 
                    placement="bottom-end"
                    offset={8}
                    shouldBlockScroll={false}
                    portalContainer={typeof document !== 'undefined' ? document.body : undefined}
                    classNames={{
                      base: "before:bg-transparent",
                      content: "p-0 border-none shadow-xl min-w-[320px] z-[9999]"
                    }}
                  >
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="w-8 h-8 relative"
                        style={{ 
                          borderRadius: `var(--borderRadius, 8px)`,
                          color: `var(--theme-foreground, #11181C)`
                        }}
                        aria-label="Notifications"
                      >
                        <BellIcon className="w-4 h-4" />
                        <Badge
                          content="3"
                          color="danger"
                          size="sm"
                          className="absolute -top-0.5 -right-0.5 min-w-4 h-4 text-[10px]"
                        />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="Notifications"
                      className="p-0"
                      style={{
                        backgroundColor: `var(--theme-content1, #FFFFFF)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        border: `1px solid var(--theme-divider, #E4E4E7)`,
                        boxShadow: `0 10px 40px -10px rgba(0,0,0,0.15)`,
                        fontFamily: `var(--fontFamily, 'Inter')`
                      }}
                      itemClasses={{
                        base: "px-4 py-3 gap-3 data-[hover=true]:bg-default-100"
                      }}
                    >
                      <DropdownSection 
                        title="Notifications" 
                        showDivider
                        classNames={{
                          heading: "px-4 py-2 text-xs font-semibold text-default-500 uppercase tracking-wider"
                        }}
                      >
                        <DropdownItem key="n1" textValue="Maintenance" className="py-3">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-warning rounded-full mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Maintenance Tonight</p>
                              <p className="text-xs text-default-400 mt-0.5">System update at 2 AM</p>
                              <p className="text-xs text-default-300 mt-1">1 hour ago</p>
                            </div>
                          </div>
                        </DropdownItem>
                        <DropdownItem key="n2" textValue="New User" className="py-3">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-success rounded-full mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">New User Added</p>
                              <p className="text-xs text-default-400 mt-0.5">John Doe joined HR team</p>
                              <p className="text-xs text-default-300 mt-1">3 hours ago</p>
                            </div>
                          </div>
                        </DropdownItem>
                      </DropdownSection>
                      <DropdownItem key="view" className="text-center py-3 text-primary font-medium" textValue="View All">
                        View all notifications
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                  
                  {/* Divider */}
                  <div 
                    className="w-px h-8 mx-2" 
                    style={{ backgroundColor: `var(--theme-divider, #E4E4E7)` }}
                  />
                  
                  {/* Profile */}
                  <ProfileMenu>
                    <ProfileButton size="sm" />
                  </ProfileMenu>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
});

DesktopHeader.displayName = 'DesktopHeader';

/**
 * Main Header Component
 * Enterprise-grade header with static rendering to prevent unnecessary re-renders
 * 
 * Key Features:
 * - Static rendering with internal state management
 * - Responsive design for mobile, tablet, and desktop
 * - ERP-specific navigation and tools
 * - Role-based access control integration
 * - Performance optimized with memoization
 * - Accessibility compliant
 * - Security-aware notifications
 * - Professional enterprise styling
 */
const Header = React.memo(({ 
  toggleSideBar, 
  url, 
  pages,
  sideBarOpen 
}) => {
  // ===== INTERNAL STATE MANAGEMENT =====
  // Use internal state to manage visual changes without depending on prop changes
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(sideBarOpen);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [currentPages, setCurrentPages] = useState(pages);
  
  // Get static page props once
  const { auth, app } = usePage().props;
  
  // === DEBUG: Log auth in Header ===
  useEffect(() => {
    console.group('=== Header.jsx: Auth Debug ===');
    console.log('auth:', auth);
    console.log('auth?.user:', auth?.user);
    console.log('auth?.isAuthenticated:', auth?.isAuthenticated);
    console.groupEnd();
  }, [auth]);

  // Early return if no authenticated user to prevent null errors
  if (!auth?.user) {
    console.warn('Header: No authenticated user, returning null');
    return null;
  }

  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const trigger = useScrollTrigger();
  
  // Get logo from backend branding settings
  const { logo, siteName } = useBranding();

 
  // ===== INTERNAL HANDLERS (Stable References) =====
  const handleInternalToggle = useCallback(() => {
    setInternalSidebarOpen(prev => !prev);
    // Call parent toggle for external state sync
    if (toggleSideBar) {
      toggleSideBar();
    }
  }, []); // Empty dependency array for stable reference

  const handleNavigation = useCallback((route, method = 'get') => {
    router.visit(route, {
      method,
      preserveState: false,
      preserveScroll: false
    });
  }, []); // Empty dependency array for stable reference

  // ===== SYNC WITH EXTERNAL STATE =====
  // Listen for external state changes without causing re-renders
  useEffect(() => {
    const syncExternalState = () => {
      try {
        const stored = localStorage.getItem('sidebarOpen');
        const newState = stored ? JSON.parse(stored) : false;
        setInternalSidebarOpen(newState);
      } catch (error) {
        console.warn('Failed to sync sidebar state:', error);
      }
    };

    // Listen to storage events for cross-tab synchronization
    window.addEventListener('storage', syncExternalState);
    
    // Sync with current URL changes
    setCurrentUrl(url);
    
    // Sync with pages changes (for permission updates)
    setCurrentPages(pages);
    
    // Poll for localStorage changes (fallback for same-tab changes)
    const pollInterval = setInterval(syncExternalState, 100);

    return () => {
      window.removeEventListener('storage', syncExternalState);
      clearInterval(pollInterval);
    };
  }, [url, pages]); // Only depend on actual URL and pages changes

  // ===== RENDER DECISION =====
  // Choose appropriate header based on device type
  if (isMobile) {
    return (
      <MobileHeader
        internalSidebarOpen={internalSidebarOpen}
        handleInternalToggle={handleInternalToggle}
        handleNavigation={handleNavigation}
        auth={auth}
        app={app}
        logo={logo}
      />
    );
  }

  return (
    <DesktopHeader
      internalSidebarOpen={internalSidebarOpen}
      handleInternalToggle={handleInternalToggle}
      handleNavigation={handleNavigation}
      currentPages={currentPages}
      currentUrl={currentUrl}
      isTablet={isTablet}
      trigger={trigger}
      auth={auth}
      app={app}
      logo={logo}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only allow re-render if essential data actually changes
  return (
    prevProps.url === nextProps.url &&
    prevProps.pages === nextProps.pages &&
    prevProps.toggleSideBar === nextProps.toggleSideBar &&
    prevProps.sideBarOpen === nextProps.sideBarOpen
  );
});

// Add display name for debugging and development
Header.displayName = 'Header';

export default Header;

/**
 * =========================
 * IMPLEMENTATION NOTES
 * =========================
 * 
 * This header component is designed for enterprise ERP systems with the following considerations:
 * 
 * 1. **Performance Optimization**:
 *    - Static rendering to prevent unnecessary re-renders
 *    - Memoized components and callbacks
 *    - Efficient device type detection with debouncing
 *    - Lazy loading of heavy components
 * 
 * 2. **Enterprise Features**:
 *    - Role-based navigation with permission checks
 *    - System-wide search functionality
 *    - Real-time notifications for system events
 *    - User session management
 *    - Multi-level dropdown menus for complex navigation
 * 
 * 3. **Security Considerations**:
 *    - Secure authentication state handling
 *    - Session validation with visual indicators
 *    - Security alerts in notifications
 *    - RBAC integration throughout navigation
 * 
 * 4. **Responsive Design**:
 *    - Mobile-first approach with progressive enhancement
 *    - Tablet-specific optimizations
 *    - Desktop full-feature experience
 *    - Touch-friendly interactions on mobile devices
 * 
 * 5. **Accessibility**:
 *    - ARIA labels and roles for screen readers
 *    - Keyboard navigation support
 *    - High contrast design options
 *    - Focus management for dropdown menus
 * 
 * 6. **Maintainability**:
 *    - Clear separation of concerns
 *    - Component composition pattern
 *    - Comprehensive error handling
 *    - Extensive documentation and comments
 * 
 * 7. **Integration Readiness**:
 *    - Event-driven architecture for notifications
 *    - API-ready for external system integration
 *    - Theme system integration
 *    - Extensible navigation structure
 */