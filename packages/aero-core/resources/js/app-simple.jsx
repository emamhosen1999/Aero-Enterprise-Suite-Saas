import './bootstrap';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from '@/Context/ThemeContext';
import LoadingIndicator from '@/Components/LoadingIndicator';
import './theme/index.js';

/**
 * Aero Core Application - Simplified Entry Point
 * 
 * Simple page resolution:
 * 1. Core pages from ./Pages/**\/*.jsx
 * 2. Module pages from window.Aero.modules (injected by module bundles)
 */

// Global namespace for modules
window.Aero = window.Aero || { modules: {} };

// Load all Core pages
const pages = import.meta.glob('./Pages/**/*.jsx');

/**
 * Resolve page component - supports both Core and Module pages
 */
async function resolvePage(name) {
  // Try Core pages first
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
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Page Not Found</h1>
        <p className="text-gray-600">Could not resolve: {name}</p>
      </div>
    </div>
  );
}

// Initialize Inertia app
createInertiaApp({
  title: (title) => title ? `${title} - Aero` : 'Aero',
  resolve: resolvePage,
  setup({ el, App, props }) {
    createRoot(el).render(
      <HeroUIProvider>
        <ThemeProvider>
          <LoadingIndicator />
          <App {...props} />
        </ThemeProvider>
      </HeroUIProvider>
    );
  },
  progress: {
    color: '#4B5563',
    showSpinner: true,
  },
});
