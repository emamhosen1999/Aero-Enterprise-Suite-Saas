import React, { memo, useMemo } from 'react';

import { ProgressiveSkeleton, SmartLoadingSpinner } from './EnhancedLoading';

/**
 * Enhanced Layout Fallback Components
 * 
 * Features:
 * - Component-specific skeleton layouts
 * - Progressive loading animations
 * - Consistent design system
 * - Performance optimized
 * - Accessibility compliant
 */

// Enhanced Header Fallback
export const HeaderFallback = memo(() => {

    
    return (
        <Paper
            elevation={0}
            sx={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}
        >
            {/* Logo area */}
            <Box className="flex items-center gap-3">
                <ProgressiveSkeleton variant="circular" width={40} height={40} />
                <ProgressiveSkeleton width={120} height={24} delay={50} />
            </Box>

            {/* Center navigation */}
            <Box className="hidden md:flex items-center gap-6">
                {[...Array(4)].map((_, i) => (
                    <ProgressiveSkeleton 
                        key={i} 
                        width={80} 
                        height={20} 
                        delay={100 + (i * 30)} 
                    />
                ))}
            </Box>

            {/* Right side actions */}
            <Box className="flex items-center gap-3">
                <ProgressiveSkeleton variant="circular" width={36} height={36} delay={200} />
                <ProgressiveSkeleton variant="circular" width={36} height={36} delay={230} />
                <ProgressiveSkeleton width={32} height={20} delay={260} />
            </Box>
        </Paper>
    );
});

HeaderFallback.displayName = 'HeaderFallback';

// Enhanced Sidebar Fallback
export const SidebarFallback = memo(() => {
 
    
    const menuItems = useMemo(() => 
        Array.from({ length: 8 }, (_, i) => ({
            hasIcon: Math.random() > 0.3,
            hasSubItems: Math.random() > 0.7,
            width: `${Math.random() * 40 + 60}%`
        })), []
    );

    return (
        <Box
            sx={{
                width: 280,
                height: '100vh',
                background: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 0, 0, 0.3)' 
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header area */}
            <Box className="p-4 border-b border-white/10">
                <ProgressiveSkeleton width="70%" height={24} />
                <ProgressiveSkeleton width="50%" height={16} delay={50} />
            </Box>

            {/* Menu items */}
            <Box className="flex-1 p-2 space-y-2">
                {menuItems.map((item, index) => (
                    <Box key={index} className="flex items-center gap-3 p-3 rounded-lg">
                        {item.hasIcon && (
                            <ProgressiveSkeleton 
                                variant="circular" 
                                width={20} 
                                height={20} 
                                delay={index * 40}
                            />
                        )}
                        <ProgressiveSkeleton 
                            width={item.width} 
                            height={16} 
                            delay={index * 40 + 20}
                        />
                    </Box>
                ))}
            </Box>

            {/* Footer area */}
            <Box className="p-4 border-t border-white/10">
                <Box className="flex items-center gap-3">
                    <ProgressiveSkeleton variant="circular" width={32} height={32} />
                    <Box className="flex-1">
                        <ProgressiveSkeleton width="60%" height={14} />
                        <ProgressiveSkeleton width="40%" height={12} delay={50} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
});

SidebarFallback.displayName = 'SidebarFallback';

// Enhanced Content Fallback
export const ContentFallback = memo(({ variant = 'page' }) => {

    
    const renderPageFallback = () => (
        <Box className="p-6 space-y-6">
            {/* Page header */}
            <Box className="space-y-3">
                <ProgressiveSkeleton width="30%" height={32} />
                <ProgressiveSkeleton width="60%" height={20} delay={50} />
            </Box>

            {/* Action bar */}
            <Box className="flex justify-between items-center">
                <Box className="flex gap-3">
                    <ProgressiveSkeleton width={120} height={36} delay={100} />
                    <ProgressiveSkeleton width={100} height={36} delay={130} />
                </Box>
                <ProgressiveSkeleton width={80} height={36} delay={160} />
            </Box>

            {/* Main content cards */}
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Box key={i} className="space-y-4 p-4 rounded-xl border border-white/10">
                        <ProgressiveSkeleton width="80%" height={20} delay={200 + (i * 30)} />
                        <ProgressiveSkeleton width="100%" height={60} delay={220 + (i * 30)} />
                        <Box className="flex justify-between">
                            <ProgressiveSkeleton width="40%" height={16} delay={240 + (i * 30)} />
                            <ProgressiveSkeleton width="25%" height={16} delay={260 + (i * 30)} />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    const renderTableFallback = () => (
        <Box className="p-6">
            {/* Table header */}
            <Box className="flex justify-between items-center mb-6">
                <ProgressiveSkeleton width="25%" height={28} />
                <Box className="flex gap-3">
                    <ProgressiveSkeleton width={100} height={36} />
                    <ProgressiveSkeleton width={80} height={36} delay={30} />
                </Box>
            </Box>

            {/* Table content */}
            <Box className="rounded-xl border border-white/10 overflow-hidden">
                {/* Table header */}
                <Box className="grid grid-cols-5 gap-4 p-4 bg-white/5 border-b border-white/10">
                    {[...Array(5)].map((_, i) => (
                        <ProgressiveSkeleton 
                            key={i} 
                            width="80%" 
                            height={16} 
                            delay={i * 20} 
                        />
                    ))}
                </Box>

                {/* Table rows */}
                {[...Array(8)].map((_, rowIndex) => (
                    <Box 
                        key={rowIndex} 
                        className="grid grid-cols-5 gap-4 p-4 border-b border-white/5 last:border-b-0"
                    >
                        {[...Array(5)].map((_, colIndex) => (
                            <ProgressiveSkeleton
                                key={colIndex}
                                width={colIndex === 0 ? "90%" : `${Math.random() * 30 + 50}%`}
                                height={14}
                                delay={(rowIndex * 5 + colIndex) * 15}
                            />
                        ))}
                    </Box>
                ))}
            </Box>
        </Box>
    );

    const renderFormFallback = () => (
        <Box className="p-6 max-w-2xl mx-auto">
            {/* Form header */}
            <Box className="mb-8 space-y-2">
                <ProgressiveSkeleton width="40%" height={32} />
                <ProgressiveSkeleton width="70%" height={20} delay={50} />
            </Box>

            {/* Form fields */}
            <Box className="space-y-6">
                {[...Array(6)].map((_, i) => (
                    <Box key={i} className="space-y-2">
                        <ProgressiveSkeleton 
                            width="30%" 
                            height={16} 
                            delay={100 + (i * 30)} 
                        />
                        <ProgressiveSkeleton 
                            width="100%" 
                            height={48} 
                            delay={120 + (i * 30)} 
                        />
                    </Box>
                ))}

                {/* Action buttons */}
                <Box className="flex gap-4 pt-6">
                    <ProgressiveSkeleton width={100} height={40} delay={400} />
                    <ProgressiveSkeleton width={80} height={40} delay={430} />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.palette.mode === 'dark' 
                    ? 'rgba(15, 20, 25, 0.95)' 
                    : 'rgba(248, 250, 252, 1)',
                willChange: 'contents'
            }}
        >
            {variant === 'table' && renderTableFallback()}
            {variant === 'form' && renderFormFallback()}
            {variant === 'page' && renderPageFallback()}
        </Box>
    );
});

ContentFallback.displayName = 'ContentFallback';

// Enhanced Breadcrumb Fallback
export const BreadcrumbFallback = memo(() => (
    <Box className="flex items-center gap-2 p-4 border-b border-white/10">
        {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
                <ProgressiveSkeleton 
                    width={`${Math.random() * 30 + 60}px`} 
                    height={16} 
                    delay={i * 30} 
                />
                {i < 2 && (
                    <ProgressiveSkeleton 
                        width={16} 
                        height={16} 
                        delay={i * 30 + 15} 
                    />
                )}
            </React.Fragment>
        ))}
    </Box>
));

BreadcrumbFallback.displayName = 'BreadcrumbFallback';

// Enhanced Bottom Navigation Fallback
export const BottomNavFallback = memo(() => (
    <Box 
        className="fixed bottom-0 left-0 right-0 md:hidden"
        sx={{
            height: 64,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            px: 2
        }}
    >
        {[...Array(5)].map((_, i) => (
            <Box key={i} className="flex flex-col items-center gap-1">
                <ProgressiveSkeleton 
                    variant="circular" 
                    width={24} 
                    height={24} 
                    delay={i * 20} 
                />
                <ProgressiveSkeleton 
                    width={32} 
                    height={10} 
                    delay={i * 20 + 10} 
                />
            </Box>
        ))}
    </Box>
));

BottomNavFallback.displayName = 'BottomNavFallback';

// Smart Layout Fallback Selector
export const SmartLayoutFallback = memo(({ type = 'default', variant = 'page' }) => {
    const fallbackComponents = {
        header: HeaderFallback,
        sidebar: SidebarFallback,
        content: () => <ContentFallback variant={variant} />,
        breadcrumb: BreadcrumbFallback,
        bottomNav: BottomNavFallback,
        default: () => (
            <Box className="flex items-center justify-center h-full min-h-[200px]">
                <SmartLoadingSpinner size={40} delay={0} />
            </Box>
        )
    };

    const FallbackComponent = fallbackComponents[type] || fallbackComponents.default;
    
    return <FallbackComponent />;
});

SmartLayoutFallback.displayName = 'SmartLayoutFallback';

export default SmartLayoutFallback;
