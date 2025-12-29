import * as React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { showToast } from '@/utils/toastUtils';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Input,
  Badge,
  Kbd,
  Card,
  Chip,
  Tooltip,
} from "@heroui/react";

import ProfileMenu from '@/Components/ProfileMenu';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ProfileAvatar from '@/Components/ProfileAvatar';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  Bars3Icon,
  ChevronDownIcon,
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useMotionSystem } from '@/config/motionDepthSystem';

/**
 * Enhanced Desktop Header Component for Enterprise ERP System
 * Full-featured header with 3D effects, navigation, and professional appearance
 * 
 * @author Emam Hosen - Final Year CSE Project
 * @description Enterprise-grade header component with 3D depth effects
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
  // ===== 3D MOTION SYSTEM =====
  const motionSystem = useMotionSystem();
  
  // Cursor tracking for tilt effects
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);
  
  // ===== STATE MANAGEMENT =====
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
      if (expandedMenuRef.current && expandedMenuRef.current.contains(event.target)) {
        return;
      }
      if (expandButtonRef.current && expandButtonRef.current.contains(event.target)) {
        return;
      }
      setIsExpanded(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // ===== ENHANCED NAVIGATION HANDLER =====
  const handleModuleNavigation = useCallback((pageRoute, method = 'get') => {
    if (!pageRoute) {
      console.warn('Navigation attempted without valid route');
      return;
    }
    
    try {
      // Check if pageRoute is a named route or a URL path
      const isNamedRoute = hasRoute(pageRoute);
      
      if (isNamedRoute) {
        // Use named route with Inertia router
        router.visit(route(pageRoute), {
          method: method,
          preserveState: false,
          preserveScroll: false,
          onError: (errors) => {
            console.error('[Navigation] Navigation failed:', errors);
            showToast.error('Navigation failed. Please try again.');
          },
        });
      } else {
        // Treat as URL path - prepend / if needed
        const targetUrl = pageRoute.startsWith('/') ? pageRoute : `/${pageRoute}`;
        router.visit(targetUrl, {
          method: method,
          preserveState: false,
          preserveScroll: false,
          onError: (errors) => {
            console.error('[Navigation] Navigation failed:', errors);
            showToast.error('Navigation failed. Please try again.');
          },
        });
      }
    } catch (error) {
      console.error('[Navigation] Critical navigation error:', error);
      // Fallback to window.location
      const targetUrl = pageRoute.startsWith('/') ? pageRoute : `/${pageRoute}`;
      window.location.href = targetUrl;
    }
  }, []);

  // ===== PROFILE BUTTON COMPONENT - Flat Integrated Design =====
  const ProfileButton = React.memo(React.forwardRef(({ size = "md", className = "", ...props }, ref) => {
    const [userGreeting, setUserGreeting] = useState('');

    const getContextualGreeting = useCallback(() => {
      const hour = new Date().getHours();
      const firstName = auth.user.first_name || auth.user.name?.split(' ')[0] || 'User';
      
      let timeGreeting;
      if (hour < 12) timeGreeting = "Good morning";
      else if (hour < 17) timeGreeting = "Good afternoon";
      else timeGreeting = "Good evening";
      
      return { timeGreeting, firstName };
    }, [auth.user]);

    useEffect(() => {
      const updateGreeting = () => {
        const { timeGreeting } = getContextualGreeting();
        setUserGreeting(timeGreeting);
      };
      
      updateGreeting();
      const interval = setInterval(updateGreeting, 60000);
      return () => clearInterval(interval);
    }, [getContextualGreeting]);

    const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
    
    return (
      <div
        ref={ref}
        {...props}
        className={`
          group relative flex items-center gap-2 cursor-pointer 
          transition-all duration-200 ease-out
          hover:bg-default-100 active:scale-[0.98]
          ${size === "sm" ? "p-1.5 pr-3" : size === "lg" ? "p-2.5 pr-4" : "p-2 pr-3"}
          ${className}
        `}
        style={{
          borderRadius: 'var(--borderRadius, 8px)',
          fontFamily: 'var(--fontFamily, inherit)',
          backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
          border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
        }}
        tabIndex={0}
        role="button"
        aria-label={`User menu for ${auth.user.name}`}
        aria-haspopup="true"
      >
        {/* Avatar with Status */}
        <div className="relative shrink-0">
          <ProfileAvatar
            size={avatarSize}
            src={auth.user.profile_image_url || auth.user.profile_image}
            name={auth.user.name}
            className="transition-transform duration-200 group-hover:scale-105"
            showBorder
            isInteractive
          />
          
          {/* Online Status Dot */}
          <div 
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: 'var(--theme-success, #17C964)',
              borderColor: 'var(--theme-background, #FFFFFF)',
            }}
          />
        </div>

        {/* User Info - Compact */}
        <div className="hidden lg:flex flex-col text-left min-w-0 max-w-[140px]">
          <span 
            className="text-[10px] font-medium leading-tight"
            style={{ color: 'var(--theme-foreground-500, #71717A)' }}
          >
            {userGreeting},
          </span>
          <span 
            className="font-semibold text-sm leading-tight truncate"
            style={{ color: 'var(--theme-foreground, #11181C)' }}
          >
            {auth.user.name || 'User'}
          </span>
          <span 
            className="text-[10px] leading-tight truncate"
            style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
          >
            {auth.user.designation?.title || auth.user.role?.name || 'Team Member'}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDownIcon 
          className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:rotate-180"
          style={{ color: 'var(--theme-foreground-500, #71717A)' }}
        />
      </div>
    );
  }));
  ProfileButton.displayName = 'ProfileButton';

  // ===== ACTIVE STATE DETECTION =====
  const checkActiveRecursive = useCallback((menuItem) => {
    if (!menuItem) return false;
    
    if (menuItem.route && currentUrl === "/" + menuItem.route) {
      return true;
    }
    
    if (menuItem.subMenu && Array.isArray(menuItem.subMenu)) {
      return menuItem.subMenu.some(subItem => checkActiveRecursive(subItem));
    }
    
    return false;
  }, [currentUrl]);

  // ===== RENDER COMPONENT =====
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, z: -20 }}
      animate={{ 
        opacity: !trigger ? 1 : 0, 
        y: !trigger ? 0 : -20,
        z: !trigger ? 0 : -20
      }}
      transition={{ 
        duration: 0.4, 
        ease: motionSystem.easings.enterprise 
      }}
      style={{ 
        display: !trigger ? 'block' : 'none',
        perspective: motionSystem.PERSPECTIVE.subtle,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="p-4">
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
            fontFamily: `var(--fontFamily, 'Inter')`,
            transform: `scale(var(--scale, 1))`,
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
          }}
          whileHover={{
            z: motionSystem.DEPTH_LAYERS.elevated,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 30,
            },
          }}
        >
          <Card 
            className={`backdrop-blur-md overflow-visible ${motionSystem.shadows.elevated} ${motionSystem.glows.subtle}`}
            style={{
              background: `linear-gradient(135deg, 
                var(--theme-content1, #FAFAFA) 0%, 
                var(--theme-content2, #F4F4F5) 50%, 
                var(--theme-content3, #F1F3F4) 100%)`,
              borderColor: `var(--theme-divider, #E4E4E7)`,
              borderWidth: `var(--borderWidth, 2px)`,
              borderStyle: 'solid',
              borderRadius: `var(--borderRadius, 8px)`,
              boxShadow: `
                0 10px 40px -10px var(--theme-primary, #006FEE)15,
                0 0 0 1px var(--theme-divider, #E4E4E7),
                inset 0 1px 0 0 rgba(255,255,255,0.5)
              `,
              overflow: 'visible',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="w-full px-4 lg:px-6 overflow-visible">
              {/* Three-Section Layout: Logo | Menu | Profile */}
              <div className="flex items-center min-h-[64px] overflow-visible">
                
                {/* Section 1: Logo - Fixed width */}
                <div className="flex items-center gap-3 shrink-0 pr-4">
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
                      className="transition-all duration-300"
                      style={{
                        color: 'var(--theme-foreground, #11181C)',
                        backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                        border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                        borderRadius: `var(--borderRadius, 8px)`,
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

                  {/* Brand Section - Only show when sidebar is closed */}
                  {!internalSidebarOpen && (
                    <motion.div 
                      className="flex items-center justify-center overflow-hidden shrink-0"
                      style={{ 
                        width: '44px',
                        height: '44px',
                        backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 20%, transparent)`,
                        borderWidth: `var(--borderWidth, 2px)`,
                        borderStyle: 'solid',
                        borderRadius: `var(--borderRadius, 8px)`,
                        perspective: '1000px',
                        transformStyle: 'preserve-3d',
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        rotateY: 5,
                        z: 10,
                        boxShadow: '0 8px 25px -5px rgba(0,0,0,0.15)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
                    </motion.div>
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
                              <motion.div
                                style={{
                                  perspective: motionSystem.PERSPECTIVE.subtle,
                                  transformStyle: 'preserve-3d',
                                }}
                                variants={{
                                  idle: {
                                    z: motionSystem.DEPTH_LAYERS.surface,
                                    y: 0,
                                  },
                                  hover: {
                                    z: motionSystem.DEPTH_LAYERS.elevated,
                                    y: -2,
                                    transition: {
                                      type: 'spring',
                                      stiffness: 400,
                                      damping: 25,
                                    },
                                  },
                                  active: {
                                    z: motionSystem.DEPTH_LAYERS.floating,
                                    y: 0,
                                  },
                                }}
                                initial="idle"
                                whileHover="hover"
                                animate={isActive ? "active" : "idle"}
                              >
                                <Button
                                  variant="light"
                                  size="sm"
                                  className={`h-9 px-3 font-medium whitespace-nowrap gap-1 data-[hover=true]:bg-default-100 relative overflow-hidden ${motionSystem.shadows.subtle}`}
                                  endContent={<ChevronDownIcon className="w-3 h-3 opacity-60" />}
                                  style={isActive ? {
                                    backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)`,
                                    color: `var(--theme-primary, #006FEE)`,
                                    border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    fontWeight: 600,
                                    boxShadow: `0 4px 12px -2px var(--theme-primary, #006FEE)20`,
                                  } : {
                                    color: `var(--theme-foreground, #11181C)`,
                                    backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                                    border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                                    borderRadius: `var(--borderRadius, 8px)`,
                                    boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                                  }}
                                >
                                  {/* Light beam indicator for active items */}
                                  {isActive && (
                                    <motion.div
                                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                      style={{
                                        background: `linear-gradient(90deg, transparent, var(--theme-primary, #006FEE), transparent)`,
                                      }}
                                      initial={{ opacity: 0, scaleX: 0 }}
                                      animate={{
                                        opacity: [0.5, 1, 0.5],
                                        scaleX: [0.8, 1, 0.8],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                      }}
                                    />
                                  )}
                                  {page.name}
                                </Button>
                              </motion.div>
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
                              className={`p-2 ${motionSystem.shadows.floating} ${motionSystem.glows.moderate}`}
                              style={{
                                backgroundColor: `var(--theme-content1, #FFFFFF)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                                border: `1px solid var(--theme-divider, #E4E4E7)`,
                                boxShadow: `
                                  0 20px 60px -15px rgba(0,0,0,0.2),
                                  0 10px 30px -10px var(--theme-primary, #006FEE)10,
                                  0 0 0 1px var(--theme-divider, #E4E4E7),
                                  inset 0 1px 0 0 rgba(255,255,255,0.5)
                                `,
                                fontFamily: `var(--fontFamily, 'Inter')`,
                                perspective: motionSystem.PERSPECTIVE.moderate,
                                transformStyle: 'preserve-3d',
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
                                          <motion.div
                                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg cursor-pointer transition-colors"
                                            style={{
                                              backgroundColor: isSubActive ? `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)` : `color-mix(in srgb, var(--theme-content2, #F4F4F5) 30%, transparent)`,
                                              color: isSubActive ? `var(--theme-primary, #006FEE)` : `var(--theme-foreground, #11181C)`,
                                              border: isSubActive ? `1px solid var(--theme-primary, #006FEE)` : `1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 40%, transparent)`,
                                            }}
                                            whileHover={{ 
                                              scale: 1.01,
                                              y: -1,
                                              boxShadow: '0 4px 12px -3px rgba(0,0,0,0.1)',
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="w-4 h-4 opacity-70">{subPage.icon}</span>
                                              <span className="text-sm font-medium">{subPage.name}</span>
                                            </div>
                                            <ChevronDownIcon className="w-3 h-3 -rotate-90 opacity-50" />
                                          </motion.div>
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
                          <motion.div
                            key={`${page.name}-${index}`}
                            style={{
                              perspective: motionSystem.PERSPECTIVE.subtle,
                              transformStyle: 'preserve-3d',
                            }}
                            variants={{
                              idle: {
                                z: motionSystem.DEPTH_LAYERS.surface,
                                y: 0,
                              },
                              hover: {
                                z: motionSystem.DEPTH_LAYERS.elevated,
                                y: -2,
                                transition: {
                                  type: 'spring',
                                  stiffness: 400,
                                  damping: 25,
                                },
                              },
                              active: {
                                z: motionSystem.DEPTH_LAYERS.floating,
                                y: 0,
                              },
                            }}
                            initial="idle"
                            whileHover="hover"
                            animate={isActive ? "active" : "idle"}
                          >
                            <Button
                              variant="light"
                              size="sm"
                              className={`h-9 px-3 font-medium whitespace-nowrap data-[hover=true]:bg-default-100 relative overflow-hidden ${motionSystem.shadows.subtle}`}
                              style={isActive ? {
                                backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)`,
                                color: `var(--theme-primary, #006FEE)`,
                                border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                                borderRadius: `var(--borderRadius, 8px)`,
                                fontWeight: 600,
                                boxShadow: `0 4px 12px -2px var(--theme-primary, #006FEE)20`,
                              } : {
                                color: `var(--theme-foreground, #11181C)`,
                                backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                                border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                                borderRadius: `var(--borderRadius, 8px)`,
                                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)',
                              }}
                              onPress={() => page.route && handleModuleNavigation(page.route, page.method)}
                            >
                              {/* Light beam indicator for active items */}
                              {isActive && (
                                <motion.div
                                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                  style={{
                                    background: `linear-gradient(90deg, transparent, var(--theme-primary, #006FEE), transparent)`,
                                  }}
                                  initial={{ opacity: 0, scaleX: 0 }}
                                  animate={{
                                    opacity: [0.5, 1, 0.5],
                                    scaleX: [0.8, 1, 0.8],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              )}
                              {page.name}
                            </Button>
                          </motion.div>
                        );
                      })}

                      {/* Expand/Collapse Button */}
                      {hasOverflow && (
                        <div ref={expandButtonRef} className="shrink-0 flex items-center">
                          <motion.div
                            whileHover={{ 
                              scale: 1.05,
                              y: -1,
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          >
                            <Button
                              variant="light"
                              size="sm"
                              className="h-9 px-2 gap-1 font-medium"
                              style={{ 
                                borderRadius: `var(--borderRadius, 8px)`,
                                color: `var(--theme-primary, #006FEE)`,
                                backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`,
                                border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`,
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
                          </motion.div>
                        </div>
                      )}
                  </nav>
                )}

                {/* Section 3: Profile & Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  {/* Search Field */}
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

                  {/* Search Button */}
                  {(!internalSidebarOpen || isTablet) && (
                    <Tooltip content="Search (⌘K)" placement="bottom">
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                          y: -1,
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          className={`w-8 h-8 ${motionSystem.shadows.subtle}`}
                          style={{ 
                            borderRadius: `var(--borderRadius, 8px)`,
                            color: `var(--theme-foreground, #11181C)`,
                            backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                            border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                          }}
                          aria-label="Search"
                        >
                          <MagnifyingGlassIcon className="w-4 h-4" />
                        </Button>
                      </motion.div>
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
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                          y: -1,
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          className={`w-8 h-8 relative ${motionSystem.shadows.subtle}`}
                          style={{ 
                            borderRadius: `var(--borderRadius, 8px)`,
                            color: `var(--theme-foreground, #11181C)`,
                            backgroundColor: `color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)`,
                            border: `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 60%, transparent)`,
                          }}
                          aria-label="Notifications"
                        >
                          <BellIcon className="w-4 h-4" />
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <Badge
                              content="3"
                              color="danger"
                              size="sm"
                              className="absolute -top-0.5 -right-0.5 min-w-4 h-4 text-[10px]"
                            />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="Notifications"
                      className={`p-0 ${motionSystem.shadows.floating}`}
                      style={{
                        backgroundColor: `var(--theme-content1, #FFFFFF)`,
                        borderRadius: `var(--borderRadius, 12px)`,
                        border: `1px solid var(--theme-divider, #E4E4E7)`,
                        boxShadow: `
                          0 20px 60px -15px rgba(0,0,0,0.2),
                          0 10px 30px -10px var(--theme-primary, #006FEE)10,
                          0 0 0 1px var(--theme-divider, #E4E4E7)
                        `,
                        fontFamily: `var(--fontFamily, 'Inter')`,
                        perspective: motionSystem.PERSPECTIVE.moderate,
                        transformStyle: 'preserve-3d',
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
                    className="w-px h-8 mx-1" 
                    style={{ backgroundColor: `var(--theme-divider, #E4E4E7)` }}
                  />
                  
                  {/* Profile - Flat Integrated Design */}
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

export default DesktopHeader;
