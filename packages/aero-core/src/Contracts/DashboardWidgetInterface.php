<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

/**
 * Dashboard Widget Interface
 *
 * All dashboard widgets must implement this interface.
 * Modules register their widgets with the DashboardWidgetRegistry.
 *
 * IMPORTANT DISTINCTION:
 * ----------------------
 * This interface is for widgets that appear on the CORE DASHBOARD (/dashboard).
 * These are summary/action widgets, not detailed analytics.
 *
 * For module-specific dashboards (e.g., /hrm/dashboard), modules render
 * their own components directly without using this registry.
 *
 * CORE DASHBOARD WIDGETS should be:
 * - ACTION: User needs to do something (punch in, approve leave)
 * - ALERT: Something needs attention (pending approvals, overdue tasks)
 * - SUMMARY: Quick counts/stats (leave balance, team attendance)
 * - NAVIGATION: Links to features (quick actions, modules)
 * - FEED: Activity streams (recent activity, announcements)
 *
 * MODULE DASHBOARD stays in the module and includes:
 * - Detailed charts and analytics
 * - Data tables and listings
 * - Calendar views
 * - Full reports
 *
 * Example implementation:
 * ```php
 * class PunchStatusWidget extends AbstractDashboardWidget
 * {
 *     protected string $position = 'main_left';
 *     protected int $order = 10;
 *     protected array $requiredPermissions = ['attendance.own.punch'];
 *
 *     public function getKey(): string { return 'hrm.punch_status'; }
 *     public function getComponent(): string { return 'HRM/Widgets/PunchStatus'; }
 *     public function getTitle(): string { return 'Clock In/Out'; }
 *     public function getModuleCode(): string { return 'hrm'; }
 *     public function getCategory(): CoreWidgetCategory { return CoreWidgetCategory::ACTION; }
 *     public function getData(): array { return $this->getPunchData(); }
 * }
 * ```
 */
interface DashboardWidgetInterface
{
    /**
     * Unique widget key (e.g., 'hrm.punch_status', 'rfi.daily_stats').
     */
    public function getKey(): string;

    /**
     * React component path relative to Widgets directory.
     * Example: 'HRM/Widgets/PunchStatus' or 'RFI/Widgets/DailyWorkStats'
     */
    public function getComponent(): string;

    /**
     * Widget title for display.
     */
    public function getTitle(): string;

    /**
     * Optional description.
     */
    public function getDescription(): string;

    /**
     * Widget category - determines what type of widget this is.
     * Core Dashboard only accepts ACTION, ALERT, SUMMARY, NAVIGATION, FEED.
     */
    public function getCategory(): CoreWidgetCategory;

    /**
     * Dashboard position where widget should appear.
     * Options: 'welcome', 'stats_row', 'main_left', 'main_right', 'sidebar', 'full_width'
     */
    public function getPosition(): string;

    /**
     * Sort order within position (lower = first).
     */
    public function getOrder(): int;

    /**
     * Grid span for responsive layout.
     * Options: 1, 2, 3, 4 (columns) or 'full'
     */
    public function getSpan(): int|string;

    /**
     * Whether widget should be lazy-loaded (deferred props).
     * Use for expensive data fetching.
     */
    public function isLazy(): bool;

    /**
     * Whether widget is enabled for current user/context.
     * Check permissions, module status, user roles, etc.
     */
    public function isEnabled(): bool;

    /**
     * Widget data to pass to the React component.
     */
    public function getData(): array;

    /**
     * Module code this widget belongs to (e.g., 'hrm', 'rfi', 'core').
     */
    public function getModuleCode(): string;

    /**
     * Required permissions to view this widget (any of these).
     * Empty array means no permission required.
     */
    public function getRequiredPermissions(): array;
}
