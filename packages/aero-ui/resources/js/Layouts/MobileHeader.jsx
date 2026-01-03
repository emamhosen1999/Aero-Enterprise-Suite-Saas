import * as React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Badge,
  Kbd,
  Card,
} from "@heroui/react";

import ProfileMenu from '@/Components/ProfileMenu';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ProfileAvatar from '@/Components/ProfileAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  ChevronDownIcon,
  BellIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useMotionSystem } from '@/config/motionDepthSystem';

/**
 * Enhanced Profile Button for Mobile
 * Optimized for touch interactions and smaller screens
 */
const EnhancedProfileButton = React.memo(React.forwardRef(({ 
  auth, 
  profileMenuState,
  size = "sm", 
  className = "", 
  ...props 
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [userGreeting, setUserGreeting] = useState('');
  const motionSystem = useMotionSystem();

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
    <motion.div
      ref={ref}
      {...props}
      className={`
        group relative flex items-center gap-2 cursor-pointer 
        transition-all duration-300 ease-out
        focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent
        p-1.5
        ${className}
      `}
      style={{
        borderRadius: 'var(--borderRadius, 12px)',
        fontFamily: 'var(--fontFamily, inherit)',
        transform: `scale(var(--scale, 1))`,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
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
      whileHover={{ 
        scale: 1.02,
        y: -1,
        boxShadow: '0 6px 20px -5px rgba(0,0,0,0.15)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
    </motion.div>
  );
}));

EnhancedProfileButton.displayName = 'EnhancedProfileButton';

/**
 * Mobile Header Component
 * Optimized for mobile and touch interactions in ERP context
 * 
 * @author Emam Hosen - Final Year CSE Project
 * @description Enterprise-grade mobile header with 3D effects and touch-optimized UX
 */
const MobileHeader = React.memo(({ 
  internalSidebarOpen, 
  handleInternalToggle, 
  handleNavigation, 
  auth, 
  app,
  logo 
}) => {
  const motionSystem = useMotionSystem();
  
  // Profile dropdown state management
  const [profileMenuState, setProfileMenuState] = useState({
    isLoading: false,
    hasUnreadNotifications: true,
    userStatus: 'online'
  });

  return (
    <div className="p-4 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: -10, z: -10 }}
        animate={{ opacity: 1, y: 0, z: 0 }}
        transition={{ 
          duration: 0.4,
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          perspective: motionSystem.PERSPECTIVE.subtle,
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          whileHover={{
            z: motionSystem.DEPTH_LAYERS.elevated,
            y: -2,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          }}
        >
          <Card
            className={`overflow-hidden transition-all duration-300 ${motionSystem.shadows.elevated} ${motionSystem.glows.subtle}`}
            style={{
              background: `linear-gradient(135deg, 
                var(--theme-content1, #FAFAFA) 20%, 
                var(--theme-content2, #F4F4F5) 10%, 
                var(--theme-content3, #F1F3F4) 20%)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
              borderWidth: `var(--borderWidth, 2px)`,
              borderStyle: 'solid',
              borderRadius: `var(--borderRadius, 12px)`,
              fontFamily: `var(--fontFamily, "Inter")`,
              boxShadow: `
                0 10px 40px -10px var(--theme-primary, #006FEE)15,
                0 0 0 1px var(--theme-divider, #E4E4E7),
                inset 0 1px 0 0 rgba(255,255,255,0.5)
              `,
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
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    rotateX: -2,
                    y: -1,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={handleInternalToggle}
                    className="text-foreground transition-all duration-300"
                    style={{
                      color: 'var(--theme-foreground, inherit)',
                      backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                      border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                      borderRadius: 'var(--borderRadius, 8px)',
                      boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
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
                </motion.div>
                
                {/* Logo & Brand - Show/hide based on sidebar state */}
                <AnimatePresence mode="wait">
                  {!internalSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -20, z: -10 }}
                      animate={{ opacity: 1, x: 0, z: 0 }}
                      exit={{ opacity: 0, x: -20, z: -10 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                    >
                      <NavbarBrand className="flex items-center gap-3 min-w-0">
                        <motion.div 
                          className="relative"
                          whileHover={{ 
                            scale: 1.05,
                            rotateY: 5,
                            z: 10,
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          style={{
                            perspective: '1000px',
                            transformStyle: 'preserve-3d',
                          }}
                        >
                          <div 
                            className="rounded-xl flex items-center justify-center shadow-xl overflow-hidden transition-all duration-300"
                            style={{ 
                              width: 'calc(60px - 20px)',
                              height: 'calc(60px - 20px)',
                              aspectRatio: '1',
                              background: `linear-gradient(135deg, var(--theme-primary, #006FEE)15, var(--theme-primary, #006FEE)05)`,
                              borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`,
                              borderWidth: 'var(--borderWidth, 2px)',
                              borderStyle: 'solid',
                              borderRadius: 'var(--borderRadius, 12px)',
                              boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)',
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
                        </motion.div>
                      </NavbarBrand>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavbarContent>

              {/* Center Search - Hidden on mobile, shown on tablet+ */}
              <NavbarContent justify="center" className="hidden md:flex flex-1 max-w-md">
                <motion.div
                  whileHover={{ 
                    scale: 1.02,
                    y: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-full"
                >
                  <Input
                    placeholder="Search products, users, data..."
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
                </motion.div>
              </NavbarContent>

              {/* Right Controls */}
              <NavbarContent justify="end" className="flex items-center gap-1 min-w-0">
                {/* Mobile Search */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Button
                    isIconOnly
                    variant="light"
                    className="md:hidden text-foreground transition-all duration-300"
                    style={{
                      color: 'var(--theme-foreground, inherit)',
                      backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                      border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                      borderRadius: 'var(--borderRadius, 8px)',
                      boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                    }}
                    size="sm"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </Button>
                </motion.div>

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
                    <motion.div
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Button
                        isIconOnly
                        variant="light"
                        className="relative text-foreground transition-all duration-300"
                        style={{
                          color: 'var(--theme-foreground, inherit)',
                          backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                          border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                          borderRadius: 'var(--borderRadius, 8px)',
                          boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
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
                    </motion.div>
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
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Button
                    isIconOnly
                    variant="light"
                    className="text-foreground"
                    style={{
                      color: 'var(--theme-foreground, inherit)',
                      backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                      border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                      borderRadius: 'var(--borderRadius, 8px)',
                      boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                    }}
                    size="sm"
                    aria-label="System Tools"
                  >
                    <CommandLineIcon className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* User Profile Menu */}
                <ProfileMenu>
                  <EnhancedProfileButton 
                    auth={auth} 
                    profileMenuState={profileMenuState} 
                    size="sm" 
                  />
                </ProfileMenu>
              </NavbarContent>
            </Navbar>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
});

MobileHeader.displayName = 'MobileHeader';

export default MobileHeader;
