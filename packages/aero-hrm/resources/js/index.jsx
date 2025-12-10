/**
 * Aero HRM Module Entry Point
 * 
 * This file exports the navigation for the HRM module,
 * enabling dynamic loading in both SaaS and Standalone modes.
 */

// Import navigation definition
import {hrmNavigation} from './navigation';

// Export empty pages structure for now
// TODO: Add actual page exports once pages are organized
export const Pages = {};

// Register navigation with Core at module load time
if (typeof window !== 'undefined' && window.Aero && window.Aero.registerNavigation) {
  window.Aero.registerNavigation('hrm', hrmNavigation);
}

// Resolver function for dynamic component loading
export function resolve(path) {
  // For now, return null until pages are properly organized
  console.warn(`HRM Module: Page resolution not yet implemented for path: ${path}`);
  return null;
}

// Default export for UMD builds
export default {
  Pages,
  resolve,
};

// Auto-register with Aero if in browser environment
if (typeof window !== 'undefined' && window.Aero) {
  console.log('[Aero HRM] Module loaded, registering with window.Aero');
  
  // Register using the new API
  if (typeof window.Aero.register === 'function') {
    window.Aero.register('Hrm', { Pages, resolve });
  } else {
    // Fallback for older API
    window.Aero.modules.Hrm = { Pages, resolve };
  }
  
  console.log('[Aero HRM] Module registered successfully');
}
