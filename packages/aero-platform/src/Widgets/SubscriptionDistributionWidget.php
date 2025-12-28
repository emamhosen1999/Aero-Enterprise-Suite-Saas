<?php

declare(strict_types=1);

namespace Aero\Platform\Widgets;

use Aero\Core\Contracts\AbstractDashboardWidget;
use Aero\Core\Contracts\CoreWidgetCategory;
use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Subscription;
use Illuminate\Support\Facades\Cache;

/**
 * Subscription Distribution Widget for Admin Dashboard
 *
 * Displays breakdown of tenants by subscription plan.
 *
 * This is a SUMMARY widget - provides subscription analytics.
 */
class SubscriptionDistributionWidget extends AbstractDashboardWidget
{
    protected string $position = 'sidebar';

    protected int $order = 5;

    protected int|string $span = 1;

    protected CoreWidgetCategory $category = CoreWidgetCategory::SUMMARY;

    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'platform.subscription_distribution';
    }

    public function getComponent(): string
    {
        return 'Widgets/Platform/SubscriptionDistributionWidget';
    }

    public function getTitle(): string
    {
        return 'Subscription Distribution';
    }

    public function getDescription(): string
    {
        return 'Breakdown of subscriptions by plan';
    }

    public function getModuleCode(): string
    {
        return 'platform';
    }

    /**
     * Widget is enabled for platform admins.
     */
    public function isEnabled(): bool
    {
        return true;
    }

    /**
     * Get widget data for frontend.
     * Cached for 5 minutes.
     */
    public function getData(): array
    {
        return Cache::remember('platform.dashboard.subscription_distribution', 300, function () {
            return $this->calculateDistribution();
        });
    }

    /**
     * Calculate subscription distribution by plan.
     */
    protected function calculateDistribution(): array
    {
        $plans = Plan::withCount(['subscriptions' => function ($query) {
            $query->where('status', Subscription::STATUS_ACTIVE);
        }])
            ->orderBy('sort_order')
            ->get()
            ->map(function (Plan $plan) {
                $mrr = Subscription::where('plan_id', $plan->id)
                    ->where('status', Subscription::STATUS_ACTIVE)
                    ->sum('amount');

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'code' => $plan->code,
                    'count' => $plan->subscriptions_count,
                    'mrr' => (float) $mrr,
                    'price' => (float) $plan->monthly_price,
                    'color' => $this->getPlanColor($plan->code),
                ];
            })
            ->toArray();

        $totalCount = array_sum(array_column($plans, 'count'));
        $totalMrr = array_sum(array_column($plans, 'mrr'));

        return [
            'plans' => $plans,
            'totalCount' => $totalCount,
            'totalMrr' => round($totalMrr, 2),
        ];
    }

    /**
     * Get color for plan display.
     */
    protected function getPlanColor(?string $planCode): string
    {
        return match ($planCode) {
            'enterprise' => '#f59e0b',
            'professional' => '#8b5cf6',
            'growth' => '#0ea5e9',
            'starter' => '#94a3b8',
            default => '#6b7280',
        };
    }
}
