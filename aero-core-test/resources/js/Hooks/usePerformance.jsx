// filepath: d:\Laravel Projects\glassERP\resources\js\hooks/usePerformance.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import webVitalsMonitor, { measureFeatureLoad, measureComponentRender } from '../utils/webVitals';

/**
 * Glass ERP Performance Hook
 * Custom React hook for component-level performance monitoring
 * 
 * Features:
 * - Component render time measurement
 * - Feature load time tracking
 * - Performance state management
 * - Real-time metrics access
 * - Optimization recommendations
 */

export const usePerformance = (componentName, options = {}) => {
    const [metrics, setMetrics] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [performanceScore, setPerformanceScore] = useState(0);
    const renderStartTime = useRef(null);
    const mountTime = useRef(null);

    const {
        trackRender = true,
        trackLoad = true,
        alertThreshold = 1000,
        enableLogging = process.env.NODE_ENV === 'development'
    } = options;

    // Initialize performance tracking on mount
    useEffect(() => {
        mountTime.current = performance.now();
        
        if (trackRender) {
            renderStartTime.current = performance.now();
        }

        // Get initial metrics
        setMetrics(webVitalsMonitor.getCurrentMetrics());
        
        // Subscribe to real-time updates
        const handleMetricsUpdate = (event) => {
            const { metricName, metric, rating } = event.detail;
            
            setMetrics(prev => ({
                ...prev,
                [metricName]: { ...metric, rating }
            }));

            // Update performance score
            updatePerformanceScore();
        };

        window.addEventListener('webVitalsUpdate', handleMetricsUpdate);

        if (enableLogging) {
            console.log(`🎯 Performance tracking initialized for: ${componentName}`);
        }

        return () => {
            window.removeEventListener('webVitalsUpdate', handleMetricsUpdate);
            
            if (mountTime.current) {
                const totalTime = performance.now() - mountTime.current;
                if (enableLogging) {
                    console.log(`📊 Component Lifecycle - ${componentName}: ${totalTime.toFixed(2)}ms`);
                }
            }
        };
    }, [componentName, enableLogging]);

    // Track render completion
    useEffect(() => {
        if (trackRender && renderStartTime.current) {
            const renderTime = performance.now() - renderStartTime.current;
            
            if (enableLogging) {
                console.log(`🎨 Render Time - ${componentName}: ${renderTime.toFixed(2)}ms`);
            }

            if (renderTime > alertThreshold) {
                console.warn(`🐌 Slow render detected - ${componentName}: ${renderTime.toFixed(2)}ms`);
            }

            renderStartTime.current = null;
        }
    });

    // Calculate performance score
    const updatePerformanceScore = useCallback(() => {
        const coreMetrics = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'];
        let totalScore = 0;
        let validMetrics = 0;

        coreMetrics.forEach(metricName => {
            const metric = metrics[metricName];
            if (metric) {
                validMetrics++;
                switch (metric.rating) {
                    case 'good': totalScore += 100; break;
                    case 'needs-improvement': totalScore += 50; break;
                    case 'poor': totalScore += 0; break;
                }
            }
        });

        const score = validMetrics > 0 ? Math.round(totalScore / validMetrics) : 0;
        setPerformanceScore(score);
        
        return score;
    }, [metrics]);

    // Measure feature load time
    const measureFeature = useCallback((featureName) => {
        if (!trackLoad) return () => {};

        const startTime = performance.now();
        setIsLoading(true);

        return () => {
            const loadTime = measureFeatureLoad(featureName, startTime);
            setIsLoading(false);
            
            return loadTime;
        };
    }, [trackLoad]);

    // Measure async operation
    const measureAsync = useCallback(async (operationName, asyncFunction) => {
        const startTime = performance.now();
        setIsLoading(true);

        try {
            const result = await asyncFunction();
            const duration = performance.now() - startTime;
            
            if (enableLogging) {
                console.log(`⚡ Async Operation - ${operationName}: ${duration.toFixed(2)}ms`);
            }

            if (duration > alertThreshold) {
                console.warn(`🐌 Slow async operation - ${operationName}: ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            if (enableLogging) {
                console.error(`❌ Async Operation Failed - ${operationName}:`, error);
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [enableLogging, alertThreshold]);

    // Get performance status
    const getPerformanceStatus = useCallback(() => {
        const score = performanceScore;
        
        if (score >= 90) return { status: 'excellent', color: 'green' };
        if (score >= 70) return { status: 'good', color: 'blue' };
        if (score >= 50) return { status: 'needs-improvement', color: 'yellow' };
        return { status: 'poor', color: 'red' };
    }, [performanceScore]);

    // Get optimization suggestions
    const getOptimizationSuggestions = useCallback(() => {
        const suggestions = [];
        
        Object.entries(metrics).forEach(([metricName, metric]) => {
            if (metric.rating === 'poor') {
                switch (metricName) {
                    case 'FCP':
                        suggestions.push({
                            metric: metricName,
                            suggestion: 'Consider code splitting and lazy loading',
                            priority: 'high'
                        });
                        break;
                    case 'LCP':
                        suggestions.push({
                            metric: metricName,
                            suggestion: 'Optimize images and critical resources',
                            priority: 'high'
                        });
                        break;
                    case 'FID':
                        suggestions.push({
                            metric: metricName,
                            suggestion: 'Reduce JavaScript execution time',
                            priority: 'medium'
                        });
                        break;
                    case 'CLS':
                        suggestions.push({
                            metric: metricName,
                            suggestion: 'Set explicit dimensions for dynamic content',
                            priority: 'medium'
                        });
                        break;
                    case 'TTFB':
                        suggestions.push({
                            metric: metricName,
                            suggestion: 'Optimize server response time',
                            priority: 'high'
                        });
                        break;
                }
            }
        });

        return suggestions;
    }, [metrics]);

    // Mark important user interactions
    const markUserInteraction = useCallback((interactionName) => {
        if ('performance' in window) {
            performance.mark(`user-interaction-${interactionName}-start`);
            
            return () => {
                performance.mark(`user-interaction-${interactionName}-end`);
                performance.measure(
                    `user-interaction-${interactionName}`,
                    `user-interaction-${interactionName}-start`,
                    `user-interaction-${interactionName}-end`
                );

                if (enableLogging) {
                    const measures = performance.getEntriesByName(`user-interaction-${interactionName}`);
                    if (measures.length > 0) {
                        console.log(`👆 User Interaction - ${interactionName}: ${measures[0].duration.toFixed(2)}ms`);
                    }
                }
            };
        }
        
        return () => {};
    }, [enableLogging]);

    // Get current page performance
    const getPagePerformance = useCallback(() => {
        const navigation = metrics.navigation;
        
        if (!navigation) return null;

        return {
            dns: navigation.timings?.dns || 0,
            connection: navigation.timings?.connection || 0,
            request: navigation.timings?.request || 0,
            response: navigation.timings?.response || 0,
            domProcessing: navigation.timings?.domProcessing || 0,
            domComplete: navigation.timings?.domComplete || 0,
            pageLoad: navigation.timings?.pageLoad || 0,
            total: Object.values(navigation.timings || {}).reduce((sum, time) => sum + time, 0)
        };
    }, [metrics]);

    return {
        // Metrics
        metrics,
        performanceScore,
        isLoading,
        
        // Actions
        measureFeature,
        measureAsync,
        markUserInteraction,
        
        // Analysis
        getPerformanceStatus,
        getOptimizationSuggestions,
        getPagePerformance,
        
        // Utilities
        updatePerformanceScore
    };
};

// Higher-order component for automatic performance tracking
export const withPerformanceTracking = (WrappedComponent, componentName) => {
    return React.forwardRef((props, ref) => {
        const performance = usePerformance(componentName || WrappedComponent.name);
        
        return (
            <WrappedComponent
                {...props}
                ref={ref}
                performance={performance}
            />
        );
    });
};

// Performance context for component trees
export const PerformanceContext = React.createContext({});

export const PerformanceProvider = ({ children, trackingOptions = {} }) => {
    const [globalMetrics, setGlobalMetrics] = useState({});
    const [performanceHistory, setPerformanceHistory] = useState([]);

    useEffect(() => {
        const handleGlobalUpdate = (event) => {
            const { metricName, metric, rating, page } = event.detail;
            
            setGlobalMetrics(prev => ({
                ...prev,
                [metricName]: { ...metric, rating, page }
            }));

            // Store in history (last 100 entries)
            setPerformanceHistory(prev => [
                { metricName, metric, rating, page, timestamp: Date.now() },
                ...prev.slice(0, 99)
            ]);
        };

        window.addEventListener('webVitalsUpdate', handleGlobalUpdate);
        
        return () => {
            window.removeEventListener('webVitalsUpdate', handleGlobalUpdate);
        };
    }, []);

    const contextValue = {
        globalMetrics,
        performanceHistory,
        trackingOptions
    };

    return (
        <PerformanceContext.Provider value={contextValue}>
            {children}
        </PerformanceContext.Provider>
    );
};

// Hook to access performance context
export const usePerformanceContext = () => {
    const context = React.useContext(PerformanceContext);
    
    if (!context) {
        throw new Error('usePerformanceContext must be used within a PerformanceProvider');
    }
    
    return context;
};

export default usePerformance;
