// DMS Widget exports
export { default as RecentDocumentsWidget } from './RecentDocumentsWidget';
export { default as StorageUsageWidget } from './StorageUsageWidget';
export { default as PendingApprovalsWidget } from './PendingApprovalsWidget';
export { default as SharedWithMeWidget } from './SharedWithMeWidget';

// DMS Widgets registry for dynamic loading
export const DMS_WIDGETS = {
    'Widgets/DMS/RecentDocumentsWidget': () => import('./RecentDocumentsWidget'),
    'Widgets/DMS/StorageUsageWidget': () => import('./StorageUsageWidget'),
    'Widgets/DMS/PendingApprovalsWidget': () => import('./PendingApprovalsWidget'),
    'Widgets/DMS/SharedWithMeWidget': () => import('./SharedWithMeWidget'),
};
