// Widget exports for Core Dashboard
// Each module contributes widgets via this central registry

// Core Widgets
export { default as ActiveModules } from './Core/ActiveModules';

// Re-export module widget registries
export { HRM_WIDGETS } from './HRM';
export { RFI_WIDGETS } from './RFI';

// Combined widget registry for dynamic loading
// Maps component paths to lazy import functions
export const WIDGET_REGISTRY = {
    // Core widgets
    'Widgets/Core/ActiveModules': () => import('./Core/ActiveModules'),
    
    // HRM widgets (use existing components where available)
    'Components/PunchStatusCard': () => import('@/Components/PunchStatusCard'),
    'Components/Leave/PendingApprovalsWidget': () => import('@/Components/Leave/PendingApprovalsWidget'),
    'Widgets/HRM/MyLeaveBalanceWidget': () => import('./HRM/MyLeaveBalanceWidget'),
    
    // RFI widgets
    'Widgets/RFI/PendingInspectionsWidget': () => import('./RFI/PendingInspectionsWidget'),
    'Widgets/RFI/MyRfiStatusWidget': () => import('./RFI/MyRfiStatusWidget'),
    'Widgets/RFI/OverdueRfisWidget': () => import('./RFI/OverdueRfisWidget'),
};

/**
 * Get a widget component by its path
 * @param {string} componentPath - The component path from backend widget config
 * @returns {Promise<React.Component>} The widget component
 */
export const getWidgetComponent = async (componentPath) => {
    const loader = WIDGET_REGISTRY[componentPath];
    if (!loader) {
        console.warn(`Widget not found in registry: ${componentPath}`);
        return null;
    }
    
    try {
        const module = await loader();
        return module.default || module;
    } catch (error) {
        console.error(`Failed to load widget: ${componentPath}`, error);
        return null;
    }
};
