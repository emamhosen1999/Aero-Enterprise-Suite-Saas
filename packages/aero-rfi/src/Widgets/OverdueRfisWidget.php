<?php

declare(strict_types=1);

namespace Aero\Rfi\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Aero\Rfi\Models\DailyWork;

/**
 * Overdue RFIs Widget for Core Dashboard
 *
 * Shows count of RFIs that are overdue (past planned completion).
 * This is an ALERT widget - needs urgent attention.
 *
 * Appears on: Core Dashboard (/dashboard) for managers
 */
class OverdueRfisWidget extends AbstractDashboardWidget
{
    protected string $position = 'sidebar';
    protected int $order = 20;
    protected int|string $span = 1;
    protected CoreWidgetCategory $category = CoreWidgetCategory::ALERT;
    protected array $requiredPermissions = ['rfi.manage'];

    public function getKey(): string
    {
        return 'rfi.overdue';
    }

    public function getComponent(): string
    {
        return 'Widgets/RFI/OverdueRfisWidget';
    }

    public function getTitle(): string
    {
        return 'Overdue RFIs';
    }

    public function getDescription(): string
    {
        return 'RFIs past their planned completion';
    }

    public function getModuleCode(): string
    {
        return 'rfi';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            // Overdue = status not completed and date is in the past
            $overdueQuery = DailyWork::whereNotIn('status', [
                    DailyWork::STATUS_COMPLETED,
                    DailyWork::STATUS_REJECTED,
                ])
                ->whereDate('date', '<', today());

            $overdueCount = $overdueQuery->count();

            // Critical = more than 3 days overdue
            $criticalCount = (clone $overdueQuery)
                ->whereDate('date', '<', today()->subDays(3))
                ->count();

            // Get oldest overdue items
            $overdueItems = (clone $overdueQuery)
                ->orderBy('date', 'asc')
                ->take(5)
                ->get(['id', 'number', 'type', 'status', 'date', 'location']);

            return [
                'count' => $overdueCount,
                'critical' => $criticalCount,
                'items' => $overdueItems->map(fn ($item) => [
                    'id' => $item->id,
                    'number' => $item->number,
                    'type' => $item->type,
                    'status' => $item->status,
                    'location' => $item->location,
                    'daysOverdue' => now()->diffInDays($item->date),
                ])->toArray(),
            ];
        }, ['count' => 0, 'critical' => 0, 'items' => []]);
    }
}
