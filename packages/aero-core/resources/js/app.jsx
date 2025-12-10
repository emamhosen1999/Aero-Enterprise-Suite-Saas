import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'react-hot-toast';

/**
 * Aero Host Application Entry Point
 * 
 * This file implements the "Host & Guest" strategy:
 * 1. Host: Core React/Inertia setup (SaaS/Standalone shared)
 * 2. Guest: Dynamically loaded modules (injected or lazy-loaded)
 * 
 * Module Resolution Priority:
 * 1. Runtime-injected modules (window.Aero.modules) - Standalone mode
 * 2. Lazy imports from packages - SaaS mode (Composer)
 */

// Initialize global Aero namespace
window.Aero = window.Aero || {};
window.Aero.modules = window.Aero.modules || {};
window.Aero.navigation = window.Aero.navigation || [];

/**
 * Register navigation items from modules
 * 
 * @param {string} moduleName - Module identifier (e.g., 'hrm', 'crm')
 * @param {Array} items - Array of navigation menu objects
 */
window.Aero.registerNavigation = (moduleName, items) => {
  // Add module identifier to each item for tracking
  const itemsWithModule = items.map(item => ({ ...item, module: moduleName }));
  window.Aero.navigation.push(...itemsWithModule);
  console.log(`[Aero] Navigation registered for module: ${moduleName}`, items);
};

/**
 * Module Resolver
 * 
 * Resolves page components from either:
 * - Runtime modules (Standalone): window.Aero.modules
 * - Bundled modules (SaaS): Dynamic imports
 * 
 * @param {string} name - Page component path (e.g., 'Hrm/Employees/Index')
 * @returns {Promise<Component>}
 */
async function resolvePageComponent(name) {
  // Extract module name from path (e.g., 'Hrm' from 'Hrm/Employees/Index')
  const parts = name.split('/');
  const moduleName = parts[0];
  const componentPath = parts.slice(1).join('/');

  // Priority 1: Check for runtime-injected modules (Standalone mode)
  if (window.Aero.modules[moduleName]) {
    try {
      const moduleExports = window.Aero.modules[moduleName];
      
      // Handle different export patterns
      if (typeof moduleExports.resolve === 'function') {
        return await moduleExports.resolve(componentPath);
      }
      
      // Direct component access: window.Aero.modules.Hrm.Pages.Employees.Index
      const component = getNestedProperty(moduleExports, `Pages.${componentPath.replace(/\//g, '.')}`);
      
      if (component) {
        return component;
      }
      
      console.warn(`Component not found in runtime module: ${moduleName}/${componentPath}`);
    } catch (error) {
      console.error(`Error loading component from runtime module:`, error);
    }
  }

  // Priority 2: Lazy import from packages (SaaS mode)
  try {
    // Map module names to package imports
    const moduleImports = {
      'Hrm': () => import('../../packages/aero-hrm/resources/js/Pages'),
      'Crm': () => import('../../packages/aero-crm/resources/js/Pages'),
      'Finance': () => import('../../packages/aero-finance/resources/js/Pages'),
      'Project': () => import('../../packages/aero-project/resources/js/Pages'),
      'Pos': () => import('../../packages/aero-pos/resources/js/Pages'),
      'Ims': () => import('../../packages/aero-ims/resources/js/Pages'),
      'Scm': () => import('../../packages/aero-scm/resources/js/Pages'),
      'Dms': () => import('../../packages/aero-dms/resources/js/Pages'),
      'Quality': () => import('../../packages/aero-quality/resources/js/Pages'),
      'Compliance': () => import('../../packages/aero-compliance/resources/js/Pages'),
    };

    if (moduleImports[moduleName]) {
      const pages = await moduleImports[moduleName]();
      const component = getNestedProperty(pages, componentPath.replace(/\//g, '.'));
      
      if (component) {
        return component;
      }
    }
  } catch (error) {
    // Suppress errors in Standalone mode where packages aren't available
    if (window.Aero.mode !== 'standalone') {
      console.error(`Error lazy-loading component:`, error);
    }
  }

  // Priority 3: Try direct dynamic import as fallback
  try {
    const fullPath = `../../packages/aero-${moduleName.toLowerCase()}/resources/js/Pages/${componentPath}.jsx`;
    const module = await import(/* @vite-ignore */ fullPath);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to resolve component: ${name}`, error);
  }

  // Return error component
  return () => (
    <div className="min-h-screen flex items-center justify-center bg-danger-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-danger-600 mb-4">Component Not Found</h1>
        <p className="text-lg text-danger-500">
          Unable to load: <code className="bg-danger-100 px-2 py-1 rounded">{name}</code>
        </p>
      </div>
    </div>
  );
}

/**
 * Get nested property from object using dot notation
 * 
 * @param {object} obj - Object to traverse
 * @param {string} path - Dot-separated path (e.g., 'Pages.Employees.Index')
 * @returns {any}
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, prop) => {
    return current?.[prop];
  }, obj);
}

/**
 * Initialize Inertia App
 */
createInertiaApp({
  // Title generation
  title: (title) => title ? `${title} - Aero ERP` : 'Aero ERP',

  // Page component resolver
  resolve: resolvePageComponent,

  // Setup function
  setup({ el, App, props }) {
    createRoot(el).render(
      <HeroUIProvider>
        <App {...props} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--theme-content1, #ffffff)',
              color: 'var(--theme-foreground, #000000)',
              borderRadius: 'var(--borderRadius, 12px)',
            },
            success: {
              iconTheme: {
                primary: 'var(--theme-success, #17c964)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--theme-danger, #f31260)',
                secondary: 'white',
              },
            },
          }}
        />
      </HeroUIProvider>
    );
  },

  // Progress bar
  progress: {
    delay: 250,
    color: '#4f46e5',
    includeCSS: true,
    showSpinner: true,
  },
});

/**
 * Register module helper function
 * 
 * Allows modules to self-register at runtime:
 * window.Aero.registerModule('Hrm', { Pages: {...}, Components: {...} })
 * 
 * @param {string} name - Module name
 * @param {object} exports - Module exports
 */
window.Aero.registerModule = function(name, exports) {
  console.log(`[Aero] Registering module: ${name}`);
  
  window.Aero.modules[name] = exports;
  
  // Trigger custom event for module registration
  window.dispatchEvent(new CustomEvent('aero:module:registered', {
    detail: { name, exports }
  }));
};

/**
 * Check if a module is available
 * 
 * @param {string} name - Module name
 * @returns {boolean}
 */
window.Aero.hasModule = function(name) {
  return !!window.Aero.modules[name];
};

/**
 * Get module exports
 * 
 * @param {string} name - Module name
 * @returns {object|null}
 */
window.Aero.getModule = function(name) {
  return window.Aero.modules[name] || null;
};

// Log initialization
console.log('[Aero] Application initialized', {
  mode: window.Aero.mode || 'unknown',
  modules: Object.keys(window.Aero.modules),
});
