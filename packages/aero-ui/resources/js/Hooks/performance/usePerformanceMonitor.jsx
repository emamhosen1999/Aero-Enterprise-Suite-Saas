import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enhanced Performance Monitoring Hook for Lazy Loading
 * 
 * Features:
 * - Component load time tracking
 * - Memory usage monitoring
 * - Route transition performance
 * - Lazy loading optimization metrics
 * - Real-time performance alerts
 */

export const usePerformanceMonitor = (componentName, options = {}) => {
    const [metrics, setMetrics] = useState({
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        renderCount: 0,
        lastUpdate: null
    });

    const [isLoading, setIsLoading] = useState(false);
    const [performanceScore, setPerformanceScore] = useState(100);
    
    const loadStartTime = useRef(null);
    const renderStartTime = useRef(null);
    const mountTime = useRef(null);
    const renderCountRef = useRef(0);

    const {
        trackRender = true,
        trackLoad = true,
        trackMemory = true,
        alertThreshold = 1000, // ms
        enableLogging = process.env.NODE_ENV === 'development',
        reportInterval = 30000 // 30 seconds
    } = options;

    // Start load tracking
    const startLoadTracking = useCallback(() => {
        if (trackLoad) {
            loadStartTime.current = performance.now();
            setIsLoading(true);
        }
    }, [trackLoad]);

    // Stop load tracking
    const stopLoadTracking = useCallback(() => {
        if (trackLoad && loadStartTime.current) {
            const loadTime = performance.now() - loadStartTime.current;
            setMetrics(prev => ({
                ...prev,
                loadTime,
                lastUpdate: new Date()
            }));
            
            if (enableLogging && loadTime > alertThreshold) {
                console.warn(`${componentName}: Slow load detected - ${loadTime.toFixed(2)}ms`);
            }
            
            setIsLoading(false);
            loadStartTime.current = null;
        }
    }, [trackLoad, componentName, enableLogging, alertThreshold]);

    // Track render performance
    const trackRenderPerformance = useCallback(() => {
        if (!trackRender) return;

        renderCountRef.current++;
        renderStartTime.current = performance.now();

        // Use requestAnimationFrame to measure actual render time
        requestAnimationFrame(() => {
            if (renderStartTime.current) {
                const renderTime = performance.now() - renderStartTime.current;
                setMetrics(prev => ({
                    ...prev,
                    renderTime,
                    renderCount: renderCountRef.current,
                    lastUpdate: new Date()
                }));

                if (enableLogging && renderTime > 16.67) { // 60fps threshold
                    console.warn(`${componentName}: Frame drop detected - ${renderTime.toFixed(2)}ms`);
                }
            }
        });
    }, [trackRender, componentName, enableLogging]);

    // Track memory usage
    const trackMemoryUsage = useCallback(() => {
        if (trackMemory && 'memory' in performance) {
            const memory = performance.memory;
            const memoryUsage = memory.usedJSHeapSize / 1048576; // Convert to MB
            
            setMetrics(prev => ({
                ...prev,
                memoryUsage,
                lastUpdate: new Date()
            }));

            // Alert on high memory usage
            if (enableLogging && memoryUsage > 100) { // 100MB threshold
                console.warn(`${componentName}: High memory usage - ${memoryUsage.toFixed(2)}MB`);
            }
        }
    }, [trackMemory, componentName, enableLogging]);

    // Calculate performance score
    const calculatePerformanceScore = useCallback(() => {
        const { loadTime, renderTime, memoryUsage } = metrics;
        let score = 100;

        // Deduct points for slow loading
        if (loadTime > 1000) score -= 20;
        else if (loadTime > 500) score -= 10;

        // Deduct points for slow rendering
        if (renderTime > 50) score -= 15;
        else if (renderTime > 16.67) score -= 5;

        // Deduct points for high memory usage
        if (memoryUsage > 150) score -= 25;
        else if (memoryUsage > 100) score -= 10;

        setPerformanceScore(Math.max(0, score));
    }, [metrics]);

    // Track custom metrics
    const trackCustomMetric = useCallback((metricName, value) => {
        setMetrics(prev => ({
            ...prev,
            [metricName]: value,
            lastUpdate: new Date()
        }));

        if (enableLogging) {
            console.log(`${componentName} - ${metricName}: ${value}`);
        }
    }, [componentName, enableLogging]);

    // Initialize tracking on mount
    useEffect(() => {
        mountTime.current = performance.now();
        
        if (trackRender) {
            trackRenderPerformance();
        }

        if (trackMemory) {
            trackMemoryUsage();
        }

        return () => {
            // Cleanup on unmount
            if (mountTime.current) {
                const totalLifetime = performance.now() - mountTime.current;
                if (enableLogging) {
                    console.log(`${componentName}: Component lifetime - ${totalLifetime.toFixed(2)}ms`);
                }
            }
        };
    }, [trackRender, trackMemory, trackRenderPerformance, trackMemoryUsage, componentName, enableLogging]);

    // Periodic performance reporting
    useEffect(() => {
        if (!enableLogging) return;

        const interval = setInterval(() => {
            if (metrics.lastUpdate) {
                console.group(`${componentName} Performance Report`);
                console.log('Load Time:', `${metrics.loadTime.toFixed(2)}ms`);
                console.log('Render Time:', `${metrics.renderTime.toFixed(2)}ms`);
                console.log('Memory Usage:', `${metrics.memoryUsage.toFixed(2)}MB`);
                console.log('Render Count:', metrics.renderCount);
                console.log('Performance Score:', `${performanceScore}/100`);
                console.groupEnd();
            }
        }, reportInterval);

        return () => clearInterval(interval);
    }, [componentName, metrics, performanceScore, enableLogging, reportInterval]);

    // Calculate performance score when metrics change
    useEffect(() => {
        calculatePerformanceScore();
    }, [calculatePerformanceScore]);

    // Performance optimization suggestions
    const getOptimizationSuggestions = useCallback(() => {
        const suggestions = [];

        if (metrics.loadTime > 1000) {
            suggestions.push('Consider code splitting or reducing bundle size');
        }

        if (metrics.renderTime > 16.67) {
            suggestions.push('Optimize render performance with React.memo or useMemo');
        }

        if (metrics.memoryUsage > 100) {
            suggestions.push('Check for memory leaks or unnecessary data retention');
        }

        if (metrics.renderCount > 10) {
            suggestions.push('Reduce unnecessary re-renders with useCallback/useMemo');
        }

        return suggestions;
    }, [metrics]);

    return {
        metrics,
        isLoading,
        performanceScore,
        startLoadTracking,
        stopLoadTracking,
        trackRenderPerformance,
        trackMemoryUsage,
        trackCustomMetric,
        optimizationSuggestions: getOptimizationSuggestions()
    };
};

/**
 * Hook for monitoring route transitions performance
 */
export const useRoutePerformanceMonitor = () => {
    const [routeMetrics, setRouteMetrics] = useState({
        currentRoute: '',
        loadTime: 0,
        transitionTime: 0,
        routeHistory: []
    });

    const routeStartTime = useRef(null);
    const transitionStartTime = useRef(null);

    const startRouteTransition = useCallback((route) => {
        routeStartTime.current = performance.now();
        transitionStartTime.current = performance.now();
        
        setRouteMetrics(prev => ({
            ...prev,
            currentRoute: route
        }));
    }, []);

    const endRouteTransition = useCallback(() => {
        if (routeStartTime.current && transitionStartTime.current) {
            const loadTime = performance.now() - routeStartTime.current;
            const transitionTime = performance.now() - transitionStartTime.current;
            
            setRouteMetrics(prev => ({
                ...prev,
                loadTime,
                transitionTime,
                routeHistory: [
                    ...prev.routeHistory.slice(-9), // Keep last 10 routes
                    {
                        route: prev.currentRoute,
                        loadTime,
                        transitionTime,
                        timestamp: new Date()
                    }
                ]
            }));

            // Log slow route transitions
            if (loadTime > 1000) {
                console.warn(`Slow route transition: ${prev.currentRoute} - ${loadTime.toFixed(2)}ms`);
            }

            routeStartTime.current = null;
            transitionStartTime.current = null;
        }
    }, []);

    const getAverageLoadTime = useCallback(() => {
        if (routeMetrics.routeHistory.length === 0) return 0;
        
        const total = routeMetrics.routeHistory.reduce((sum, route) => sum + route.loadTime, 0);
        return total / routeMetrics.routeHistory.length;
    }, [routeMetrics.routeHistory]);

    const getSlowestRoutes = useCallback(() => {
        return routeMetrics.routeHistory
            .sort((a, b) => b.loadTime - a.loadTime)
            .slice(0, 3);
    }, [routeMetrics.routeHistory]);

    return {
        routeMetrics,
        startRouteTransition,
        endRouteTransition,
        averageLoadTime: getAverageLoadTime(),
        slowestRoutes: getSlowestRoutes()
    };
};

/**
 * Hook for monitoring lazy loading performance
 */
export const useLazyLoadingMonitor = () => {
    const [lazyMetrics, setLazyMetrics] = useState({
        componentsLoaded: 0,
        totalLoadTime: 0,
        averageLoadTime: 0,
        failedLoads: 0,
        cacheHits: 0,
        cacheMisses: 0
    });

    const recordComponentLoad = useCallback((componentName, loadTime, fromCache = false) => {
        setLazyMetrics(prev => {
            const newComponentsLoaded = prev.componentsLoaded + 1;
            const newTotalLoadTime = prev.totalLoadTime + loadTime;
            
            return {
                ...prev,
                componentsLoaded: newComponentsLoaded,
                totalLoadTime: newTotalLoadTime,
                averageLoadTime: newTotalLoadTime / newComponentsLoaded,
                cacheHits: fromCache ? prev.cacheHits + 1 : prev.cacheHits,
                cacheMisses: fromCache ? prev.cacheMisses : prev.cacheMisses + 1
            };
        });

        // Log slow component loads
        if (loadTime > 500) {
            console.warn(`Slow lazy component load: ${componentName} - ${loadTime.toFixed(2)}ms`);
        }
    }, []);

    const recordFailedLoad = useCallback((componentName, error) => {
        setLazyMetrics(prev => ({
            ...prev,
            failedLoads: prev.failedLoads + 1
        }));

        console.error(`Failed to load lazy component: ${componentName}`, error);
    }, []);

    const getCacheEfficiency = useCallback(() => {
        const total = lazyMetrics.cacheHits + lazyMetrics.cacheMisses;
        return total === 0 ? 0 : (lazyMetrics.cacheHits / total) * 100;
    }, [lazyMetrics.cacheHits, lazyMetrics.cacheMisses]);

    return {
        lazyMetrics,
        recordComponentLoad,
        recordFailedLoad,
        cacheEfficiency: getCacheEfficiency()
    };
};

export default {
    usePerformanceMonitor,
    useRoutePerformanceMonitor,
    useLazyLoadingMonitor
};
