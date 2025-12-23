<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

/**
 * Core Dashboard Widget Category
 *
 * Widgets registered to the Core Dashboard MUST be one of these types.
 * This ensures the main dashboard stays focused on "what needs attention"
 * rather than becoming cluttered with detailed analytics.
 *
 * GUIDELINE:
 * ----------
 * - Core Dashboard = "What do I need to do today?"
 * - Module Dashboard = "Let me analyze this area in detail"
 */
enum CoreWidgetCategory: string
{
    /**
     * ACTION - User needs to take an action
     *
     * Examples:
     * - PunchStatus: Clock in/out button
     * - ApprovalQueue: Approve pending requests
     * - QuickCreate: Create new record buttons
     */
    case ACTION = 'action';

    /**
     * ALERT - Something needs immediate attention
     *
     * Examples:
     * - PendingApprovals: X leaves waiting for approval
     * - OverdueTasks: X tasks past due date
     * - LowStock: Items below reorder point
     * - ExpiringContracts: Contracts expiring soon
     */
    case ALERT = 'alert';

    /**
     * SUMMARY - Quick count or status indicator
     *
     * Examples:
     * - MyLeaveBalance: 12 days remaining
     * - TodayAttendance: 45/50 present
     * - ActiveProjects: 8 projects in progress
     * - OpenTickets: 23 support tickets
     *
     * NOTE: No charts/graphs - just numbers with context
     */
    case SUMMARY = 'summary';

    /**
     * NAVIGATION - Quick link to module features
     *
     * Examples:
     * - Products: Shows enabled modules with links
     * - QuickActions: Common task shortcuts
     * - RecentlyVisited: Recent pages
     */
    case NAVIGATION = 'navigation';

    /**
     * FEED - Activity or notification feed
     *
     * Examples:
     * - RecentActivity: Latest system events
     * - Announcements: Company announcements
     * - Mentions: Where user was mentioned
     */
    case FEED = 'feed';

    /**
     * DISPLAY - Informational display widget
     *
     * Examples:
     * - Welcome: Greeting and date display
     * - ActiveModules: Shows available modules
     * - SystemInfo: System information display
     */
    case DISPLAY = 'display';

    /**
     * Check if this category is suitable for Core Dashboard.
     * All categories in this enum are valid for Core.
     */
    public function isValidForCoreDashboard(): bool
    {
        return true; // All categories in this enum are valid
    }

    /**
     * Get display label for the category.
     */
    public function getLabel(): string
    {
        return match ($this) {
            self::ACTION => 'Action Required',
            self::ALERT => 'Alerts',
            self::SUMMARY => 'Quick Stats',
            self::NAVIGATION => 'Navigation',
            self::FEED => 'Activity Feed',
            self::DISPLAY => 'Information',
        };
    }

    /**
     * Get recommended position on dashboard.
     */
    public function getRecommendedPosition(): string
    {
        return match ($this) {
            self::ACTION => 'main_left',
            self::ALERT => 'sidebar',
            self::SUMMARY => 'stats_row',
            self::NAVIGATION => 'main_left',
            self::FEED => 'main_right',
            self::DISPLAY => 'welcome',
        };
    }
}
