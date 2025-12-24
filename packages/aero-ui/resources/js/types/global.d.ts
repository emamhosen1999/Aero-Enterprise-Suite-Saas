/**
 * Global Type Definitions for Aero Enterprise Suite
 * 
 * Defines global functions and objects available in the browser window.
 */

/**
 * Ziggy Route Helper Type Definitions
 * 
 * The route() function is provided by the ziggy-js package and injected
 * via the @routes Blade directive in app.blade.php
 */

interface RouteParamsWithQueryOverload {
    (name: string, params?: any, absolute?: boolean): string;
    (): ZiggyRoute;
}

interface ZiggyRoute {
    /**
     * Check if a route exists
     */
    has(name: string): boolean;
    
    /**
     * Get the current route name
     */
    current(name?: string, params?: any): boolean | string;
    
    /**
     * Get all available routes
     */
    list(): Record<string, any>;
}

/**
 * Global route helper function from Ziggy
 */
declare const route: RouteParamsWithQueryOverload;

/**
 * Extend Window interface for global objects
 */
interface Window {
    /**
     * Ziggy route helper
     */
    route: RouteParamsWithQueryOverload;
    
    /**
     * Axios HTTP client
     */
    axios: any;
    
    /**
     * Inertia router instance
     */
    Inertia: any;
    
    /**
     * Laravel configuration
     */
    Laravel?: {
        inertiaProps?: any;
    };
    
    /**
     * Global error reporter (defined in app.jsx)
     */
    __reportError?: (errorData: any, showUI?: boolean) => Promise<string>;
    
    /**
     * Global error manager (defined in app.jsx)
     */
    __globalErrorManager?: any;
    
    /**
     * App loader utility (defined in app.blade.php)
     */
    AppLoader?: {
        hideLoading: () => void;
        showLoading: (message?: string, subtitle?: string) => void;
        updateLoadingMessage: (message: string, subtitle?: string) => void;
    };
}
