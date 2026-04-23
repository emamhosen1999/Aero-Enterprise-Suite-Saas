import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

/**
 * Glass ERP - Web Vitals Performance Monitoring
 * Real-time Core Web Vitals tracking for production optimization
 * 
 * Targets:
 * - FCP (First Contentful Paint): < 1.8s
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms (deprecated, using INP)
 * - INP (Interaction to Next Paint): < 200ms (new metric)
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTFB (Time to First Byte): < 800ms
 */

class WebVitalsMonitor {
    constructor() {
        this.metrics = {};
        this.callbacks = [];
        this.isProduction = process.env.NODE_ENV === 'production';
        this.baselineData = {
            sessions: 0,
            averages: {},
            trends: []
        };
        
        this.init();
    }

    init() {
        if (typeof window === 'undefined') return;
        
        // Initialize Core Web Vitals monitoring
        this.setupCoreWebVitals();
        
        // Setup performance observer for additional metrics
        this.setupPerformanceObserver();
        
        // Initialize session tracking
        this.initializeSession();
        
        console.log('🚀 Glass ERP Performance Monitoring Initialized');
    }

    setupCoreWebVitals() {
        // First Contentful Paint (FCP)
        onFCP((metric) => {
            this.handleMetric('FCP', metric, {
                good: 1800,
                needsImprovement: 3000
            });
        });        // Largest Contentful Paint (LCP)
        onLCP((metric) => {
            this.handleMetric('LCP', metric, {
                good: 2500,
                needsImprovement: 4000
            });        });

        // Interaction to Next Paint (INP) - New Core Web Vital (replaces FID)
        onINP((metric) => {
            this.handleMetric('INP', metric, {
                good: 200,
                needsImprovement: 500
            });
        });

        // Cumulative Layout Shift (CLS)
        onCLS((metric) => {
            this.handleMetric('CLS', metric, {
                good: 0.1,
                needsImprovement: 0.25
            });
        });

        // Time to First Byte (TTFB)
        onTTFB((metric) => {
            this.handleMetric('TTFB', metric, {
                good: 800,
                needsImprovement: 1800
            });
        });
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Navigation timing
            const navObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    this.handleNavigationTiming(entry);
                });
            });
            navObserver.observe({ entryTypes: ['navigation'] });

            // Resource timing for feature modules
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    this.handleResourceTiming(entry);
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });

            // Long tasks detection
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.handleLongTask(entry);
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task observer not supported');
            }
        }
    }

    handleMetric(name, metric, thresholds) {
        const rating = this.getRating(metric.value, thresholds);
        
        this.metrics[name] = {
            ...metric,
            rating,
            timestamp: Date.now(),
            page: this.getCurrentPage()
        };

        // Store for baseline analysis
        this.updateBaseline(name, metric.value);

        // Log performance issues
        if (rating === 'poor') {
            console.warn(`⚠️ Performance Issue - ${name}: ${metric.value}ms (threshold: ${thresholds.good}ms)`);
        }

        // Send to analytics in production
        if (this.isProduction) {
            this.sendToAnalytics(name, metric, rating);
        }

        // Trigger callbacks
        this.callbacks.forEach(callback => callback(name, metric, rating));

        // Real-time monitoring dashboard
        this.updateRealtimeDashboard(name, metric, rating);
    }

    handleNavigationTiming(entry) {
        const timings = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            connection: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
            domComplete: entry.domComplete - entry.domContentLoadedEventStart,
            pageLoad: entry.loadEventEnd - entry.loadEventStart
        };

        this.metrics.navigation = {
            timings,
            timestamp: Date.now(),
            page: this.getCurrentPage()
        };

        console.log('📊 Navigation Timings:', timings);
    }

    handleResourceTiming(entry) {
        // Track feature module loading performance
        const isFeatureModule = this.isFeatureModuleResource(entry.name);
        
        if (isFeatureModule) {
            const moduleInfo = this.getModuleInfo(entry.name);
            const loadTime = entry.responseEnd - entry.startTime;
            
            if (!this.metrics.modules) {
                this.metrics.modules = {};
            }
            
            this.metrics.modules[moduleInfo.name] = {
                loadTime,
                size: entry.transferSize,
                cached: entry.transferSize === 0,
                timestamp: Date.now()
            };

            // Alert on slow module loading
            if (loadTime > 1000) {
                console.warn(`🐌 Slow module load: ${moduleInfo.name} (${loadTime}ms)`);
            }
        }
    }

    handleLongTask(entry) {
        const longTask = {
            duration: entry.duration,
            startTime: entry.startTime,
            page: this.getCurrentPage(),
            timestamp: Date.now()
        };

        if (!this.metrics.longTasks) {
            this.metrics.longTasks = [];
        }
        
        this.metrics.longTasks.push(longTask);

        console.warn(`🐌 Long Task Detected: ${entry.duration}ms`);
        
        // Alert for critical long tasks
        if (entry.duration > 100) {
            this.reportCriticalPerformanceIssue('Long Task', entry.duration);
        }
    }

    getRating(value, thresholds) {
        if (value <= thresholds.good) return 'good';
        if (value <= thresholds.needsImprovement) return 'needs-improvement';
        return 'poor';
    }

    getCurrentPage() {
        if (typeof window === 'undefined') return 'unknown';
        
        const path = window.location.pathname;
        
        // Map to feature modules
        const moduleMap = {
            '/administration': 'Administration',
            '/attendance': 'Attendance',
            '/communication': 'Communication',
            '/employee-management': 'Employee Management',
            '/events': 'Events',
            '/leave-management': 'Leave Management',
            '/project-management': 'Project Management'
        };

        for (const [route, module] of Object.entries(moduleMap)) {
            if (path.startsWith(route)) {
                return module;
            }
        }

        return path === '/' ? 'Dashboard' : 'Unknown';
    }

    isFeatureModuleResource(url) {
        const featureModules = [
            'administration',
            'attendance', 
            'communication',
            'employee-management',
            'events',
            'leave-management',
            'project-management'
        ];

        return featureModules.some(module => url.includes(module));
    }

    getModuleInfo(url) {
        const modules = {
            'administration': { name: 'Administration', priority: 'high' },
            'attendance': { name: 'Attendance', priority: 'high' },
            'communication': { name: 'Communication', priority: 'medium' },
            'employee-management': { name: 'Employee Management', priority: 'high' },
            'events': { name: 'Events', priority: 'low' },
            'leave-management': { name: 'Leave Management', priority: 'high' },
            'project-management': { name: 'Project Management', priority: 'high' }
        };

        for (const [key, info] of Object.entries(modules)) {
            if (url.includes(key)) {
                return info;
            }
        }

        return { name: 'Unknown', priority: 'low' };
    }

    updateBaseline(metricName, value) {
        if (!this.baselineData.averages[metricName]) {
            this.baselineData.averages[metricName] = {
                total: 0,
                count: 0,
                average: 0,
                min: value,
                max: value
            };
        }

        const metric = this.baselineData.averages[metricName];
        metric.total += value;
        metric.count += 1;
        metric.average = metric.total / metric.count;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);

        // Store trend data (last 100 measurements)
        if (!this.baselineData.trends[metricName]) {
            this.baselineData.trends[metricName] = [];
        }
        
        this.baselineData.trends[metricName].push({
            value,
            timestamp: Date.now()
        });

        // Keep only last 100 measurements
        if (this.baselineData.trends[metricName].length > 100) {
            this.baselineData.trends[metricName].shift();
        }
    }

    initializeSession() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.baselineData.sessions += 1;

        console.log(`🔍 Performance Session Started: ${this.sessionId}`);
    }

    generateSessionId() {
        return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sendToAnalytics(metricName, metric, rating) {
        // Integration point for analytics services
        // Could be Google Analytics, Sentry, custom analytics, etc.
        
        const analyticsData = {
            sessionId: this.sessionId,
            metricName,
            value: metric.value,
            rating,
            page: this.getCurrentPage(),
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType()
        };

        // Example: Send to custom analytics endpoint
        if (window.fetch) {
            fetch('/api/analytics/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(analyticsData)
            }).catch(err => {
                console.warn('Analytics reporting failed:', err);
            });
        }
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    updateRealtimeDashboard(metricName, metric, rating) {
        // Update real-time performance dashboard
        const event = new CustomEvent('webVitalsUpdate', {
            detail: {
                metricName,
                metric,
                rating,
                page: this.getCurrentPage(),
                timestamp: Date.now()
            }
        });

        window.dispatchEvent(event);
    }

    reportCriticalPerformanceIssue(type, value) {
        console.error(`🚨 Critical Performance Issue: ${type} - ${value}ms`);
        
        // Could integrate with error reporting services
        if (window.Sentry) {
            window.Sentry.captureMessage(`Critical Performance Issue: ${type}`, {
                level: 'warning',
                extra: { value, page: this.getCurrentPage() }
            });
        }
    }

    // Public API
    onMetric(callback) {
        this.callbacks.push(callback);
    }

    getBaseline() {
        return this.baselineData;
    }

    getCurrentMetrics() {
        return this.metrics;
    }

    generateReport() {
        const report = {
            sessionId: this.sessionId,
            sessionDuration: Date.now() - this.sessionStart,
            currentMetrics: this.metrics,
            baseline: this.baselineData,
            summary: this.generateSummary(),
            recommendations: this.generateRecommendations()
        };

        console.log('📊 Performance Report Generated:', report);
        return report;
    }

    generateSummary() {
        const summary = {
            overallRating: 'good',
            criticalIssues: 0,
            improvements: []
        };

        // Analyze current metrics
        Object.entries(this.metrics).forEach(([name, metric]) => {
            if (metric.rating === 'poor') {
                summary.criticalIssues += 1;
                summary.overallRating = 'poor';
                summary.improvements.push(`Optimize ${name}: ${metric.value}ms`);
            } else if (metric.rating === 'needs-improvement' && summary.overallRating === 'good') {
                summary.overallRating = 'needs-improvement';
                summary.improvements.push(`Improve ${name}: ${metric.value}ms`);
            }
        });

        return summary;
    }

    generateRecommendations() {
        const recommendations = [];

        // LCP optimization
        if (this.metrics.LCP?.rating === 'poor') {
            recommendations.push({
                metric: 'LCP',
                priority: 'high',
                actions: [
                    'Optimize server response times',
                    'Use image optimization and modern formats',
                    'Implement resource preloading',
                    'Consider lazy loading for below-the-fold content'
                ]
            });
        }

        // FCP optimization
        if (this.metrics.FCP?.rating === 'poor') {
            recommendations.push({
                metric: 'FCP',
                priority: 'high',
                actions: [
                    'Minimize render-blocking resources',
                    'Optimize critical CSS delivery',
                    'Use font-display: swap for web fonts',
                    'Implement efficient caching strategies'
                ]
            });
        }

        // CLS optimization
        if (this.metrics.CLS?.rating === 'poor') {
            recommendations.push({
                metric: 'CLS',
                priority: 'medium',
                actions: [
                    'Set explicit dimensions for images and videos',
                    'Reserve space for dynamic content',
                    'Avoid inserting content above existing content',
                    'Use transform animations instead of properties that trigger layout'
                ]
            });
        }

        return recommendations;
    }
}

// Create singleton instance
const webVitalsMonitor = new WebVitalsMonitor();

// Export for use throughout the application
export default webVitalsMonitor;

// Named exports for specific functionality
export const {
    onMetric,
    getBaseline,
    getCurrentMetrics,
    generateReport
} = webVitalsMonitor;

// Performance utility functions
export const measureFeatureLoad = (featureName, startTime) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    console.log(`⚡ Feature Load Time - ${featureName}: ${loadTime.toFixed(2)}ms`);
    
    if (loadTime > 1000) {
        console.warn(`🐌 Slow feature load detected: ${featureName}`);
    }
    
    return loadTime;
};

export const measureComponentRender = (componentName) => {
    const startTime = performance.now();
    
    return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        console.log(`🎨 Component Render - ${componentName}: ${renderTime.toFixed(2)}ms`);
        
        if (renderTime > 16) { // 60fps threshold
            console.warn(`🐌 Slow component render: ${componentName}`);
        }
        
        return renderTime;
    };
};

// Export for global access
if (typeof window !== 'undefined') {
    window.webVitalsMonitor = webVitalsMonitor;
}
