import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';
import { keyframes } from '@emotion/react';

/**
 * Enhanced Loading System with Improved Performance & UX
 * 
 * Features:
 * - Optimized animations with hardware acceleration
 * - Smart loading delays to prevent flash of loading content
 * - Progressive skeleton loading
 * - Memory-efficient implementation
 * - Consistent design system
 * - Accessibility compliant
 */

// Optimized animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); opacity: 0.6; }
  50% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0.6; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
`;

// Enhanced Loading Spinner with Smart Delays
export const SmartLoadingSpinner = memo(({ 
    size = 40, 
    thickness = 3.5, 
    color = 'primary',
    delay = 150,
    className = '',
    showLabel = true,
    variant = 'indeterminate'
}) => {
    const [shouldShow, setShouldShow] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        timeoutRef.current = setTimeout(() => setShouldShow(true), delay);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [delay]);

    if (!shouldShow) return null;

    return (
        <Box 
            className={`flex flex-col items-center justify-center ${className}`}
            sx={{ 
                animation: `${fadeIn} 0.2s ease-out`,
                willChange: 'transform, opacity'
            }}
        >
            <CircularProgress 
                size={size} 
                thickness={thickness} 
                color={color}
                variant={variant}
                sx={{
                    animation: variant === 'indeterminate' ? `${pulseGlow} 2s ease-in-out infinite` : 'none',
                    willChange: 'transform'
                }}
                role="status"
                aria-label="Loading content"
            />
            {showLabel && (
                <Typography 
                    variant="caption" 
                    className="mt-2 text-gray-600 dark:text-gray-300"
                    component="div"
                    sx={{ animation: `${fadeIn} 0.3s ease-out 0.1s both` }}
                >
                    Loading...
                </Typography>
            )}
        </Box>
    );
});

SmartLoadingSpinner.displayName = 'SmartLoadingSpinner';

// Progressive Skeleton Components
export const ProgressiveSkeleton = memo(({ 
    variant = 'rectangular', 
    width = '100%', 
    height = 20,
    animation = 'wave',
    delay = 0,
    className = ''
}) => {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShouldShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!shouldShow) return <Box sx={{ width, height: variant === 'circular' ? width : height }} />;

    return (
        <Skeleton
            variant={variant}
            width={width}
            height={height}
            animation={animation}
            className={className}
            sx={{
                borderRadius: variant === 'rectangular' ? '6px' : undefined,
                transform: 'scale(1)',
                willChange: 'transform',
                '&::after': {
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                    animation: animation === 'wave' ? `${shimmer} 1.5s ease-in-out infinite` : undefined
                }
            }}
        />
    );
});

ProgressiveSkeleton.displayName = 'ProgressiveSkeleton';

// Enhanced Skeleton Card with Progressive Loading
export const SmartSkeletonCard = memo(({ 
    height = 200, 
    className = '',
    animated = true,
    progressiveDelay = 50,
    showProgress = false
}) => {
    const elements = useMemo(() => [
        { width: '75%', height: 16, delay: 0 },
        { width: '50%', height: 14, delay: progressiveDelay },
        { width: '65%', height: 14, delay: progressiveDelay * 2 },
        { width: '40%', height: 12, delay: progressiveDelay * 3 }
    ], [progressiveDelay]);

    return (
        <Box
            className={`${className} p-6 bg-white/5 backdrop-blur-xs rounded-xl border border-white/10`}
            sx={{ 
                height: `${height}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                overflow: 'hidden'
            }}
            role="status"
            aria-label="Loading content"
        >
            {/* Progress indicator */}
            {showProgress && (
                <Box 
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent)',
                        animation: animated ? `${shimmer} 2s ease-in-out infinite` : 'none'
                    }}
                />
            )}
            
            {elements.map((element, index) => (
                <ProgressiveSkeleton
                    key={index}
                    width={element.width}
                    height={element.height}
                    delay={element.delay}
                    animation={animated ? 'wave' : false}
                />
            ))}
        </Box>
    );
});

SmartSkeletonCard.displayName = 'SmartSkeletonCard';

// Enhanced Skeleton Table with Staggered Animation
export const SmartSkeletonTable = memo(({ 
    rows = 5, 
    columns = 4,
    className = '',
    staggerDelay = 30
}) => {
    return (
        <Box className={`${className} bg-white/5 rounded-xl border border-white/10 overflow-hidden`}>
            {/* Header */}
            <Box className="p-4 border-b border-white/10 bg-white/5">
                <Box className="grid gap-4" sx={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {Array.from({ length: columns }).map((_, i) => (
                        <ProgressiveSkeleton 
                            key={`header-${i}`}
                            height={16}
                            delay={i * 20}
                            variant="rectangular"
                        />
                    ))}
                </Box>
            </Box>
            
            {/* Rows */}
            <Box className="divide-y divide-white/5">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <Box key={`row-${rowIndex}`} className="p-4">
                        <Box className="grid gap-4" sx={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <ProgressiveSkeleton
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    height={14}
                                    delay={(rowIndex * columns + colIndex) * staggerDelay}
                                    variant="rectangular"
                                />
                            ))}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
});

SmartSkeletonTable.displayName = 'SmartSkeletonTable';

// Inline Loader with Smart Timing
export const SmartInlineLoader = memo(({ 
    size = 20, 
    className = '',
    message = 'Loading...',
    delay = 100,
    variant = 'dots'
}) => {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShouldShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!shouldShow) return null;

    return (
        <Box 
            className={`${className} flex items-center gap-3`} 
            role="status"
            sx={{ animation: `${fadeIn} 0.2s ease-out` }}
        >
            {variant === 'spinner' ? (
                <CircularProgress size={size} thickness={4} />
            ) : (
                <Box className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main',
                                animation: `${keyframes`
                                    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                                    40% { transform: scale(1); opacity: 1; }
                                `} 1.4s ease-in-out infinite`,
                                animationDelay: `${i * 0.16}s`
                            }}
                        />
                    ))}
                </Box>
            )}
            <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                {message}
            </Typography>
        </Box>
    );
});

SmartInlineLoader.displayName = 'SmartInlineLoader';

// Page Loader with Progressive Enhancement
export const SmartPageLoader = memo(({ 
    message = 'Loading page...', 
    subtitle = 'Please wait while we prepare your content',
    className = '',
    showProgress = true,
    estimatedTime = 3000
}) => {
    const [progress, setProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(message);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = Math.min(prev + (100 / (estimatedTime / 100)), 95);
                
                // Progressive messages
                if (next > 30 && currentMessage === message) {
                    setCurrentMessage('Preparing components...');
                } else if (next > 60 && currentMessage === 'Preparing components...') {
                    setCurrentMessage('Almost ready...');
                } else if (next > 85 && currentMessage === 'Almost ready...') {
                    setCurrentMessage('Finalizing...');
                }
                
                return next;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [estimatedTime, message, currentMessage]);

    return (
        <Box 
            className={`${className} min-h-screen flex flex-col items-center justify-center p-8`}
            sx={{
                background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(30, 35, 40, 0.9) 100%)',
                backdropFilter: 'blur(20px)'
            }}
            role="status"
            aria-live="polite"
        >
            <Box className="text-center max-w-md">
                <SmartLoadingSpinner size={60} thickness={2} delay={0} showLabel={false} />
                
                <Typography 
                    variant="h5" 
                    className="mt-8 font-semibold text-white"
                    component="h1"
                    sx={{ animation: `${fadeIn} 0.5s ease-out 0.2s both` }}
                >
                    {currentMessage}
                </Typography>
                
                {subtitle && (
                    <Typography 
                        variant="body1" 
                        className="mt-3 text-white/70"
                        component="p"
                        sx={{ animation: `${fadeIn} 0.5s ease-out 0.4s both` }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {showProgress && (
                    <Box 
                        className="mt-6 w-full"
                        sx={{ animation: `${fadeIn} 0.5s ease-out 0.6s both` }}
                    >
                        <Box className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <Box 
                                className="h-full bg-linear-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                                sx={{ 
                                    width: `${progress}%`,
                                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                                }}
                            />
                        </Box>
                        <Typography 
                            variant="caption" 
                            className="text-white/50 mt-2 block"
                        >
                            {Math.round(progress)}%
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
});

SmartPageLoader.displayName = 'SmartPageLoader';

// Loading Overlay with Smart Backdrop
export const SmartLoadingOverlay = memo(({ 
    message = 'Loading...', 
    subtitle = '',
    backdrop = true,
    className = '',
    blur = true
}) => (
    <Box
        className={`${className} fixed inset-0 z-50 flex flex-col items-center justify-center`}
        sx={{
            background: backdrop 
                ? blur 
                    ? 'rgba(15, 20, 25, 0.85)' 
                    : 'rgba(0, 0, 0, 0.75)'
                : 'transparent',
            backdropFilter: blur ? 'blur(12px) saturate(150%)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'backdrop-filter, opacity'
        }}
        role="status"
        aria-live="polite"
        aria-label={message}
    >
        <Box 
            className="text-center p-8 rounded-2xl"
            sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)'
            }}
        >
            <SmartLoadingSpinner size={50} thickness={3} delay={0} />
            
            <Typography 
                variant="h6" 
                className="mt-4 text-white font-medium"
                component="div"
            >
                {message}
            </Typography>
            
            {subtitle && (
                <Typography 
                    variant="body2" 
                    className="mt-2 text-white/70"
                    component="div"
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    </Box>
));

SmartLoadingOverlay.displayName = 'SmartLoadingOverlay';

// Export all components
export {
    SmartLoadingSpinner as LoadingSpinner,
    SmartSkeletonCard as SkeletonCard,
    SmartSkeletonTable as SkeletonTable,
    SmartInlineLoader as InlineLoader,
    SmartPageLoader as PageLoader,
    SmartLoadingOverlay as LoadingOverlay
};

export default SmartLoadingSpinner;
