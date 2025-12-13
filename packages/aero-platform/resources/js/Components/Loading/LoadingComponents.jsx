import React from 'react';
import { Spinner } from '@heroui/react';

/**
 * Enhanced Loading Component with Better UX
 * 
 * Features:
 * - Consistent loading states across the app
 * - Smooth animations
 * - Accessibility support
 * - Multiple variants for different contexts
 * - Performance optimized
 */

const LoadingSpinner = React.memo(({ 
    size = 'lg', 
    color = 'primary',
    className = '' 
}) => (
    <Spinner 
        size={size} 
        color={color}
        className={className}
        role="status"
        aria-label="Loading"
    />
));

LoadingSpinner.displayName = 'LoadingSpinner';

const LoadingOverlay = React.memo(({ 
    message = 'Loading...', 
    subtitle = '',
    backdrop = true,
    className = ''
}) => (
    <div
        className={`${className} fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-300`}
        style={{
            background: backdrop 
                ? 'linear-gradient(135deg, rgba(15, 20, 25, 0.9) 0%, rgba(20, 25, 30, 0.8) 100%)' 
                : 'transparent',
            backdropFilter: backdrop ? 'blur(8px)' : 'none',
        }}
        role="status"
        aria-live="polite"
        aria-label={message}
    >
        <div className="text-center">
            <LoadingSpinner size="xl" />
            
            <h2 className="mt-4 text-xl font-medium text-white">
                {message}
            </h2>
            
            {subtitle && (
                <p className="mt-2 text-sm text-white/70">
                    {subtitle}
                </p>
            )}
        </div>
    </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

const SkeletonCard = React.memo(({ 
    height = 200, 
    className = '',
    animated = true 
}) => (
    <div
        className={`${className} bg-default-100 dark:bg-default-50 rounded-xl border border-divider`}
        style={{ 
            height: `${height}px`,
            animation: animated ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
        }}
        role="status"
        aria-label="Loading content"
    >
        <div className="p-6 space-y-4">
            <div className="h-4 bg-default-200 rounded-sm w-3/4"></div>
            <div className="h-4 bg-default-200 rounded-sm w-1/2"></div>
            <div className="h-4 bg-default-200 rounded-sm w-2/3"></div>
        </div>
    </div>
));

SkeletonCard.displayName = 'SkeletonCard';

const SkeletonTable = React.memo(({ 
    rows = 5, 
    columns = 4,
    className = '' 
}) => (
    <div className={`${className} bg-default-100 dark:bg-default-50 rounded-xl border border-divider overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-divider">
            <div className={`grid gap-4 grid-cols-${columns}`}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div 
                        key={i} 
                        className="h-4 bg-default-200 rounded-sm animate-pulse" 
                    />
                ))}
            </div>
        </div>
        
        {/* Rows */}
        <div className="divide-y divide-divider">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="p-4">
                    <div className={`grid gap-4 grid-cols-${columns}`}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div 
                                key={colIndex} 
                                className="h-3 bg-default-200 rounded-sm animate-pulse"
                                style={{ 
                                    animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
));

SkeletonTable.displayName = 'SkeletonTable';

const InlineLoader = React.memo(({ 
    size = 'sm', 
    className = '',
    message = 'Loading...' 
}) => (
    <div className={`${className} flex items-center gap-2`} role="status">
        <LoadingSpinner size={size} />
        <span className="text-sm text-foreground-600">
            {message}
        </span>
    </div>
));

InlineLoader.displayName = 'InlineLoader';

const PageLoader = React.memo(({ 
    message = 'Loading page...', 
    subtitle = 'Please wait while we prepare your content',
    className = '' 
}) => (
    <div 
        className={`${className} min-h-screen flex flex-col items-center justify-center p-8`}
        role="status"
        aria-live="polite"
    >
        <div className="text-center max-w-md">
            <LoadingSpinner size="xl" />
            
            <h1 className="mt-6 text-2xl font-semibold text-foreground">
                {message}
            </h1>
            
            {subtitle && (
                <p className="mt-3 text-base text-foreground-600">
                    {subtitle}
                </p>
            )}
        </div>
    </div>
));

PageLoader.displayName = 'PageLoader';

// CSS animations for better performance
const loadingStyles = `
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.shimmer-effect {
  position: relative;
  overflow: hidden;
}

.shimmer-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 1.5s infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = loadingStyles;
    document.head.appendChild(styleSheet);
}

export {
    LoadingSpinner,
    LoadingOverlay,
    SkeletonCard,
    SkeletonTable,
    InlineLoader,
    PageLoader
};

export default LoadingSpinner;
