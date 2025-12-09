import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance Monitoring Hook
 * 
 * Features:
 * - Component render tracking
 * - Memory usage monitoring
 * - Performance metrics collection
 * - Optimized for production use
 * - Throttled logging to prevent spam
 */

export const usePerformanceMonitor = (componentName = 'Unknown', options = {}) => {
    const {
        enableInProduction = false,
        logInterval = 10, // Log every 10th render
        memoryThreshold = 50, // MB
        renderTimeThreshold = 16, // ms (60fps = 16.67ms per frame)
    } = options;

    const renderCount = useRef(0);
    const lastRenderTime = useRef(0);
    const renderTimes = useRef([]);
    const lastMemoryCheck = useRef(0);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const shouldMonitor = isDevelopment || enableInProduction;

    const logPerformanceData = useCallback((data) => {
        if (!shouldMonitor) return;

        console.group(`🔍 Performance: ${componentName}`);
        console.log('📊 Metrics:', data);
        
        if (data.averageRenderTime > renderTimeThreshold) {
            console.warn(`⚠️ Slow render detected: ${data.averageRenderTime.toFixed(2)}ms`);
        }
        
        if (data.memoryUsage && data.memoryUsage > memoryThreshold) {
            console.warn(`🧠 High memory usage: ${data.memoryUsage}MB`);
        }
        
        console.groupEnd();
    }, [componentName, shouldMonitor, renderTimeThreshold, memoryThreshold]);

    const trackRender = useCallback(() => {
        if (!shouldMonitor) return;

        const now = performance.now();
        const renderTime = now - lastRenderTime.current;
        
        renderCount.current++;
        lastRenderTime.current = now;
        
        // Track render times (keep last 10)
        renderTimes.current.push(renderTime);
        if (renderTimes.current.length > 10) {
            renderTimes.current.shift();
        }

        // Log performance data every N renders
        if (renderCount.current % logInterval === 0) {
            const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
            
            let memoryUsage = null;
            if (performance.memory && (now - lastMemoryCheck.current) > 5000) { // Check memory every 5s
                memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576); // Convert to MB
                lastMemoryCheck.current = now;
            }

            logPerformanceData({
                renderCount: renderCount.current,
                averageRenderTime,
                lastRenderTime: renderTime,
                memoryUsage,
                timestamp: new Date().toISOString()
            });
        }
    }, [shouldMonitor, logInterval, logPerformanceData]);

    // Track component mount/unmount
    useEffect(() => {
        if (!shouldMonitor) return;

        const startTime = performance.now();
        lastRenderTime.current = startTime;

        return () => {
            const unmountTime = performance.now();
            const componentLifetime = unmountTime - startTime;
            
            console.log(`🔄 ${componentName} unmounted after ${componentLifetime.toFixed(2)}ms, ${renderCount.current} renders`);
        };
    }, [componentName, shouldMonitor]);

    // Track each render
    useEffect(() => {
        trackRender();
    });

    return {
        renderCount: renderCount.current,
        trackCustomMetric: useCallback((metricName, value) => {
            if (!shouldMonitor) return;
            console.log(`📈 Custom Metric [${componentName}] ${metricName}:`, value);
        }, [componentName, shouldMonitor])
    };
};

/**
 * Page Load Performance Hook
 */
export const usePageLoadPerformance = (pageName) => {
    const pageLoadStart = useRef(performance.now());
    const metricsLogged = useRef(false);

    useEffect(() => {
        if (metricsLogged.current) return;

        const logPageMetrics = () => {
            const loadTime = performance.now() - pageLoadStart.current;
            
            // Get navigation timing if available
            const navTiming = performance.getEntriesByType('navigation')[0];
            
            const metrics = {
                pageName,
                pageLoadTime: loadTime,
                domContentLoaded: navTiming?.domContentLoadedEventEnd - navTiming?.domContentLoadedEventStart,
                resourceLoadTime: navTiming?.loadEventEnd - navTiming?.loadEventStart,
                timestamp: new Date().toISOString()
            };

            console.group(`📄 Page Load Performance: ${pageName}`);
            console.log('⏱️ Metrics:', metrics);
            
            if (loadTime > 3000) {
                console.warn(`🐌 Slow page load: ${loadTime.toFixed(2)}ms`);
            }
            
            console.groupEnd();

            metricsLogged.current = true;
        };

        // Log metrics after a short delay to ensure page is fully loaded
        const timer = setTimeout(logPageMetrics, 100);
        
        return () => clearTimeout(timer);
    }, [pageName]);

    return {
        pageLoadTime: performance.now() - pageLoadStart.current
    };
};

/**
 * Memory Monitoring Hook
 */
export const useMemoryMonitor = (options = {}) => {
    const {
        interval = 30000, // Check every 30 seconds
        threshold = 100, // MB
        enabled = process.env.NODE_ENV === 'development'
    } = options;

    const lastCheck = useRef(0);

    useEffect(() => {
        if (!enabled || !performance.memory) return;

        const checkMemory = () => {
            const now = Date.now();
            if (now - lastCheck.current < interval) return;

            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

            lastCheck.current = now;

            if (usedMB > threshold) {
                console.warn(`🧠 Memory Warning: ${usedMB}MB used (${totalMB}MB total, ${limitMB}MB limit)`);
            }

            // Trigger garbage collection in development if memory usage is high
            if (process.env.NODE_ENV === 'development' && usedMB > threshold * 1.5 && window.gc) {
                console.log('🗑️ Triggering garbage collection...');
                window.gc();
            }
        };

        // Initial check
        checkMemory();

        // Set up interval
        const intervalId = setInterval(checkMemory, interval);

        return () => clearInterval(intervalId);
    }, [interval, threshold, enabled]);
};

/**
 * Network Performance Hook
 */
export const useNetworkMonitor = () => {
    const requestTimes = useRef(new Map());

    const trackRequest = useCallback((url, startTime) => {
        requestTimes.current.set(url, startTime);
    }, []);

    const trackResponse = useCallback((url) => {
        const startTime = requestTimes.current.get(url);
        if (startTime) {
            const responseTime = performance.now() - startTime;
            requestTimes.current.delete(url);

            if (responseTime > 2000) {
                console.warn(`🌐 Slow network request: ${url} took ${responseTime.toFixed(2)}ms`);
            }

            return responseTime;
        }
        return null;
    }, []);

    return { trackRequest, trackResponse };
};

/**
 * Bundle Size Performance Hook
 */
export const useBundleMonitor = () => {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const logBundleInfo = () => {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

            console.group('📦 Bundle Analysis');
            console.log('📜 Scripts:', scripts.length);
            console.log('🎨 Stylesheets:', stylesheets.length);

            scripts.forEach(script => {
                if (script.src.includes('app.') || script.src.includes('vendor.')) {
                    console.log(`  - ${script.src.split('/').pop()}`);
                }
            });

            console.groupEnd();
        };

        // Log after page load
        if (document.readyState === 'complete') {
            logBundleInfo();
        } else {
            window.addEventListener('load', logBundleInfo, { once: true });
        }
    }, []);
};

export default usePerformanceMonitor;
