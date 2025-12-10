import React, { lazy, Suspense, memo, useEffect, useState, useRef } from 'react';
import { SmartLayoutFallback } from './LayoutFallbacks';

/**
 * Enhanced Lazy Loading System with Intelligent Preloading
 * 
 * Features:
 * - Intelligent component preloading
 * - Smart caching strategies
 * - Performance monitoring
 * - Error boundaries integration
 * - Progressive loading states
 */

// Preloading cache to store loaded components
const componentCache = new Map();
const preloadQueue = new Set();
const loadingPromises = new Map();

// Enhanced lazy wrapper with preloading capabilities
export function createLazyComponent(importFunction, options = {}) {
    const {
        fallback = <SmartLayoutFallback />,
        preload = false,
        retryCount = 3,
        retryDelay = 1000,
        timeout = 10000
    } = options;

    // Create a retry-enabled import function
    const retryImport = async (retries = retryCount) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const modulePromise = importFunction();
            const result = await Promise.race([
                modulePromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Component load timeout')), timeout)
                )
            ]);
            
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            if (retries > 0) {
                console.warn(`Component load failed, retrying... (${retryCount - retries + 1}/${retryCount})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return retryImport(retries - 1);
            }
            throw error;
        }
    };

    const LazyComponent = lazy(retryImport);

    // Preload function
    LazyComponent.preload = () => {
        if (!loadingPromises.has(importFunction)) {
            const promise = retryImport().catch(error => {
                console.error('Preload failed:', error);
                loadingPromises.delete(importFunction);
            });
            loadingPromises.set(importFunction, promise);
        }
        return loadingPromises.get(importFunction);
    };

    // Auto-preload if requested
    if (preload) {
        LazyComponent.preload();
    }

    return LazyComponent;
}

// Intelligent preloader hook
export function useComponentPreloader() {
    const preloadedComponents = useRef(new Set());

    const preloadComponent = async (lazyComponent) => {
        if (lazyComponent.preload && !preloadedComponents.current.has(lazyComponent)) {
            preloadedComponents.current.add(lazyComponent);
            try {
                await lazyComponent.preload();
            } catch (error) {
                console.warn('Component preload failed:', error);
                preloadedComponents.current.delete(lazyComponent);
            }
        }
    };

    const preloadRoutes = async (routeComponents) => {
        const preloadPromises = routeComponents
            .filter(component => component.preload)
            .map(component => preloadComponent(component));
        
        try {
            await Promise.allSettled(preloadPromises);
        } catch (error) {
            console.warn('Route preloading failed:', error);
        }
    };

    return { preloadComponent, preloadRoutes };
}

// Enhanced Suspense wrapper with smart fallbacks
export const SmartSuspense = memo(({ 
    children, 
    fallback, 
    type = 'default',
    variant = 'page',
    showDelay = true,
    minDisplayTime = 500
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [showFallback, setShowFallback] = useState(!showDelay);
    const mountTime = useRef(Date.now());

    useEffect(() => {
        if (showDelay) {
            const timer = setTimeout(() => setShowFallback(true), 150);
            return () => clearTimeout(timer);
        }
    }, [showDelay]);

    useEffect(() => {
        // Ensure minimum display time for better UX
        const handleLoadComplete = () => {
            const elapsedTime = Date.now() - mountTime.current;
            if (elapsedTime < minDisplayTime) {
                setTimeout(() => setIsLoading(false), minDisplayTime - elapsedTime);
            } else {
                setIsLoading(false);
            }
        };

        // Listen for component load completion
        const timer = setTimeout(handleLoadComplete, 100);
        return () => clearTimeout(timer);
    }, [minDisplayTime]);

    const defaultFallback = fallback || <SmartLayoutFallback type={type} variant={variant} />;

    return (
        <Suspense fallback={showFallback ? defaultFallback : null}>
            {children}
        </Suspense>
    );
});

SmartSuspense.displayName = 'SmartSuspense';

// Preload on hover/focus component
export const PreloadTrigger = memo(({ 
    component, 
    trigger = 'hover', 
    delay = 100, 
    children 
}) => {
    const timeoutRef = useRef(null);
    const preloadedRef = useRef(false);

    const handlePreload = () => {
        if (component.preload && !preloadedRef.current) {
            timeoutRef.current = setTimeout(() => {
                component.preload();
                preloadedRef.current = true;
            }, delay);
        }
    };

    const handleCancel = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const triggerProps = {
        ...(trigger === 'hover' && {
            onMouseEnter: handlePreload,
            onMouseLeave: handleCancel
        }),
        ...(trigger === 'focus' && {
            onFocus: handlePreload,
            onBlur: handleCancel
        }),
        ...(trigger === 'immediate' && {
            ref: (el) => {
                if (el && !preloadedRef.current) {
                    handlePreload();
                }
            }
        })
    };

    return React.cloneElement(children, triggerProps);
});

PreloadTrigger.displayName = 'PreloadTrigger';

// Route-based preloader
export const RoutePreloader = memo(({ currentRoute, routeMap }) => {
    const { preloadRoutes } = useComponentPreloader();

    useEffect(() => {
        // Preload likely next routes based on current route
        const likelyRoutes = routeMap[currentRoute] || [];
        if (likelyRoutes.length > 0) {
            preloadRoutes(likelyRoutes);
        }
    }, [currentRoute, routeMap, preloadRoutes]);

    return null;
});

RoutePreloader.displayName = 'RoutePreloader';

// Performance monitor for lazy loading
export const LazyLoadingMonitor = memo(() => {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'measure' && entry.name.includes('lazy')) {
                        console.log(`Lazy loading: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });

            observer.observe({ entryTypes: ['measure'] });

            return () => observer.disconnect();
        }
    }, []);

    return null;
});

LazyLoadingMonitor.displayName = 'LazyLoadingMonitor';

// Component priority loader
export class ComponentPriorityLoader {
    constructor() {
        this.priorities = new Map();
        this.loadQueue = [];
        this.isProcessing = false;
    }

    setPriority(component, priority) {
        this.priorities.set(component, priority);
    }

    queueLoad(component, callback) {
        const priority = this.priorities.get(component) || 0;
        this.loadQueue.push({ component, callback, priority });
        this.loadQueue.sort((a, b) => b.priority - a.priority);
        
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    async processQueue() {
        this.isProcessing = true;
        
        while (this.loadQueue.length > 0) {
            const { component, callback } = this.loadQueue.shift();
            
            try {
                if (component.preload) {
                    await component.preload();
                }
                callback?.(null);
            } catch (error) {
                callback?.(error);
            }
            
            // Small delay to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.isProcessing = false;
    }
}

// Global priority loader instance
export const globalPriorityLoader = new ComponentPriorityLoader();

// High-level API for creating optimized lazy components
export const createOptimizedLazyComponent = (importFunction, config = {}) => {
    const {
        priority = 0,
        preloadStrategy = 'none', // 'none', 'hover', 'immediate', 'route-based'
        fallbackType = 'default',
        fallbackVariant = 'page',
        ...options
    } = config;

    const LazyComponent = createLazyComponent(importFunction, options);
    
    // Set priority
    globalPriorityLoader.setPriority(LazyComponent, priority);

    // Configure preload strategy
    if (preloadStrategy === 'immediate') {
        LazyComponent.preload();
    }

    // Return enhanced component
    const EnhancedComponent = memo((props) => (
        <SmartSuspense type={fallbackType} variant={fallbackVariant}>
            <LazyComponent {...props} />
        </SmartSuspense>
    ));

    EnhancedComponent.preload = LazyComponent.preload;
    EnhancedComponent.displayName = `OptimizedLazy(${LazyComponent.displayName || 'Component'})`;

    return EnhancedComponent;
};

export default {
    createLazyComponent,
    createOptimizedLazyComponent,
    SmartSuspense,
    PreloadTrigger,
    RoutePreloader,
    useComponentPreloader,
    globalPriorityLoader
};
