import React from 'react';
import { Card, CardHeader, CardBody, Skeleton } from "@heroui/react";

// Custom hook to replicate MUI's useMediaQuery functionality
const useMediaQuery = (query) => {
    const [matches, setMatches] = React.useState(false);
    
    React.useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);
        
        const handler = (event) => setMatches(event.matches);
        mediaQuery.addEventListener('change', handler);
        
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);
    
    return matches;
};

/**
 * Shared statistics cards component with enhanced responsive design for any number of cards
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects with structure: 
 *   { title, value, icon, color, description, iconBg?, valueColor?, customStyle? }
 * @param {string} props.gridCols - CSS grid columns classes (optional, auto-calculated if not provided)
 * @param {string} props.className - Additional CSS classes for the container
 * @param {boolean} props.animate - Whether to apply staggered animation (default: true)
 * @param {boolean} props.compact - Use compact layout for smaller cards (default: false)
 * @param {boolean} props.isLoading - Show loading skeletons instead of data (default: false)
 */
const StatsCards = ({ stats = [], gridCols, className = "mb-6", animate = true, compact = false, isLoading = false }) => {
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(max-width: 768px)');
    const isLargeTablet = useMediaQuery('(max-width: 1024px)');

    // Enhanced grid layout calculation that scales with any number of cards
    const getGridCols = () => {
        if (gridCols) return gridCols;
        
        const count = stats.length;
          if (isMobile) {
            // Mobile: Compact vertical layout - optimized for any number of cards
            if (count <= 2) return 'grid-cols-2';
            if (count <= 4) return 'grid-cols-2';
            if (count <= 6) return 'grid-cols-2'; // 2 columns for up to 6 items
            if (count <= 10) return 'grid-cols-2'; // 2 columns for 7-10 items
            return 'grid-cols-3'; // 3 columns for 11+ items on mobile for extreme cases
        }
        
        if (isTablet) {
            // Tablet: Balance between compactness and readability
            if (count <= 2) return 'grid-cols-2';
            if (count <= 3) return 'grid-cols-3';
            if (count <= 6) return 'grid-cols-3'; // 3 columns for 4-6 items
            if (count <= 9) return 'grid-cols-3'; // Keep 3 columns for 7-9 items
            return 'grid-cols-4'; // 4 columns for 10+ items
        }
        
        if (isLargeTablet) {
            // Large tablet: More space available
            if (count <= 2) return 'grid-cols-2';
            if (count <= 4) return 'grid-cols-4';
            if (count <= 6) return 'grid-cols-3'; // 3x2 grid for 5-6 items
            if (count <= 8) return 'grid-cols-4'; // 4x2 grid for 7-8 items
            return 'grid-cols-4'; // Max 4 columns for 9+ items
        }
        
        // Desktop: Optimal layout for larger screens
        if (count <= 2) return `grid-cols-${count}`;
        if (count <= 4) return 'grid-cols-4';
        if (count <= 6) return 'grid-cols-3'; // 3x2 grid for 5-6 items
        if (count <= 8) return 'grid-cols-4'; // 4x2 grid for 7-8 items
        if (count <= 12) return 'grid-cols-4'; // 4x3 grid for 9-12 items
        return 'grid-cols-5'; // 5 columns for 13+ items
    };

    // Dynamic card sizing based on count and screen size
    const getCardClasses = () => {
        const count = stats.length;
        let baseClasses = "transition-all duration-200";
        
        if (isMobile) {
            // Mobile: More compact cards for better fit
            if (count > 6) {
                return `${baseClasses} min-h-[80px]`; // Very compact on mobile for many cards
            }
            return `${baseClasses} min-h-[100px]`; // Standard mobile height
        }
        
        if (isTablet) {
            // Tablet: Balanced sizing
            if (count > 8) {
                return `${baseClasses} min-h-[90px]`; // Compact for many cards
            }
            return `${baseClasses} min-h-[110px]`; // Standard tablet height
        }
        
        // Desktop: Full-size cards
        if (count > 10) {
            return `${baseClasses} min-h-[100px]`; // Slightly compact for many cards
        }
        return `${baseClasses} min-h-[120px]`; // Standard desktop height
    };

    // Get theme-aware card styles
    const getCardStyle = () => ({
        background: `var(--theme-content1, #FAFAFA)`,
        borderColor: `var(--theme-divider, #E4E4E7)`,
        borderWidth: `var(--borderWidth, 2px)`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
    });

    // Loading skeleton component
    const StatsLoadingSkeleton = () => {
        // Show skeleton cards based on expected count or default 4
        const skeletonCount = stats.length || 4;
        
        return (
            <div className={className}>
                <div className={`grid gap-4 ${getGridCols()}`}>
                    {Array.from({ length: skeletonCount }).map((_, index) => (
                        <Card
                            key={index}
                            className="bg-content1/50 backdrop-blur-sm border border-divider/30"
                            style={getCardStyle()}
                        >
                            {isMobile && skeletonCount > 4 ? (
                                // Compact mobile layout skeleton
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="w-8 h-8 rounded-md" />
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <Skeleton className="w-16 h-3 rounded" />
                                            <Skeleton className="w-12 h-4 rounded" />
                                        </div>
                                    </div>
                                </CardBody>
                            ) : (
                                // Standard layout skeleton
                                <>
                                    <CardHeader className={`pb-2 ${isMobile ? 'p-3' : 'p-4'}`}>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg`} />
                                            <Skeleton className={`${isMobile ? 'w-20 h-4' : 'w-24 h-5'} rounded`} />
                                        </div>
                                    </CardHeader>
                                    
                                    <CardBody className={`pt-0 ${isMobile ? 'p-3' : 'p-4'}`}>
                                        <Skeleton className={`${isMobile ? 'w-16 h-6' : 'w-20 h-8'} rounded mb-2`} />
                                        <Skeleton className={`${isMobile ? 'w-24 h-3' : 'w-32 h-4'} rounded`} />
                                    </CardBody>
                                </>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    // Show loading skeleton when loading
    if (isLoading) {
        return <StatsLoadingSkeleton />;
    }

    if (!stats || stats.length === 0) return null;

    return (
        <div className={className}>
            <div className={`grid gap-4 ${getGridCols()}`}>
                {stats.map((stat, index) => {
                    const {
                        title,
                        value,
                        icon,
                        color = 'text-blue-600',
                        description,
                        iconBg = 'bg-blue-500/20',
                        valueColor,
                        customStyle = {}
                    } = stat;

                    return (
                        <Card 
                            key={index}
                            className={getCardClasses()}
                            style={animate ? {
                                animationDelay: `${index * 100}ms`,
                                animationDuration: '0.6s',
                                animationFillMode: 'both',
                                animationName: 'fadeInUp',
                                ...getCardStyle(),
                                ...customStyle
                            } : {
                                ...getCardStyle(),
                                ...customStyle
                            }}
                        >
                            {isMobile && stats.length > 6 ? (
                                // Ultra-compact mobile layout for many cards
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-2">
                                        {icon && (
                                            <div className={`p-1.5 ${iconBg} rounded-md shrink-0`}>
                                                {React.isValidElement(icon) ? (
                                                    React.cloneElement(icon, {
                                                        className: `w-4 h-4 ${color}`,
                                                        ...(icon.props || {})
                                                    })
                                                ) : (
                                                    <div className={`w-4 h-4 ${color}`}>
                                                        {icon}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p 
                                                className="font-medium text-xs leading-tight"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    ...customStyle
                                                }}
                                            >
                                                {title}
                                            </p>
                                            <p 
                                                className="font-bold text-sm leading-tight"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    ...customStyle
                                                }}
                                            >
                                                {value}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            ) : (
                                // Standard layout for desktop/tablet or few cards
                                <>
                                    <CardHeader className={`pb-2 ${isMobile ? 'p-3' : 'p-4'}`}>
                                        <div className="flex items-center gap-2">
                                            {icon && (
                                                <div className={`${isMobile ? 'p-1.5' : 'p-2'} ${iconBg} rounded-lg shrink-0`}>
                                                    {React.isValidElement(icon) ? (
                                                        React.cloneElement(icon, {
                                                            className: `${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${color}`,
                                                            ...(icon.props || {})
                                                        })
                                                    ) : (
                                                        <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${color}`}>
                                                            {icon}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <h6 
                                                className={`font-semibold ${isMobile ? 'text-sm' : 'text-lg'}`}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    ...customStyle
                                                }}
                                            >
                                                {title}
                                            </h6>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardBody className={`pt-0 ${isMobile ? 'p-3' : 'p-4'}`}>
                                        <div 
                                            className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}
                                            style={{
                                                ...(typeof value === 'string' && value.length > 10 ? {
                                                    fontSize: isMobile ? '1rem' : '1.25rem',
                                                    lineHeight: '1.2'
                                                } : {}),
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                ...customStyle
                                            }}
                                        >
                                            {value}
                                        </div>
                                        {description && (
                                            <p 
                                                className={`text-foreground-600 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                {description}
                                            </p>
                                        )}
                                    </CardBody>
                                </>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default StatsCards;
