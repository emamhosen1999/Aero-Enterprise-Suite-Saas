// HRM Widgets for Core Dashboard
export { default as MyLeaveBalanceWidget } from './MyLeaveBalanceWidget';
export { default as UpcomingHolidaysWidget } from './UpcomingHolidaysWidget';
export { default as OrganizationInfoWidget } from './OrganizationInfoWidget';
export { default as PunchStatusWidget } from './PunchStatusWidget';
export { default as PendingLeaveApprovalsWidget } from './PendingLeaveApprovalsWidget';
export { default as MyGoalsWidget } from './MyGoalsWidget';
export { default as PendingReviewsWidget } from './PendingReviewsWidget';
export { default as TeamAttendanceWidget } from './TeamAttendanceWidget';
export { default as PayrollSummaryWidget } from './PayrollSummaryWidget';

// Export widget registry for dynamic loading
export const HRM_WIDGETS = {
    'Widgets/HRM/MyLeaveBalanceWidget': () => import('./MyLeaveBalanceWidget'),
    'Widgets/HRM/UpcomingHolidaysWidget': () => import('./UpcomingHolidaysWidget'),
    'Widgets/HRM/OrganizationInfoWidget': () => import('./OrganizationInfoWidget'),
    'Widgets/HRM/PunchStatusWidget': () => import('./PunchStatusWidget'),
    'Widgets/HRM/PendingLeaveApprovalsWidget': () => import('./PendingLeaveApprovalsWidget'),
    'Widgets/HRM/MyGoalsWidget': () => import('./MyGoalsWidget'),
    'Widgets/HRM/PendingReviewsWidget': () => import('./PendingReviewsWidget'),
    'Widgets/HRM/TeamAttendanceWidget': () => import('./TeamAttendanceWidget'),
    'Widgets/HRM/PayrollSummaryWidget': () => import('./PayrollSummaryWidget'),
};
