<?php

namespace Aero\Core\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Activity Chart Widget
 *
 * Shows 7-day activity trend chart.
 * This is a "lazy" widget because the query can be expensive.
 */
class ActivityChartWidget extends AbstractDashboardWidget
{
    protected string $position = 'main_left';

    protected int $order = 20;

    protected bool $lazy = true; // Load asynchronously

    protected array $span = ['cols' => 2, 'rows' => 1];

    public function getKey(): string
    {
        return 'core_activity_chart';
    }

    public function getComponent(): string
    {
        return 'Core/ActivityChart';
    }

    public function getTitle(): string
    {
        return 'Activity Overview';
    }

    public function getDescription(): string
    {
        return 'Last 7 days activity';
    }

    public function getData(): array
    {
        return $this->safeResolve(function () {
            $chartData = [];

            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dayLabel = $date->format('D');

                // User logins/activity
                $activity = 0;
                if (Schema::hasTable('audit_logs')) {
                    $activity = DB::table('audit_logs')
                        ->whereDate('created_at', $date->toDateString())
                        ->count();
                }

                // New users
                $newUsers = User::whereDate('created_at', $date->toDateString())->count();

                $chartData[] = [
                    'day' => $dayLabel,
                    'date' => $date->format('M j'),
                    'activity' => $activity,
                    'newUsers' => $newUsers,
                ];
            }

            return [
                'chartData' => $chartData,
                'period' => 'Last 7 days',
            ];
        }, ['chartData' => [], 'period' => 'Last 7 days']);
    }
}
