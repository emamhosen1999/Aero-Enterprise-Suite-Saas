import './bootstrap';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';
import { HeroUIProvider } from '@heroui/react';

/**
 * Aero SaaS Host Application Entry Point
 * 
 * In SaaS mode, pages are loaded from packages:
 * - Platform package: Admin pages, Auth pages, Public pages
 * - Core package: Shared tenant pages
 * - Module packages: HRM, CRM, Finance, etc.
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

// Import pages from packages using aliases defined in vite.config.js
// Platform package pages (Admin, Auth, Public)
const platformPages = import.meta.glob('@platform/Pages/**/*.jsx');

// Core package pages (shared tenant pages, components)
const corePages = import.meta.glob('@core/Pages/**/*.jsx');

// Module packages (HRM, CRM, etc.)
const hrmPages = import.meta.glob('@hrm/Pages/**/*.jsx');
const crmPages = import.meta.glob('@crm/Pages/**/*.jsx');
const financePages = import.meta.glob('@finance/Pages/**/*.jsx');
const projectPages = import.meta.glob('@project/Pages/**/*.jsx');

/**
 * Resolve page component from packages
 * 
 * Route page names map to package directories:
 * - "Public/Landing" -> @platform/Pages/Public/Landing.jsx
 * - "Admin/Dashboard" -> @platform/Pages/Admin/Dashboard.jsx
 * - "Auth/Login" -> @platform/Pages/Auth/Login.jsx
 * - "Dashboard" -> @core/Pages/Dashboard.jsx (tenant pages)
 * - "HRM/Dashboard" -> @hrm/Pages/Dashboard.jsx
 */
async function resolvePage(name) {
    // Check Platform pages first (Public, Admin, Auth, Users, Roles, Modules)
    const platformPath = `@platform/Pages/${name}.jsx`;
    if (platformPath in platformPages) {
        return resolvePageComponent(platformPath, platformPages);
    }

    // Check if it's a module page (e.g., "HRM/Dashboard" -> @hrm/Pages/Dashboard.jsx)
    const moduleMatch = name.match(/^(HRM|CRM|Finance|Project)\/(.+)$/);
    if (moduleMatch) {
        const [, moduleName, pageName] = moduleMatch;
        const moduleMap = {
            HRM: { pages: hrmPages, alias: '@hrm' },
            CRM: { pages: crmPages, alias: '@crm' },
            Finance: { pages: financePages, alias: '@finance' },
            Project: { pages: projectPages, alias: '@project' },
        };
        
        const module = moduleMap[moduleName];
        if (module) {
            const modulePath = `${module.alias}/Pages/${pageName}.jsx`;
            if (modulePath in module.pages) {
                return resolvePageComponent(modulePath, module.pages);
            }
        }
    }

    // Check Core pages (tenant dashboard, settings, etc.)
    const corePath = `@core/Pages/${name}.jsx`;
    if (corePath in corePages) {
        return resolvePageComponent(corePath, corePages);
    }

    // Try module pages via window.Aero.modules (runtime loaded)
    const [firstSegment, ...rest] = name.split('/');
    const runtimeModule = window.Aero.modules[firstSegment];
    if (runtimeModule?.resolve) {
        return runtimeModule.resolve(rest.join('/'));
    }

    // Fallback error component with debugging info
    console.error(`Page not found: ${name}`);
    console.log('Available platform pages:', Object.keys(platformPages));
    console.log('Available core pages:', Object.keys(corePages));
    
    return () => (
        <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-950">
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                    Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Unable to load: <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{name}</code>
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    <p>Platform pages: {Object.keys(platformPages).length}</p>
                    <p>Core pages: {Object.keys(corePages).length}</p>
                    <p>HRM pages: {Object.keys(hrmPages).length}</p>
                </div>
            </div>
        </div>
    );
}

// Initialize Inertia app
createInertiaApp({
    progress: {
        color: '#4F46E5',
        showSpinner: true,
    },
    title: (title) => {
        const appName = window.Laravel?.inertiaProps?.app?.name || 'Aero Enterprise Suite';
        return title ? `${title} - ${appName}` : appName;
    },
    resolve: resolvePage,
    setup({ el, App, props }) {
        createRoot(el).render(
            <HeroUIProvider>
                <App {...props} />
            </HeroUIProvider>
        );
    },
});
