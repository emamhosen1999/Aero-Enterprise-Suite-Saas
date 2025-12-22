<?php

namespace Aero\Core\Contracts;

/**
 * Dashboard Widget Contract
 *
 * Defines the structure for modular dashboard widgets.
 * Each module can implement this interface to contribute
 * their own widgets to the dashboard without tight coupling.
 *
 * Think of this as the "plug shape" - any module that wants
 * to be on the dashboard must obey these rules.
 */
interface DashboardWidget
{
    /**
     * Unique identifier for the widget.
     *
     * Examples: 'core_user_stats', 'hrm_employee_count', 'finance_revenue'
     */
    public function getKey(): string;

    /**
     * The name of the React component to render.
     *
     * This corresponds to the widget component in the aero-ui package.
     * Examples: 'Core/StatsCard', 'Hrm/EmployeeStats', 'Finance/RevenueChart'
     */
    public function getComponent(): string;

    /**
     * Where on the dashboard grid does this widget appear?
     *
     * Positions: 'stats_row', 'main_left', 'main_right', 'sidebar', 'full_width'
     */
    public function getPosition(): string;

    /**
     * The sorting order within the position (lower numbers = first).
     */
    public function getOrder(): int;

    /**
     * The grid span configuration.
     *
     * Returns: ['cols' => 1, 'rows' => 1] or ['cols' => 2, 'rows' => 1]
     */
    public function getSpan(): array;

    /**
     * Should this widget be loaded lazily (async)?
     *
     * Use true for expensive queries (charts, aggregations).
     * Use false for quick stats that should load immediately.
     */
    public function isLazy(): bool;

    /**
     * The actual data to pass to the frontend component.
     *
     * Return an array of props for the React component.
     * This method should handle its own try/catch for resilience.
     */
    public function getData(): array;

    /**
     * Whether this widget is currently enabled/visible.
     *
     * Can be based on permissions, feature flags, or module status.
     */
    public function isEnabled(): bool;

    /**
     * Get the widget title for display.
     */
    public function getTitle(): string;

    /**
     * Get the widget description/subtitle.
     */
    public function getDescription(): string;
}
