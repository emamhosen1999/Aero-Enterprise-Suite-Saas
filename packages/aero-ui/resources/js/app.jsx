import './bootstrap';
import '../css/app.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {createInertiaApp} from '@inertiajs/react';
import {resolvePageComponent} from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';
import LoadingIndicator from './Components/LoadingIndicator';
import UnifiedError from './Components/Errors/UnifiedError';
import { ThemeProvider } from './Shared/Context/ThemeContext';
import { HeroUIProvider } from '@heroui/react';
import './theme/index.js';
import { initializeDeviceAuth } from './utils/deviceAuth';

/**
 * Global Error Reporter
 * Centralizes error reporting for all error types
 */
const reportError = async (errorData) => {
    const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content || '';
    
    try {
        await fetch('/api/error-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({
                trace_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                origin: 'frontend',
                ...errorData,
                url: window.location.href,
                user_agent: navigator.userAgent.slice(0, 200),
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (e) {
        console.warn('Failed to report error:', e);
    }
};

/**
 * GLOBAL ERROR HANDLERS
 * These catch errors that React Error Boundaries cannot:
 * - Event handler errors
 * - Async errors (setTimeout, Promises)
 * - Errors outside React tree
 */

// 1. Catch all unhandled JavaScript errors (event handlers, sync errors outside React)
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', { message, source, lineno, colno, error });
    
    reportError({
        error_type: 'GlobalError',
        http_code: 0,
        message: String(message).slice(0, 500),
        stack: error?.stack?.slice(0, 2000) || `${source}:${lineno}:${colno}`,
        component_stack: `Source: ${source}, Line: ${lineno}, Col: ${colno}`,
        context: { type: 'window.onerror' },
    });
    
    // Return false to allow default browser error handling (console logging)
    return false;
};

// 2. Catch all unhandled promise rejections (async errors, failed fetches, etc.)
window.onunhandledrejection = function(event) {
    const reason = event.reason;
    console.error('Unhandled promise rejection:', reason);
    
    reportError({
        error_type: 'UnhandledPromiseRejection',
        http_code: 0,
        message: (reason?.message || String(reason)).slice(0, 500),
        stack: reason?.stack?.slice(0, 2000) || 'No stack trace',
        component_stack: 'Promise rejection - async error',
        context: { type: 'unhandledrejection' },
    });
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
            console.error('Resource loading error:', target.src || target.href);
            
            reportError({
                error_type: 'ResourceLoadError',
                http_code: 0,
                message: `Failed to load ${tagName}: ${target.src || target.href}`.slice(0, 500),
                stack: 'Resource loading failure',
                component_stack: `Element: <${tagName}>, URL: ${target.src || target.href}`,
                context: { type: 'resource_error', element: tagName },
            });
        }
    }
}, true); // Use capture phase to catch before bubbling

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
        // Enhanced error logging (always enabled)
        if (error.response) {
            console.error('API Error:', {
                status: error.response.status,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response.data
            });
        }
        
        // CRITICAL: Handle session expiry (419 or 401 status codes) - ALWAYS enabled
        if (error.response && (error.response.status === 419 || error.response.status === 401)) {
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

/**
 * Fallback Error Boundary
 * This is a last-resort boundary that catches errors if UnifiedError itself fails
 */
class FallbackErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('FallbackErrorBoundary caught error:', error, errorInfo);
        reportError({
            error_type: 'FallbackBoundaryError',
            http_code: 0,
            message: `Critical error (primary boundary failed): ${error?.message}`.slice(0, 500),
            stack: error?.stack?.slice(0, 2000) || 'No stack',
            component_stack: errorInfo?.componentStack?.slice(0, 1000) || 'No component stack',
            context: { type: 'fallback_boundary' },
        });
    }

    render() {
        if (this.state.hasError) {
            // Minimal fallback UI - no dependencies on other components
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fee2e2',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <h1 style={{ color: '#dc2626', fontSize: '1.5rem', marginBottom: '1rem' }}>
                            Something went wrong
                        </h1>
                        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                            A critical error occurred. Please refresh the page.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Refresh Page
                        </button>
                        <details style={{ marginTop: '1rem', textAlign: 'left', maxWidth: '500px' }}>
                            <summary style={{ cursor: 'pointer', color: '#6b7280' }}>
                                Error details
                            </summary>
                            <pre style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                maxHeight: '200px',
                            }}>
                                {this.state.error?.message}
                                {'\n\n'}
                                {this.state.error?.stack}
                            </pre>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}


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
            <FallbackErrorBoundary>
                <UnifiedError>
                    <ThemeProvider>
                        <HeroUIProvider>
                            <LoadingIndicator />
                            <App {...props} />
                        </HeroUIProvider>
                    </ThemeProvider>
                </UnifiedError>
            </FallbackErrorBoundary>
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
