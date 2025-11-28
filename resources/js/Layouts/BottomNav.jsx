import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button, Badge, Tooltip, Card, Chip, Avatar } from "@heroui/react";
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Link, usePage, router } from "@inertiajs/react";
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/Contexts/ThemeContext';
import { showToast } from '@/utils/toastUtils';

/**
 * Enhanced Bottom Navigation Component for Mobile ERP System
 * Matches Header and Sidebar design language with comprehensive theming
 * 
 * @author Enterprise ERP Team
 * @version 2.0.0 - Enhanced with consistent theming and animations
 */
const BottomNav = ({ auth, contentRef, toggleSideBar, sideBarOpen, toggleThemeDrawer }) => {
    const { url } = usePage().props;
    const { themeSettings } = useTheme();
    
    // ===== STATE MANAGEMENT =====
    const [activeTab, setActiveTab] = useState('dashboard');
    const bottomNavRef = useRef(null);

    // ===== CORE NAVIGATION ITEMS (4 MAIN + THEME) =====
    /**
     * Streamlined navigation for mobile with only essential items
     * Plus theme toggle button for mobile-specific UI control
     */
    const navItems = useMemo(() => [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: HomeIcon,
            href: '/dashboard',
            route: 'dashboard',
            tooltip: 'Go to main dashboard',
            priority: 'high',
            category: 'main'
        },
        {
            id: 'attendance',
            label: 'Attendance',
            icon: ClockIcon,
            href: '/attendance-employee',
            route: 'attendance-employee',
            tooltip: 'View your attendance records',
            priority: 'high',
            category: 'hr'
        },
        {
            id: 'leaves',
            label: 'Leaves',
            icon: DocumentTextIcon,
            href: '/leaves-employee',
            route: 'leaves-employee',
            tooltip: 'Manage leave requests',
            priority: 'high',
            category: 'hr'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: UserCircleIcon,
            href: `/profile/${auth.user.id}`,
            route: `profile.${auth.user.id}`,
            tooltip: `${auth.user.name}'s profile`,
            priority: 'high',
            category: 'user'
        },
        {
            id: 'theme',
            label: 'Theme',
            icon: CogIcon,
            action: 'theme',
            tooltip: 'Theme Settings',
            priority: 'high',
            category: 'settings',
            ariaLabel: 'Open theme settings'
        }
    ], [auth.user.id, auth.user.name]);

    // ===== ENHANCED NAVIGATION HANDLER =====
    /**
     * Simplified navigation handler matching Header pattern
     */
    const handleNavigation = useCallback(async (item) => {
        try {
            // Handle special actions
            switch (item.action) {
               
                    
                case 'theme':
                    // Handle theme settings
                    toggleThemeDrawer();
                   
                    return;
                    
             
                    
              
    
                    
                default:
                    // Handle navigation using simple router.visit like Header
                    if (item.href) {
                        setActiveTab(item.id);
                        router.visit(item.href, {
                            method: 'get',
                            preserveState: false,
                            preserveScroll: false
                        });
                    }
            }
        } catch (error) {
            console.error('[BottomNav] Navigation error:', error);
            showToast.error('Navigation failed. Please try again.');
        }
    }, [toggleSideBar, toggleThemeDrawer]);

    // ===== ACTIVE STATE DETECTION =====
    useEffect(() => {
        // Enhanced URL matching for better active state detection
        if (url.includes('/attendance-employee')) {
            setActiveTab('attendance');
        } else if (url.includes('/leaves-employee')) {
            setActiveTab('leaves');
        } else if (url.includes('/dashboard')) {
            setActiveTab('dashboard');
        } else if (url.includes('/profile/') && url.includes(auth.user.id.toString())) {
            setActiveTab('profile');
        } else {
            setActiveTab('dashboard'); // Default fallback
        }
    }, [url, auth.user.id]);

 




    // ===== ENHANCED BUTTON RENDERER =====
    /**
     * Renders navigation buttons with consistent theming and animations
     */
    const renderNavButton = useCallback((item, index) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;

        const buttonContent = (
            <motion.div
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            rotate: item.action === 'sidebar' && sideBarOpen ? 180 : 0,
                            scale: isActive ? 1.1 : 1
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <IconComponent 
                            className={`transition-all duration-300 ${
                                isActive 
                                    ? 'w-5 h-5 text-primary' 
                                    : 'w-5 h-5 text-foreground/70'
                            }`}
                            style={{
                                color: isActive 
                                    ? 'var(--theme-primary-foreground, #FFFFFF)' 
                                    : 'var(--theme-foreground, #11181C)70',
                                filter: isActive 
                                    ? 'drop-shadow(0 1px 2px color-mix(in srgb, var(--theme-primary, #006FEE) 25%, transparent))'
                                    : 'none'
                            }}
                        />
                    </motion.div>
                    
                    {/* Enhanced Badge System */}
                    <AnimatePresence>
                        {item.badge && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute -top-1 -right-1"
                            >
                                <Badge
                                    content={item.badge}
                                    color="danger"
                                    size="sm"
                                    className="animate-pulse"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Compact Label Display */}
                <motion.span
                    className={`text-xs transition-all duration-300 mt-0.5 ${
                        isActive 
                            ? 'font-semibold text-primary' 
                            : 'font-medium text-foreground/70'
                    }`}
                    style={{
                        color: isActive 
                            ? 'var(--theme-primary-foreground, #FFFFFF)' 
                            : 'var(--theme-foreground, #11181C)70',
                        fontSize: isActive ? '0.65rem' : '0.6rem'
                    }}
                    animate={{ 
                        scale: isActive ? 1.05 : 1,
                        fontWeight: isActive ? 700 : 500
                    }}
                >
                    {item.label}
                </motion.span>
            </motion.div>
        );

        const buttonProps = {
            key: item.id,
            variant: isActive ? "flat" : "light",
            size: "sm",
            className: `
                h-auto min-w-12 max-w-16 transition-all duration-300 relative p-1
                hover:scale-105 active:scale-95 overflow-hidden
                ${isActive ? '' : 'hover:bg-content2/50'}
            `,
            style: isActive ? {
                backgroundColor: `color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`,
                border: `var(--borderWidth, 2px) solid var(--theme-primary, #006FEE)`,
                borderRadius: `var(--borderRadius, 8px)`,
                maxHeight: '48px',
                height: 'fit-content'
            } : {
                backgroundColor: 'transparent',
                border: `var(--borderWidth, 2px) solid transparent`,
                borderRadius: `var(--borderRadius, 8px)`,
                maxHeight: '48px',
                height: 'fit-content'
            },
            onPress: () => handleNavigation(item),
            'aria-label': item.ariaLabel || `Navigate to ${item.label}`,
            'aria-current': isActive ? 'page' : undefined
        };

        // Enhanced Button with Tooltip
        const ButtonElement = (
            <Button {...buttonProps}>
                {buttonContent}
                
                {/* Active State Indicator */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                            style={{
                                backgroundColor: 'var(--theme-primary, #006FEE)'
                            }}
                        />
                    )}
                </AnimatePresence>
            </Button>
        );

        // Wrap with Tooltip for better UX
        return (
            <Tooltip
                key={item.id}
                content={item.tooltip}
                placement="top"
                delay={500}
                className="text-xs"
                color="foreground"
            >
                {ButtonElement}
            </Tooltip>
        );
    }, [activeTab, sideBarOpen, handleNavigation]);

    // ===== MAIN RENDER =====
    return (
        <motion.nav
            ref={bottomNavRef}
            role="navigation" 
            aria-label="Bottom navigation"
            className="block md:hidden w-full"
           
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
        >
            <div className="w-full h-full flex items-center px-4 py-1">
                <motion.div
                    layout
                    className="mx-auto max-w-sm h-full w-full"
                    animate={{
                        height: 'auto'
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <Card
                        className="backdrop-blur-xl border-none shadow-2xl h-full"
                        classNames={{
                            base: "bg-transparent border-none shadow-none",
                            wrapper: "px-4 max-w-full",
                            content: "gap-2"
                        }}
                        style={{
                            maxWidth:"full",
                            height:"60px",
                            background: `linear-gradient(to bottom right, 
                                color-mix(in srgb, var(--theme-content1, #FAFAFA) 95%, transparent), 
                                color-mix(in srgb, var(--theme-content2, #F4F4F5) 90%, transparent))`,
                            borderColor: 'color-mix(in srgb, var(--theme-divider, #E4E4E7) 40%, transparent)',
                            borderWidth: 'var(--borderWidth, 1px)',
                            borderStyle: 'solid',
                            borderRadius: 'var(--borderRadius, 20px)',
                            boxShadow: `
                                0 16px 32px color-mix(in srgb, var(--theme-shadow, #000000) 12%, transparent),
                                0 6px 12px color-mix(in srgb, var(--theme-shadow, #000000) 8%, transparent),
                                inset 0 1px 0 color-mix(in srgb, var(--theme-background, #FFFFFF) 40%, transparent)
                            `
                        }}
                    >
                        <div className="h-full flex items-center justify-center px-2 py-1">
                            {/* Equal Space Navigation - 5 Items */}
                            <div className="flex-1 flex items-center justify-around max-w-xs">
                                {navItems.map((item, index) => renderNavButton(item, index))}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </motion.nav>
    );
};

export default BottomNav;
