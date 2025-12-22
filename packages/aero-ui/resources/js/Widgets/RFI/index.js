// RFI Widgets for Core Dashboard
export { default as PendingInspectionsWidget } from './PendingInspectionsWidget';
export { default as MyRfiStatusWidget } from './MyRfiStatusWidget';
export { default as OverdueRfisWidget } from './OverdueRfisWidget';

// Export widget registry for dynamic loading
export const RFI_WIDGETS = {
    'Widgets/RFI/PendingInspectionsWidget': () => import('./PendingInspectionsWidget'),
    'Widgets/RFI/MyRfiStatusWidget': () => import('./MyRfiStatusWidget'),
    'Widgets/RFI/OverdueRfisWidget': () => import('./OverdueRfisWidget'),
};
