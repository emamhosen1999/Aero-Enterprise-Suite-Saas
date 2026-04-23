import React, { memo } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@heroui/react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import NotificationDropdown from '@/Components/Navigation/NotificationDropdown';
import ProfileMenu from '@/Components/Profile/ProfileMenu';

/**
 * MobileHeader
 * Compact navigation bar rendered for mobile viewports.
 *
 * Props
 *   internalSidebarOpen  {boolean}   - current sidebar state
 *   handleInternalToggle {Function}  - toggle sidebar open/closed
 *   handleNavigation     {Function}  - programmatic route navigation
 *   auth                 {Object}    - authenticated user + permissions
 *   app                  {Object}    - app meta (name, version, etc.)
 *   logo                 {string}    - logo URL from branding settings
 */
const MobileHeader = memo(({
    internalSidebarOpen,
    handleInternalToggle,
    handleNavigation,
    auth,
    app,
    logo,
}) => {
    return (
        <header
            className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-b border-divider/50"
            style={{ fontFamily: 'var(--fontFamily, Inter)' }}
        >
            <div className="flex items-center h-14 px-3 gap-2">
                {/* Sidebar toggle */}
                <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={handleInternalToggle}
                    aria-label="Toggle sidebar"
                    className="text-default-500"
                >
                    <Bars3Icon className="w-5 h-5" />
                </Button>

                {/* Logo */}
                <Link href="/" className="flex items-center gap-1.5 flex-1 min-w-0">
                    {logo ? (
                        <img src={logo} alt={app?.name ?? 'Logo'} className="h-6 w-auto object-contain" />
                    ) : (
                        <span className="font-semibold text-sm text-foreground truncate">
                            {app?.name ?? 'Aero'}
                        </span>
                    )}
                </Link>

                {/* Right side actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <NotificationDropdown />
                    <ProfileMenu auth={auth} compact />
                </div>
            </div>
        </header>
    );
});

MobileHeader.displayName = 'MobileHeader';
export default MobileHeader;