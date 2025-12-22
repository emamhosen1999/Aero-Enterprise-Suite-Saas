import './bootstrap';
import '../css/app.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {createInertiaApp, router} from '@inertiajs/react';
import {resolvePageComponent} from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';
import LoadingIndicator from './Components/LoadingIndicator';
import UnifiedError from '@/Shared/Errors/UnifiedError';
import { ThemeProvider } from './Context/ThemeContext';
import { HeroUIProvider } from '@heroui/react';
import './theme/index.js';
import { initializeDeviceAuth } from './utils/deviceAuth';

// Expose Inertia router globally for error handlers and external use
if (typeof window !== 'undefined') {
    window.Inertia = router;
}

/**
 * Global Error State Manager
 * Manages critical errors that should show full-screen error UI
 */
class GlobalErrorManager {
    constructor() {
        this.listeners = new Set();
        this.currentError = null;
    }

    setError(error) {
        this.currentError = error;
        this.listeners.forEach(listener => listener(error));
    }

    clearError() {
        this.currentError = null;
        this.listeners.forEach(listener => listener(null));
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    getError() {
        return this.currentError;
    }
}

export const globalErrorManager = new GlobalErrorManager();

/**
 * Generate unique trace ID for error tracking
 */
const generateTraceId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Global Error Reporter
 * Centralizes error reporting for all error types
 */
const reportError = async (errorData, showUI = false) => {
    const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    const traceId = errorData.trace_id || generateTraceId();
    
    const fullErrorData = {
        trace_id: traceId,
        origin: 'frontend',
        ...errorData,
        url: window.location.href,
        user_agent: navigator.userAgent.slice(0, 200),
        timestamp: new Date().toISOString(),
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
        },
        browser: getBrowserInfo(),
    };

    // Show full-screen error UI for critical errors
    if (showUI) {
        globalErrorManager.setError({
            code: errorData.http_code || 500,
            type: errorData.error_type || 'UnknownError',
            title: getErrorTitle(errorData.error_type),
            message: errorData.message || 'An unexpected error occurred.',
            trace_id: traceId,
            showHomeButton: true,
            showRetryButton: true,
            timestamp: new Date().toISOString(),
        });
    }
    
    try {
        await fetch('/api/error-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify(fullErrorData),
        });
    } catch (e) {
        console.warn('Failed to report error:', e);
    }

    return traceId;
};

/**
 * Get browser information
 */
const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1];
    } else if (ua.indexOf('Edg') > -1) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1];
    } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1];
    } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1];
    }

    return { name: browserName, version: browserVersion, platform: navigator.platform };
};

/**
 * Get user-friendly error title based on error type
 */
const getErrorTitle = (errorType) => {
    const titles = {
        'GlobalError': 'Application Error',
        'UnhandledPromiseRejection': 'Async Operation Failed',
        'ResourceLoadError': 'Resource Loading Failed',
        'NetworkError': 'Network Connection Error',
        'APIError': 'API Request Failed',
        'FetchError': 'Data Fetch Failed',
        'ChunkLoadError': 'Page Loading Failed',
        'SyntaxError': 'Script Error',
        'TypeError': 'Type Error',
        'ReferenceError': 'Reference Error',
        'ReactError': 'Rendering Error',
        'MemoryWarning': 'Memory Warning',
    };
    return titles[errorType] || 'Something Went Wrong';
};

/**
 * Check if error is critical and should show full-screen UI
 */
const isCriticalError = (error, errorType) => {
    // These errors should show full-screen error UI
    const criticalTypes = [
        'ChunkLoadError',
        'SyntaxError',
        'ReferenceError',
    ];

    // Check for chunk loading failures (lazy load failures)
    if (error?.message?.includes('Loading chunk') || 
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Unable to preload CSS')) {
        return true;
    }

    // Check error type
    if (criticalTypes.includes(errorType)) {
        return true;
    }

    // Network failures on critical API calls
    if (errorType === 'NetworkError' && error?.isCritical) {
        return true;
    }

    return false;
};

// Expose reportError globally for use in other modules
window.__reportError = reportError;
window.__globalErrorManager = globalErrorManager;

/**
 * GLOBAL ERROR HANDLERS
 * These catch errors that React Error Boundaries cannot:
 * - Event handler errors
 * - Async errors (setTimeout, Promises)
 * - Errors outside React tree
 * - Chunk loading failures
 * - Network/API errors
 */

// Track reported errors to prevent duplicates
const reportedErrors = new Set();

// 1. Catch all unhandled JavaScript errors (event handlers, sync errors outside React)
window.onerror = function(message, source, lineno, colno, error) {
    const errorKey = `${message}-${source}-${lineno}`;
    if (reportedErrors.has(errorKey)) return false;
    reportedErrors.add(errorKey);

    console.error('Global error caught:', { message, source, lineno, colno, error });
    
    const errorType = error?.name || 'GlobalError';
    const isCritical = isCriticalError(error, errorType);
    
    reportError({
        error_type: errorType,
        http_code: 0,
        message: String(message).slice(0, 500),
        stack: error?.stack?.slice(0, 2000) || `${source}:${lineno}:${colno}`,
        component_stack: `Source: ${source}, Line: ${lineno}, Col: ${colno}`,
        context: { type: 'window.onerror', critical: isCritical },
    }, isCritical);
    
    // Return false to allow default browser error handling (console logging)
    return false;
};

// 2. Catch all unhandled promise rejections (async errors, failed fetches, etc.)
window.onunhandledrejection = function(event) {
    const reason = event.reason;
    const errorKey = `promise-${reason?.message || String(reason)}`;
    if (reportedErrors.has(errorKey)) return;
    reportedErrors.add(errorKey);

    console.error('Unhandled promise rejection:', reason);
    
    // Check for chunk loading failures
    const isChunkError = reason?.message?.includes('Loading chunk') ||
                         reason?.message?.includes('Failed to fetch dynamically imported module') ||
                         reason?.message?.includes('Unable to preload CSS');
    
    const errorType = isChunkError ? 'ChunkLoadError' : 'UnhandledPromiseRejection';
    const isCritical = isCriticalError(reason, errorType);
    
    reportError({
        error_type: errorType,
        http_code: 0,
        message: (reason?.message || String(reason)).slice(0, 500),
        stack: reason?.stack?.slice(0, 2000) || 'No stack trace',
        component_stack: 'Promise rejection - async error',
        context: { type: 'unhandledrejection', critical: isCritical },
    }, isCritical);
};

// 3. Catch errors in error event listeners (more comprehensive than onerror)
window.addEventListener('error', (event) => {
    // Skip if already handled by onerror
    if (event.error && event.error.__reported) return;
    
    // Mark as reported to avoid duplicates
    if (event.error) {
        event.error.__reported = true;
    }
    
    // Handle resource loading errors (images, scripts, etc.)
    if (event.target && event.target !== window) {
        const target = event.target;
        const tagName = target.tagName?.toLowerCase();
        
        if (['img', 'script', 'link', 'video', 'audio'].includes(tagName)) {
            const resourceUrl = target.src || target.href;
            const errorKey = `resource-${tagName}-${resourceUrl}`;
            if (reportedErrors.has(errorKey)) return;
            reportedErrors.add(errorKey);

            console.error('Resource loading error:', resourceUrl);
            
            // Script loading failures are critical
            const isCritical = tagName === 'script';
            
            reportError({
                error_type: 'ResourceLoadError',
                http_code: 0,
                message: `Failed to load ${tagName}: ${resourceUrl}`.slice(0, 500),
                stack: 'Resource loading failure',
                component_stack: `Element: <${tagName}>, URL: ${resourceUrl}`,
                context: { type: 'resource_error', element: tagName, critical: isCritical },
            }, isCritical);
        }
    }
}, true); // Use capture phase to catch before bubbling

// 4. Wrap fetch to catch network errors
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
    
    try {
        const response = await originalFetch.apply(this, args);
        
        // Log server errors (5xx)
        if (response.status >= 500) {
            const errorKey = `fetch-${response.status}-${url}`;
            if (!reportedErrors.has(errorKey)) {
                reportedErrors.add(errorKey);
                
                reportError({
                    error_type: 'APIError',
                    http_code: response.status,
                    message: `API Error ${response.status}: ${url}`.slice(0, 500),
                    stack: `Fetch failed with status ${response.status}`,
                    component_stack: `URL: ${url}, Status: ${response.status}`,
                    context: { type: 'fetch_error', status: response.status },
                }, false); // Don't show UI for API errors, let the component handle it
            }
        }
        
        return response;
    } catch (error) {
        // Network errors (no response received)
        const errorKey = `fetch-network-${url}`;
        if (!reportedErrors.has(errorKey)) {
            reportedErrors.add(errorKey);
            
            console.error('Fetch network error:', url, error);
            
            reportError({
                error_type: 'NetworkError',
                http_code: 0,
                message: `Network error fetching ${url}: ${error.message}`.slice(0, 500),
                stack: error.stack?.slice(0, 2000) || 'No stack trace',
                component_stack: `Fetch URL: ${url}`,
                context: { type: 'fetch_network_error' },
            }, false);
        }
        
        throw error;
    }
};

// Initialize secure device authentication
initializeDeviceAuth();

// Enhanced axios configuration with interceptors
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

// Add CSRF token to all requests
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

// Performance monitoring only in development or when explicitly enabled
const ENABLE_MONITORING = import.meta.env.DEV || 
    (typeof window !== 'undefined' && window.location.search.includes('monitor=true')) ||
    (typeof window !== 'undefined' && localStorage.getItem('enable-monitoring') === 'true');

// Optimized request interceptor (only for performance monitoring)
if (ENABLE_MONITORING) {
    axios.interceptors.request.use(
        (config) => {
            config.metadata = { startTime: new Date() };
            return config;
        },
        (error) => Promise.reject(error)
    );
}

// CRITICAL: Response interceptor for error handling (ALWAYS enabled, not just in dev)
axios.interceptors.response.use(
    (response) => {
        // Performance monitoring only when enabled
        if (ENABLE_MONITORING && response.config.metadata) {
            const endTime = new Date();
            const duration = endTime - response.config.metadata.startTime;
            
            // Log slow requests (> 2 seconds)
            if (duration > 2000) {
                console.warn(`Slow API response: ${response.config.url} took ${duration}ms`);
            }
        }
        return response;
    },
    (error) => {
        const url = error.config?.url || 'unknown';
        const status = error.response?.status || 0;
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

        // Enhanced error logging (always enabled)
        if (error.response) {
            console.error('API Error:', {
                status: status,
                url: url,
                method: method,
                data: error.response.data
            });

            // Report server errors (5xx) to error logging
            if (status >= 500) {
                const errorKey = `axios-${status}-${url}`;
                if (!reportedErrors.has(errorKey)) {
                    reportedErrors.add(errorKey);
                    
                    reportError({
                        error_type: 'APIError',
                        http_code: status,
                        message: `${method} ${url} failed with status ${status}`.slice(0, 500),
                        stack: JSON.stringify(error.response.data || {}).slice(0, 2000),
                        component_stack: `Axios request: ${method} ${url}`,
                        context: { 
                            type: 'axios_error', 
                            status: status,
                            method: method,
                            response_data: error.response.data,
                        },
                    }, false);
                }
            }
        } else if (error.request) {
            // Network error - no response received
            const errorKey = `axios-network-${url}`;
            if (!reportedErrors.has(errorKey)) {
                reportedErrors.add(errorKey);
                
                console.error('Network Error:', { url, method, error: error.message });
                
                reportError({
                    error_type: 'NetworkError',
                    http_code: 0,
                    message: `Network error: ${method} ${url} - ${error.message}`.slice(0, 500),
                    stack: error.stack?.slice(0, 2000) || 'No stack trace',
                    component_stack: `Axios request: ${method} ${url}`,
                    context: { type: 'axios_network_error', method: method },
                }, false);
            }
        }
        
        // CRITICAL: Handle session expiry (419 or 401 status codes) - ALWAYS enabled
        if (error.response && (status === 419 || status === 401)) {
            // Immediately redirect to login without showing modal
            console.warn('Session expired or unauthenticated, redirecting to login');
            
            if (typeof window !== 'undefined' && window.Inertia) {
                window.Inertia.visit('/login', {
                    method: 'get',
                    preserveState: false,
                    preserveScroll: false,
                    replace: true
                });
            } else {
                window.location.href = '/login';
            }
            
            return Promise.reject(error);
        }
        
        return Promise.reject(error);
    }
);

/**
 * Aero Enterprise Suite - Unified Frontend Entry Point
 * 
 * All pages are now in the UI package under ./Pages directory.
 * The Inertia page name maps directly to the file path.
 */
const pages = import.meta.glob('./Pages/**/*.jsx');

const resolveInertiaPage = (name) => {
    const path = `./Pages/${name}.jsx`;
    
    if (path in pages) {
        return resolvePageComponent(path, pages);
    }

    throw new Error(`Unable to locate Inertia page: ${name}`);
};


createInertiaApp({
    // Disable default progress bar - using custom LoadingIndicator instead
    progress: false,
    
    title: (title) => {
        const page = window.Laravel?.inertiaProps || {};
        const appName = page.app?.name || 'aeos365';
        return `${title} - ${appName}`;
    },
    resolve: resolveInertiaPage,
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        // Performance monitoring for initial render
        const renderStart = performance.now();
        
        root.render(
            <ThemeProvider>
                <HeroUIProvider>
                    <UnifiedError>
                        <LoadingIndicator />
                        <App {...props} />
                    </UnifiedError>
                </HeroUIProvider>
            </ThemeProvider>
        );
        
        // Log render performance only in development
        if (ENABLE_MONITORING) {
            const renderEnd = performance.now();
            const renderTime = renderEnd - renderStart;
            
            if (renderTime > 100) { // Log slow renders
                console.warn(`Slow initial render: ${renderTime.toFixed(2)}ms`);
            }
        }
        
        // Track page load performance (optimized)
        if (ENABLE_MONITORING && typeof window !== 'undefined' && 'performance' in window) {
            window.addEventListener('load', () => {
                // Use requestIdleCallback to defer performance logging
                const logPerformance = () => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        const loadTime = perfData.loadEventEnd - perfData.fetchStart;

                        
                        // Log to backend only if load time is significant and user opted in
                        if (loadTime > 5000 && localStorage.getItem('performance-logging') === 'true') {
                            fetch('/api/log-performance', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': token?.content || ''
                                },
                                body: JSON.stringify({
                                    metric_type: 'page_load',
                                    identifier: window.location.pathname,
                                    execution_time_ms: loadTime,
                                    metadata: {
                                        url: window.location.href,
                                        user_agent: navigator.userAgent.slice(0, 200) // Truncate
                                    }
                                })
                            }).catch(err => console.warn('Failed to log performance:', err));
                        }
                    }
                };
                
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(logPerformance);
                } else {
                    setTimeout(logPerformance, 100);
                }
            });
        }
    },
}).then(() => {
    // Initialize device authentication
    initializeDeviceAuth();
    
    // Initialize memory monitoring only in development
    if (ENABLE_MONITORING && typeof window !== 'undefined') {
        // Monitor memory usage (throttled)
        if ('memory' in performance) {
            let lastMemoryCheck = 0;
            const checkMemory = () => {
                const now = Date.now();
                if (now - lastMemoryCheck < 30000) return; // Throttle to every 30 seconds
                lastMemoryCheck = now;
                
                const memory = performance.memory;
                const memoryUsage = {
                    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
                };
                
                // Log memory warning if usage is high
                if (memoryUsage.used > memoryUsage.limit * 0.8) {
                    console.warn('High memory usage detected:', memoryUsage);
                    reportError({
                        error_type: 'MemoryWarning',
                        http_code: 0,
                        message: `High memory usage: ${memoryUsage.used}MB / ${memoryUsage.limit}MB`,
                        stack: 'Memory monitoring',
                        component_stack: JSON.stringify(memoryUsage),
                        context: { type: 'memory_warning' },
                    });
                }
            };
            
            // Check memory on user interaction
            ['click', 'scroll', 'keydown'].forEach(event => {
                document.addEventListener(event, checkMemory, { passive: true, once: false });
            });
        }
    }
});
