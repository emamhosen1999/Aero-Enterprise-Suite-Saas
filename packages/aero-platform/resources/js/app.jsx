import './bootstrap';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';
import LoadingIndicator from '@/Components/LoadingIndicator';
import UnifiedError from '@/Shared/Pages/Errors/UnifiedError';
import { ThemeProvider } from '@/Shared/Context/ThemeContext';
import { HeroUIProvider } from '@heroui/react';
import './theme/index.js';

/**
 * Aero Platform Application Entry Point
 * 
 * Page resolution:
 * 1. Platform pages from ./Pages (Admin, Public, Auth, etc.)
 * 2. Module pages from window.Aero.modules (injected by module bundles)
 */

// Global namespace for modules
window.Aero = window.Aero || { modules: {} };

// Configure axios with CSRF token
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

// Handle session expiry
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 419 || error.response.status === 401)) {
            console.warn('Session expired, redirecting to login');
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
        }
        return Promise.reject(error);
    }
);

// Load all Platform pages
const pages = import.meta.glob('./Pages/**/*.jsx');

/**
 * Resolve page component - supports both Platform and Module pages
 */
async function resolvePage(name) {
    // Try Platform pages first
    const pagePath = `./Pages/${name}.jsx`;

    if (pagePath in pages) {
        return resolvePageComponent(pagePath, pages);
    }

    // Try module pages (injected via window.Aero.modules)
    const [moduleName, ...rest] = name.split('/');
    const module = window.Aero.modules[moduleName];

    if (module?.resolve) {
        return module.resolve(rest.join('/'));
    }

    // Fallback error component
    return () => (
        <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-950">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Component Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Unable to load: {name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Available pages: {Object.keys(pages).length}</p>
            </div>
        </div>
    );
}

// Initialize Inertia app
createInertiaApp({
    progress: false, // Using custom LoadingIndicator
    title: (title) => {
        const appName = window.Laravel?.inertiaProps?.app?.name || 'Aero Platform';
        return title ? `${title} - ${appName}` : appName;
    },
    resolve: resolvePage,
    setup({ el, App, props }) {
        createRoot(el).render(
            <UnifiedError>
                <ThemeProvider>
                    <HeroUIProvider>
                        <LoadingIndicator />
                        <App {...props} />
                    </HeroUIProvider>
                </ThemeProvider>
            </UnifiedError>
        );
    },
});
