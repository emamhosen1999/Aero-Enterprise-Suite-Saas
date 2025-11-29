import React, { useState, useEffect } from 'react';
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Badge,
    Switch,
    Chip,
    Divider
} from '@heroui/react';
import {
    BellIcon,
    Cog6ToothIcon,
    MoonIcon,
    SunIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Link, usePage, router } from '@inertiajs/react';
import { useTheme } from '../Contexts/ThemeContext';
import ThemeSettingDrawer from './ThemeSettingDrawer';
import LanguageSwitcher from './LanguageSwitcher';
import ProfileAvatar from './ProfileAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ 
    title = "AEOS365",
    showUserMenu = true,
    showNotifications = true,
    showThemeToggle = true,
    showMobileMenu = true,
    customActions = null,
    variant = 'default', // 'default', 'minimal', 'glass'
    url,
    pages,
    toggleSideBar,
    sideBarOpen,
    toggleThemeDrawer
}) => {
    const { props } = usePage();
    const { auth } = props;
    const { themeSettings, toggleMode } = useTheme();
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3); // Mock notification count

    // Header styling variants
    const getHeaderStyles = () => {
        const baseStyles = "backdrop-blur-md bg-white/80 dark:bg-black/20 border-b border-white/20 dark:border-white/10";
        
        switch (variant) {
            case 'minimal':
                return "bg-white/5 backdrop-blur-sm border-b border-white/10";
            case 'glass':
                return "bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg";
            default:
                return baseStyles;
        }
    };

    // Navigation items - can be customized based on user role
    const navigationItems = [
        { label: 'Dashboard', href: route('dashboard') },
        { label: 'HR', href: '#' },
        { label: 'Projects', href: '#' },
        { label: 'Analytics', href: '#' },
        { label: 'Settings', href: '#' }
    ];

    // Handle logout
    const handleLogout = () => {
        router.post(route('logout'));
    };

    // Handle profile navigation
    const handleProfile = () => {
        if (auth?.user?.id) {
            router.visit(route('profile', { user: auth.user.id }));
        }
    };

    return (
        <>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="sticky top-0 z-50"
                style={{
                    transition: 'all var(--transition, 0.3s ease)',
                    fontFamily: 'var(--font-current, inherit)'
                }}
            >
                <Navbar
                    isMenuOpen={isMenuOpen}
                    onMenuOpenChange={setIsMenuOpen}
                    classNames={{
                        base: getHeaderStyles(),
                        wrapper: "px-4 sm:px-6 lg:px-8 max-w-full",
                        brand: "flex-grow-0",
                        content: "gap-4",
                        item: "hidden lg:flex",
                        menu: "bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 dark:border-white/10",
                        menuItem: "text-foreground hover:text-primary"
                    }}
                    height="64px"
                >
                    {/* Brand Section */}
                    <NavbarContent>
                        <NavbarBrand className="flex items-center gap-3">
                            {/* Logo */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm"
                                style={{
                                    background: `linear-gradient(135deg, var(--theme-primary, #006FEE)15, transparent)`,
                                    border: '1px solid rgba(var(--theme-primary-rgb, 0, 111, 238), 0.2)'
                                }}
                            >
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: 'var(--theme-primary, #006FEE)' }}
                                >
                                    A
                                </div>
                            </motion.div>
                            
                            {/* Title */}
                            <div className="hidden sm:block">
                                <h1 
                                    className="text-xl font-bold"
                                    style={{ 
                                        color: 'var(--theme-primary, #006FEE)',
                                        fontFamily: 'var(--font-current, inherit)'
                                    }}
                                >
                                    {title}
                                </h1>
                                <p className="text-xs text-default-500">
                                    Enterprise Suite
                                </p>
                            </div>
                        </NavbarBrand>

                        {/* Mobile Menu Toggle */}
                        {showMobileMenu && (
                            <NavbarMenuToggle
                                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                                className="lg:hidden text-foreground"
                                icon={isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                            />
                        )}
                    </NavbarContent>

                    {/* Desktop Navigation */}
                    <NavbarContent className="hidden lg:flex gap-6" justify="center">
                        {navigationItems.map((item, index) => (
                            <NavbarItem key={index}>
                                <Link
                                    href={item.href}
                                    className="text-foreground hover:text-primary transition-colors font-medium relative group"
                                >
                                    {item.label}
                                    <span 
                                        className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                                        style={{ backgroundColor: 'var(--theme-primary, #006FEE)' }}
                                    />
                                </Link>
                            </NavbarItem>
                        ))}
                    </NavbarContent>

                    {/* Actions Section */}
                    <NavbarContent justify="end">
                        {/* Language Switcher */}
                        <NavbarItem>
                            <LanguageSwitcher variant="minimal" size="sm" />
                        </NavbarItem>

                        {/* Theme Toggle */}
                        {showThemeToggle && (
                            <NavbarItem>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Switch
                                        size="sm"
                                        color="primary"
                                        thumbIcon={({ isSelected, className }) =>
                                            isSelected ? (
                                                <MoonIcon className={`${className} w-3 h-3`} />
                                            ) : (
                                                <SunIcon className={`${className} w-3 h-3`} />
                                            )
                                        }
                                        isSelected={themeSettings.mode === 'dark'}
                                        onValueChange={toggleMode}
                                        classNames={{
                                            wrapper: "bg-default-100"
                                        }}
                                    />
                                </motion.div>
                            </NavbarItem>
                        )}

                        {/* Theme Settings */}
                        <NavbarItem>
                            <motion.div whileTap={{ scale: 0.95 }}>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={() => setIsThemeDrawerOpen(true)}
                                    className="text-default-500 hover:text-primary"
                                >
                                    <Cog6ToothIcon className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        </NavbarItem>

                        {/* Notifications */}
                        {showNotifications && (
                            <NavbarItem>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Badge 
                                        content={notificationCount} 
                                        color="danger" 
                                        size="sm"
                                        isInvisible={notificationCount === 0}
                                    >
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            className="text-default-500 hover:text-primary"
                                        >
                                            <BellIcon className="w-5 h-5" />
                                        </Button>
                                    </Badge>
                                </motion.div>
                            </NavbarItem>
                        )}

                        {/* Custom Actions */}
                        {customActions && (
                            <NavbarItem>
                                {customActions}
                            </NavbarItem>
                        )}

                        {/* User Menu */}
                        {showUserMenu && auth?.user && (
                            <NavbarItem>
                                <Dropdown placement="bottom-end">
                                    <DropdownTrigger>
                                        <motion.div 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <ProfileAvatar
                                                size="sm"
                                                src={auth.user.profile_photo_url}
                                                name={auth.user.name}
                                                showBorder
                                            />
                                            <div className="hidden md:block text-left">
                                                <p className="text-sm font-medium text-foreground">{auth.user.name}</p>
                                                <p className="text-xs text-default-500">{auth.user.email}</p>
                                            </div>
                                            <ChevronDownIcon className="w-4 h-4 text-default-500" />
                                        </motion.div>
                                    </DropdownTrigger>
                                    <DropdownMenu 
                                        aria-label="User menu"
                                        classNames={{
                                            base: "bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 dark:border-white/10",
                                            content: "p-2"
                                        }}
                                    >
                                        <DropdownItem 
                                            key="profile" 
                                            startContent={<UserIcon className="w-4 h-4" />}
                                            onPress={handleProfile}
                                        >
                                            Profile
                                        </DropdownItem>
                                        <DropdownItem 
                                            key="settings" 
                                            startContent={<Cog6ToothIcon className="w-4 h-4" />}
                                        >
                                            Settings
                                        </DropdownItem>
                                        <DropdownItem 
                                            key="logout" 
                                            startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                                            color="danger"
                                            onPress={handleLogout}
                                        >
                                            Logout
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </NavbarItem>
                        )}
                    </NavbarContent>

                    {/* Mobile Menu */}
                    <NavbarMenu>
                        <div className="flex flex-col gap-4 p-4">
                            {/* User Info in Mobile */}
                            {auth?.user && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 backdrop-blur-sm"
                                >
                                    <ProfileAvatar
                                        src={auth.user.profile_photo_url}
                                        name={auth.user.name}
                                        size="md"
                                        showBorder
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">{auth.user.name}</p>
                                        <p className="text-sm text-default-500">{auth.user.email}</p>
                                    </div>
                                </motion.div>
                            )}

                            <Divider className="bg-white/20" />

                            {/* Navigation Items */}
                            {navigationItems.map((item, index) => (
                                <NavbarMenuItem key={index}>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className="w-full text-foreground hover:text-primary font-medium p-3 rounded-lg hover:bg-primary/10 transition-all"
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                </NavbarMenuItem>
                            ))}

                            <Divider className="bg-white/20" />

                            {/* Mobile Actions */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="light"
                                    startContent={<UserIcon className="w-4 h-4" />}
                                    onPress={handleProfile}
                                    className="justify-start"
                                >
                                    Profile
                                </Button>
                                <Button
                                    variant="light"
                                    startContent={<Cog6ToothIcon className="w-4 h-4" />}
                                    onPress={() => setIsThemeDrawerOpen(true)}
                                    className="justify-start"
                                >
                                    Theme Settings
                                </Button>
                                <Button
                                    variant="light"
                                    color="danger"
                                    startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                                    onPress={handleLogout}
                                    className="justify-start"
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </NavbarMenu>
                </Navbar>

                {/* Theme Status Indicator */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2"
                >
                    <Chip
                        size="sm"
                        variant="flat"
                        style={{
                            backgroundColor: `var(--theme-primary, #006FEE)20`,
                            color: 'var(--theme-primary, #006FEE)',
                            fontSize: '10px'
                        }}
                    >
                        {themeSettings.activeTheme} • {themeSettings.mode}
                    </Chip>
                </motion.div>
            </motion.div>

            {/* Theme Settings Drawer */}
            <AnimatePresence>
                {isThemeDrawerOpen && (
                    <ThemeSettingDrawer
                        isOpen={isThemeDrawerOpen}
                        onClose={() => setIsThemeDrawerOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;
