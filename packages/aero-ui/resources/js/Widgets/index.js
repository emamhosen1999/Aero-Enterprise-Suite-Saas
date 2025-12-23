// Widget exports for Core Dashboard
// Each module contributes widgets via this central registry

// Core Widgets
export { default as ActiveModules } from './Core/ActiveModules';
export { default as WelcomeWidget } from './Core/WelcomeWidget';
export { default as QuickActionsWidget } from './Core/QuickActionsWidget';
export { default as NotificationsWidget } from './Core/NotificationsWidget';
export { default as SystemStatsWidget } from './Core/SystemStatsWidget';
export { default as SecurityOverviewWidget } from './Core/SecurityOverviewWidget';
export { default as RecentActivityWidget } from './Core/RecentActivityWidget';

// Re-export module widget registries
export { HRM_WIDGETS } from './HRM';
export { RFI_WIDGETS } from './RFI';
export { DMS_WIDGETS } from './DMS';

// Combined widget registry for dynamic loading
// Maps component paths to lazy import functions
export const WIDGET_REGISTRY = {
    // Core widgets
    'Widgets/Core/ActiveModules': () => import('./Core/ActiveModules'),
    'Widgets/Core/WelcomeWidget': () => import('./Core/WelcomeWidget'),
    'Widgets/Core/QuickActionsWidget': () => import('./Core/QuickActionsWidget'),
    'Widgets/Core/NotificationsWidget': () => import('./Core/NotificationsWidget'),
    'Widgets/Core/SystemStatsWidget': () => import('./Core/SystemStatsWidget'),
    'Widgets/Core/SecurityOverviewWidget': () => import('./Core/SecurityOverviewWidget'),
    'Widgets/Core/RecentActivityWidget': () => import('./Core/RecentActivityWidget'),
    
    // HRM widgets
    'Components/PunchStatusCard': () => import('@/Components/PunchStatusCard'),
    'Components/Leave/PendingApprovalsWidget': () => import('@/Components/Leave/PendingApprovalsWidget'),
    'Widgets/HRM/MyLeaveBalanceWidget': () => import('./HRM/MyLeaveBalanceWidget'),
    'Widgets/HRM/UpcomingHolidaysWidget': () => import('./HRM/UpcomingHolidaysWidget'),
    'Widgets/HRM/OrganizationInfoWidget': () => import('./HRM/OrganizationInfoWidget'),
    'Widgets/HRM/PunchStatusWidget': () => import('./HRM/PunchStatusWidget'),
    'Widgets/HRM/PendingLeaveApprovalsWidget': () => import('./HRM/PendingLeaveApprovalsWidget'),
    'Widgets/HRM/MyGoalsWidget': () => import('./HRM/MyGoalsWidget'),
    'Widgets/HRM/PendingReviewsWidget': () => import('./HRM/PendingReviewsWidget'),
    'Widgets/HRM/TeamAttendanceWidget': () => import('./HRM/TeamAttendanceWidget'),
    'Widgets/HRM/PayrollSummaryWidget': () => import('./HRM/PayrollSummaryWidget'),
    
    // RFI widgets
    'Widgets/RFI/PendingInspectionsWidget': () => import('./RFI/PendingInspectionsWidget'),
    'Widgets/RFI/MyRfiStatusWidget': () => import('./RFI/MyRfiStatusWidget'),
    'Widgets/RFI/OverdueRfisWidget': () => import('./RFI/OverdueRfisWidget'),
    
    // DMS widgets
    'Widgets/DMS/RecentDocumentsWidget': () => import('./DMS/RecentDocumentsWidget'),
    'Widgets/DMS/StorageUsageWidget': () => import('./DMS/StorageUsageWidget'),
    'Widgets/DMS/PendingApprovalsWidget': () => import('./DMS/PendingApprovalsWidget'),
    'Widgets/DMS/SharedWithMeWidget': () => import('./DMS/SharedWithMeWidget'),
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
