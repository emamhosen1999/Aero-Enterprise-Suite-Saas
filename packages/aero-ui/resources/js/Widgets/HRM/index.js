// HRM Widgets for Core Dashboard
export { default as MyLeaveBalanceWidget } from './MyLeaveBalanceWidget';

// Export widget registry for dynamic loading
export const HRM_WIDGETS = {
    'Widgets/HRM/MyLeaveBalanceWidget': () => import('./MyLeaveBalanceWidget'),
};
