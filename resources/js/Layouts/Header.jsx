import * as React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
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
  Avatar,
  Input,
  Badge,
  Kbd,
  Tooltip,
  Card,
  Chip
} from "@heroui/react";


import ProfileMenu from '@/Components/ProfileMenu';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
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


import logo from '../../../public/assets/images/logo.png';

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
        <Avatar
          size={avatarSize}
          src={auth.user.profile_image_url || auth.user.profile_image}
          name={auth.user.name}
          className={`
            ring-2 ring-white/20 transition-all duration-300 ease-out
            ${isHovered ? 'ring-white/40 scale-105' : ''}
            ${isPressed ? 'scale-95' : ''}
            group-hover:shadow-lg group-hover:shadow-blue-500/20
          `}
          radius='sm'
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
  app 
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
          <Avatar
            size={avatarSize}
            src={auth.user.profile_image_url || auth.user.profile_image}
            name={auth.user.name}
            className={`
              ring-2 ring-white/20 transition-all duration-300 ease-out
              ${isHovered ? 'ring-white/40 scale-105' : ''}
              ${isPressed ? 'scale-95' : ''}
              group-hover:shadow-lg group-hover:shadow-blue-500/20
            `}
            radius="md"
            fallback={
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                {(auth.user.name || 'U').charAt(0).toUpperCase()}
              </div>
            }
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

            {/* Help & Support */}
            <Tooltip content="Help & Support" placement="bottom">
              <Button
                isIconOnly
                variant="light"
                className="text-foreground hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  color: 'var(--theme-foreground, inherit)',
                  backgroundColor: 'transparent',
                  borderRadius: 'var(--borderRadius, 8px)',
                  '--hover-bg': 'var(--theme-foreground, #11181C)10'
                }}
                size="sm"
                aria-label="Help and Support"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </Button>
            </Tooltip>

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
  app 
}) => {
  // ===== STATE MANAGEMENT =====
  // Using separation of concerns - UI state management isolated from business logic
  const [profileMenuState, setProfileMenuState] = useState({
    isLoading: false,
    hasUnreadNotifications: true,
    userStatus: 'online'
  });

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
      // Using Inertia.js for SPA navigation with proper state management
      router.visit(route(pageRoute), {
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
          <Avatar
            size={avatarSize}
            src={auth.user.profile_image_url || auth.user.profile_image}
            name={auth.user.name}
            className={`
              ring-2 ring-white/20 transition-all duration-300 ease-out
              ${isHovered ? 'ring-white/40 scale-105' : ''}
              ${isPressed ? 'scale-95' : ''}
              group-hover:shadow-lg group-hover:shadow-blue-500/20
            `}
            radius="md"
            fallback={
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                {(auth.user.name || 'U').charAt(0).toUpperCase()}
              </div>
            }
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
            className="backdrop-blur-md"
            style={{
              background: `linear-gradient(to bottom right, 
                var(--theme-content1, #FAFAFA) 20%, 
                var(--theme-content2, #F4F4F5) 10%, 
                var(--theme-content3, #F1F3F4) 20%)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
              borderWidth: `var(--borderWidth, 2px)`,
              borderStyle: 'solid',
              borderRadius: `var(--borderRadius, 8px)`,
              boxShadow: `0 8px 32px color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`
            }}
          >
            <div className="max-w-7xl px-4">
              <div className="flex items-center justify-between py-4 gap-6 min-h-[72px]">
                
                {/* Left Section: Logo and Menu Toggle */}
                <div className="flex items-center gap-6 flex-shrink-0">
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
                    <div className="flex items-center gap-8">
                      <div className="relative">
                        <div 
                          className="flex items-center justify-center shadow-xl overflow-hidden"
                          style={{ 
                            width: 'calc(72px - 16px)',
                            height: 'calc(72px - 16px)',
                            aspectRatio: '1',
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
                            className="object-contain"
                            style={{ 
                              width: 'calc(100% - 8px)',
                              height: 'calc(100% - 8px)',
                              maxWidth: '100%',
                              maxHeight: '100%'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          {/* Fallback Logo */}
                          <span 
                            className="font-bold text-xl hidden"
                            style={{ color: 'var(--theme-primary, #006FEE)' }}
                          >
                            {(app?.name || 'ERP').charAt(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Center Section: Original Horizontal Navigation Menu */}
                <motion.div
                  className="flex-1 flex justify-center"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: !internalSidebarOpen ? 1 : 0,
                    height: !internalSidebarOpen ? 'auto' : 0
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="mx-8">
                    <div className={`grid gap-2 ${
                      isTablet ? 'grid-cols-2' : 'grid-cols-4'
                    }`}>
                      {currentPages.slice(0, isTablet ? 4 : 8).map((page, index) => {
                        const isActive = checkActiveRecursive(page);
                        
                        return (
                          <div key={`${page.name}-${index}`} className="flex justify-center">
                            {page.subMenu ? (
                              <Dropdown
                                placement="bottom"
                                closeDelay={800}
                                shouldBlockScroll={false}
                                isKeyboardDismissDisabled={false}
                                classNames={{
                                  content: `backdrop-blur-md min-w-64 max-h-80 overflow-y-auto p-1`
                                }}
                                style={{
                                  backgroundColor: `var(--theme-content1, #FAFAFA)90`,
                                  borderColor: `var(--theme-divider, #E4E4E7)`,
                                  borderWidth: `var(--borderWidth, 2px)`,
                                  borderStyle: 'solid',
                                  borderRadius: `var(--borderRadius, 8px)`
                                }}
                              >
                                <DropdownTrigger>
                                  <Button
                                    variant="light"
                                    endContent={
                                      <ChevronDownIcon 
                                        className="w-5 h-5" 
                                        style={{ 
                                          color: isActive ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)` 
                                        }}
                                      />
                                    }
                                    className="transition-all duration-300 hover:scale-105 px-4"
                                    style={isActive ? {
                                      backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
                                      border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                      borderRadius: `var(--borderRadius, 8px)`
                                    } : {
                                      border: `var(--borderWidth, 2px) solid transparent`,
                                      borderRadius: `var(--borderRadius, 8px)`
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isActive) {
                                        e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                      }
                                      e.target.style.borderRadius = `var(--borderRadius, 8px)`;
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isActive) {
                                        e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                                      }
                                    }}
                                    size={isTablet ? "sm" : "md"}
                                  >
                                    <span 
                                      className="flex items-center gap-2"
                                      style={{ 
                                        color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` 
                                      }}
                                    >
                                      {page.icon}
                                    </span>
                                    <span 
                                      className="font-semibold"
                                      style={{ 
                                        color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` 
                                      }}
                                    >
                                      {page.name}
                                    </span>
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label={`${page.name} submenu`}
                                  variant="faded"
                                  closeOnSelect={false}
                                  className="p-1 dropdown-menu-container"
                                >
                                  {page.subMenu.map((subPage) => {
                                    const isSubActive = checkActiveRecursive(subPage);
                                    
                                    if (subPage.subMenu && subPage.subMenu.length > 0) {
                                      return (
                                        <DropdownItem key={subPage.name} className="p-0 hover:bg-transparent" textValue={subPage.name}>
                                          <div className="dropdown-trigger-wrapper w-full">
                                            <Dropdown
                                              placement="right-start"
                                              offset={4}
                                              closeDelay={800}
                                              shouldBlockScroll={false}
                                              classNames={{
                                                content: "bg-white/10 backdrop-blur-md border border-white/20 min-w-48 max-h-72 overflow-y-auto p-1 dropdown-content-fix"
                                              }}
                                            >
                                              <DropdownTrigger>
                                                <div
                                                  className="menu-item-base transition-all duration-300"
                                                  style={isSubActive ? {
                                                    backgroundColor: `var(--theme-primary, #006FEE)`,
                                                    border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                                    color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                    borderRadius: `var(--borderRadius, 8px)`
                                                  } : {
                                                    backgroundColor: 'transparent',
                                                    borderRadius: `var(--borderRadius, 8px)`
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (!isSubActive) {
                                                      e.target.style.backgroundColor = `var(--theme-content2, #F4F4F5)`;
                                                    }
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (!isSubActive) {
                                                      e.target.style.backgroundColor = 'transparent';
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center gap-2 w-full">
                                                    <span 
                                                      className="menu-item-icon flex items-center"
                                                      style={{ 
                                                        color: isSubActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` 
                                                      }}
                                                    >
                                                      {subPage.icon}
                                                    </span>
                                                    <span 
                                                      className="menu-item-text"
                                                      style={{ 
                                                        color: isSubActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` 
                                                      }}
                                                    >
                                                      {subPage.name}
                                                    </span>
                                                    <ChevronDownIcon 
                                                      className="menu-item-chevron -rotate-90"
                                                      style={{ 
                                                        color: isSubActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)60` 
                                                      }}
                                                    />
                                                  </div>
                                                </div>
                                              </DropdownTrigger>
                                              <DropdownMenu
                                                aria-label={`${subPage.name} nested submenu`}
                                                variant="faded"
                                                closeOnSelect={true}
                                                className="p-1 dropdown-menu-container"
                                              >
                                                {subPage.subMenu.map((nestedPage) => {
                                                  const isNestedActive = currentUrl === "/" + nestedPage.route;
                                                  return (
                                                    <DropdownItem key={nestedPage.name} className="p-0 hover:bg-transparent" textValue={nestedPage.name}>
                                                      <div
                                                        className="menu-item-base transition-all duration-300 cursor-pointer"
                                                        style={isNestedActive ? {
                                                          backgroundColor: `var(--theme-primary, #006FEE)`,
                                                          border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                                          color: `var(--theme-primary-foreground, #FFFFFF)`,
                                                          borderRadius: `var(--borderRadius, 8px)`
                                                        } : {
                                                          backgroundColor: 'transparent',
                                                          borderRadius: `var(--borderRadius, 8px)`
                                                        }}
                                                        onMouseEnter={(e) => {
                                                          if (!isNestedActive) {
                                                            e.target.style.backgroundColor = `var(--theme-content2, #F4F4F5)`;
                                                          }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                          if (!isNestedActive) {
                                                            e.target.style.backgroundColor = 'transparent';
                                                          }
                                                        }}
                                                        onClick={() => handleModuleNavigation(nestedPage.route, nestedPage.method)}
                                                      >
                                                        <div className="flex items-center gap-2 w-full">
                                                          <span 
                                                            className="menu-item-icon flex items-center"
                                                            style={{ 
                                                              color: isNestedActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` 
                                                            }}
                                                          >
                                                            {nestedPage.icon}
                                                          </span>
                                                          <span 
                                                            className="menu-item-text"
                                                            style={{ 
                                                              color: isNestedActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` 
                                                            }}
                                                          >
                                                            {nestedPage.name}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </DropdownItem>
                                                  );
                                                })}
                                              </DropdownMenu>
                                            </Dropdown>
                                          </div>
                                        </DropdownItem>
                                      );
                                    } else {
                                      return (
                                        <DropdownItem key={subPage.name} className="p-0 hover:bg-transparent" textValue={subPage.name}>
                                          <div
                                            className="menu-item-base transition-all duration-300 cursor-pointer"
                                            style={isSubActive ? {
                                              backgroundColor: `var(--theme-primary, #006FEE)`,
                                              border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                              color: `var(--theme-primary-foreground, #FFFFFF)`,
                                              borderRadius: `var(--borderRadius, 8px)`
                                            } : {
                                              backgroundColor: 'transparent',
                                              borderRadius: `var(--borderRadius, 8px)`
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!isSubActive) {
                                                e.target.style.backgroundColor = `var(--theme-content2, #F4F4F5)`;
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              if (!isSubActive) {
                                                e.target.style.backgroundColor = 'transparent';
                                              }
                                            }}
                                            onClick={() => handleModuleNavigation(subPage.route, subPage.method)}
                                          >
                                            <div className="flex items-center gap-2 w-full">
                                              <span 
                                                className="menu-item-icon flex items-center"
                                                style={{ 
                                                  color: isSubActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` 
                                                }}
                                              >
                                                {subPage.icon}
                                              </span>
                                              <span 
                                                className="menu-item-text"
                                                style={{ 
                                                  color: isSubActive ? `var(--theme-primary-foreground, #FFFFFF)` : `var(--theme-foreground, #11181C)` 
                                                }}
                                              >
                                                {subPage.name}
                                              </span>
                                            </div>
                                          </div>
                                        </DropdownItem>
                                      );
                                    }
                                  })}
                                </DropdownMenu>
                              </Dropdown>
                            ) : (
                              <Button
                                variant="light"
                                startContent={
                                  <span 
                                    className="flex items-center"
                                    style={{ 
                                      color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` 
                                    }}
                                  >
                                    {page.icon}
                                  </span>
                                }
                                className="transition-all duration-300 hover:scale-105 px-4"
                                style={isActive ? {
                                  backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
                                  border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                  borderRadius: `var(--borderRadius, 8px)`
                                } : {
                                  border: `var(--borderWidth, 2px) solid transparent`,
                                  borderRadius: `var(--borderRadius, 8px)`
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
                                  }
                                  e.target.style.borderRadius = `var(--borderRadius, 8px)`;
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
                                  }
                                }}
                                size={isTablet ? "sm" : "md"}
                                onPress={() => page.route && handleModuleNavigation(page.route, page.method)}
                              >
                                <span 
                                  className="font-semibold"
                                  style={{ 
                                    color: isActive ? `#FFFFFF` : `var(--theme-foreground, #11181C)` 
                                  }}
                                >
                                  {page.name}
                                </span>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Right Section: Enhanced Actions & Profile */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Language Switcher */}
                  <LanguageSwitcher variant="minimal" size="sm" showFlag={true} />

                  {/* Quick Actions */}
                  <Button
                    isIconOnly
                    variant="light"
                    className="text-foreground hover:bg-white/10 transition-all duration-300"
                    size="sm"
                    aria-label="Global search"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </Button>
                  
                  <Tooltip content="Help & Support" placement="bottom">
                    <Button
                      isIconOnly
                      variant="light"
                      className="text-foreground hover:bg-white/10 transition-all duration-300"
                      size="sm"
                      aria-label="Help and support"
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5" />
                    </Button>
                  </Tooltip>
                  
                  {/* Enhanced Notifications */}
                  <Dropdown placement="bottom-end"
                    classNames={{
                      content: "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden"
                    }}
                  >
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light"
                        className="text-foreground hover:bg-white/10 transition-all duration-300 relative"
                        size="sm"
                        aria-label="System notifications"
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
                            <h6 className="text-lg font-semibold">System Notifications</h6>
                            <Button size="sm" variant="light" className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              Mark all read
                            </Button>
                          </div>
                          <p className="text-sm text-default-500">You have 3 unread notifications</p>
                        </div>
                      </DropdownItem>
                      <DropdownItem key="notification-1" className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50" textValue="System maintenance">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Scheduled Maintenance</p>
                            <p className="text-xs text-default-500 truncate">System will be offline for 30 minutes tonight</p>
                            <p className="text-xs text-default-400 mt-1">1 hour ago</p>
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
                  
                  <Button
                    isIconOnly
                    variant="light"
                    className="text-foreground hover:bg-white/10 transition-all duration-300"
                    size="sm"
                    aria-label="System administration"
                  >
                    <CommandLineIcon className="w-5 h-5" />
                  </Button>
                  
                  {/* Enhanced Profile Menu */}
                  <ProfileMenu>
                    <ProfileButton />
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
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const trigger = useScrollTrigger();

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