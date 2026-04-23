import React, { memo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '@/Context/ThemeContext';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import { Button } from '@heroui/react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Breadcrumb from '@/Components/UI/Breadcrumb';
import NotificationDropdown from '@/Components/Navigation/NotificationDropdown';
import ProfileMenu from '@/Components/Profile/ProfileMenu';
import LanguageSwitcher from '@/Components/Navigation/LanguageSwitcher';
import ThemeSettingDrawer from '@/Components/Theme/ThemeSettingDrawer';

/**
 * DesktopHeader
 * Full-featured navigation bar rendered for tablet + desktop viewports.
 *
 * Props
 *   internalSidebarOpen  {boolean}   - current sidebar state
 *   handleInternalToggle {Function}  - toggle sidebar open/closed
 *   handleNavigation     {Function}  - programmatic route navigation
 *   currentPages         {Array}     - page tree for breadcrumb
 *   currentUrl           {string}    - current URL for breadcrumb active state
 *   isTablet             {boolean}   - whether viewport is tablet-size
 *   trigger              {boolean}   - scroll trigger for sticky header shadow
 *   auth                 {Object}    - authenticated user + permissions
 *   app                  {Object}    - app meta (name, version, etc.)
 *   logo                 {string}    - logo URL from branding settings
 */
const DesktopHeader = memo(({
    internalSidebarOpen,
    handleInternalToggle,
    handleNavigation,
    currentPages,
    currentUrl,
    isTablet,
    trigger,
    auth,
    app,
    logo,
}) => {
    const themeRadius = useThemeRadius();

    return (
        <header
            className={`
                sticky top-0 z-40 w-full
                bg-background/80 backdrop-blur-xl backdrop-saturate-150
                border-b border-divider/50
                transition-shadow duration-300
                ${trigger ? 'shadow-md' : ''}
            `}
            style={{ fontFamily: 'var(--fontFamily, Inter)' }}
        >
            <div className="flex items-center h-14 px-4 gap-3">
                {/* Sidebar toggle */}
                <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={handleInternalToggle}
                    aria-label="Toggle sidebar"
                    className="text-default-500 hover:text-foreground"
                >
                    <Bars3Icon className="w-5 h-5" />
                </Button>

                {/* Logo / App name */}
                <Link
                    href="/"
                    className="flex items-center gap-2 shrink-0 mr-2"
                >
                    {logo ? (
                        <img src={logo} alt={app?.name ?? 'Logo'} className="h-7 w-auto object-contain" />
                    ) : (
                        <span className="font-semibold text-sm text-foreground">
                            {app?.name ?? 'Aero'}
                        </span>
                    )}
                </Link>

                {/* Breadcrumb */}
                {!isTablet && (
                    <div className="flex-1 min-w-0">
                        <Breadcrumb />
                    </div>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <LanguageSwitcher variant="minimal" />
                    <ThemeSettingDrawer />
                    <NotificationDropdown />
                    <ProfileMenu auth={auth} />
                </div>
            </div>
        </header>
    );
});

DesktopHeader.displayName = 'DesktopHeader';
export default DesktopHeader;