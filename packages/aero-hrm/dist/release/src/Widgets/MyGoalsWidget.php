<?php

declare(strict_types=1);

namespace Aero\HRM\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;

/**
 * My Goals Widget
 *
 * Displays the user's active goals and OKR progress.
 */
class MyGoalsWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';
    protected int $order = 85;
    protected int|string $span = 1;
    protected CoreWidgetCategory $category = CoreWidgetCategory::ACTION;
    protected array $requiredPermissions = ['hrm.performance.goals.view'];

    public function getKey(): string
    {
        return 'hrm.my_goals';
    }

    public function getComponent(): string
    {
        return 'Widgets/HRM/MyGoalsWidget';
    }

    public function getTitle(): string
    {
        return 'My Goals';
    }

    public function getDescription(): string
    {
        return 'Your active goals and OKR progress';
    }

    public function getModuleCode(): string
    {
        return 'hrm';
    }

    public function getData(): array
    {
        $user = auth()->user();
        
        if (!$user) {
            return [
                'goals' => [],
                'total_goals' => 0,
                'on_track' => 0,
                'at_risk' => 0,
                'behind' => 0,
            ];
        }

        // In production, query from Goal model
        return [
            'goals' => [],
            'total_goals' => 0,
            'on_track' => 0,
            'at_risk' => 0,
            'behind' => 0,
            'average_progress' => 0,
        ];
    }

    public function getProps(): array
    {
        return array_merge($this->getData(), [
            'title' => $this->getTitle(),
            'view_all_url' => route('hrm.goals.index', [], false),
        ]);
    }

    public function isEnabled(): bool
    {
        return true;
    }

    public function getPriority(): int
    {
        return 85;
    }
}
