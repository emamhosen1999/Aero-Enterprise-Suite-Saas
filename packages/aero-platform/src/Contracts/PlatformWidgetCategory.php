<?php

declare(strict_types=1);

namespace Aero\Platform\Contracts;

/**
 * Platform Dashboard Widget Category
 *
 * Platform-specific widget categories for the admin dashboard.
 * Independent from Core's widget system to maintain package separation.
 */
enum PlatformWidgetCategory: string
{
    /**
     * ACTION - Admin needs to take an action
     *
     * Examples:
     * - QuickActions: Common admin shortcuts
     * - PendingApprovals: Approve tenant requests
     */
    case ACTION = 'action';

    /**
     * ALERT - Something needs immediate attention
     *
     * Examples:
     * - SystemAlerts: Critical system notifications
     * - FailedProvisioning: Tenants that failed to provision
     */
    case ALERT = 'alert';

    /**
     * SUMMARY - Quick count or status indicator
     *
     * Examples:
     * - PlatformStats: Total tenants, revenue
     * - SubscriptionDistribution: Plan breakdown
     * - BillingOverview: Revenue metrics
     * - ModuleUsage: Module adoption stats
     */
    case SUMMARY = 'summary';

    /**
     * DISPLAY - Informational display widget
     *
     * Examples:
     * - PlatformWelcome: Admin greeting
     * - RecentTenants: Latest tenant signups
     */
    case DISPLAY = 'display';

    /**
     * ACTIVITY - Activity or event feed
     *
     * Examples:
     * - RecentActivity: Latest platform events
     * - AuditLog: Recent admin actions
     */
    case ACTIVITY = 'activity';

    /**
     * MONITORING - System health and performance
     *
     * Examples:
     * - SystemHealth: Server status, queue health
     * - PerformanceMetrics: Response times, error rates
     */
    case MONITORING = 'monitoring';

    /**
     * ANALYTICS - Usage patterns and trends
     *
     * Examples:
     * - TenantGrowth: Signup trends over time
     * - RevenueChart: MRR/ARR visualization
     */
    case ANALYTICS = 'analytics';

    /**
     * Get display label for the category.
     */
    public function getLabel(): string
    {
        return match ($this) {
            self::ACTION => 'Quick Actions',
            self::ALERT => 'Alerts',
            self::SUMMARY => 'Statistics',
            self::DISPLAY => 'Information',
            self::ACTIVITY => 'Activity Feed',
            self::MONITORING => 'System Health',
            self::ANALYTICS => 'Analytics',
        };
    }

    /**
     * Get recommended position on admin dashboard.
     */
    public function getRecommendedPosition(): string
    {
        return match ($this) {
            self::ACTION => 'sidebar',
            self::ALERT => 'sidebar',
            self::SUMMARY => 'stats_row',
            self::DISPLAY => 'welcome',
            self::ACTIVITY => 'main_right',
            self::MONITORING => 'main_left',
            self::ANALYTICS => 'main_left',
        };
    }
}
