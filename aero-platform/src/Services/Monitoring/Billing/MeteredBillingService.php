<?php

namespace Aero\Platform\Services\Monitoring\Billing;

use Aero\Platform\Models\Tenant;
use Aero\Platform\Models\UsageRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MeteredBillingService
{
    /**
     * Common metric names used throughout the application.
     */
    public const METRIC_API_CALLS = 'api_calls';

    public const METRIC_STORAGE_GB = 'storage_gb';

    public const METRIC_EMAILS_SENT = 'emails_sent';

    public const METRIC_SMS_SENT = 'sms_sent';

    public const METRIC_ACTIVE_USERS = 'active_users';

    public const METRIC_DOCUMENTS = 'documents';

    public const METRIC_PROJECTS = 'projects';

    public const METRIC_EMPLOYEES = 'employees';

    /**
     * Record usage for a metric.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function recordUsage(
        Tenant $tenant,
        string $metricName,
        float $quantity = 1.0,
        ?Model $attributable = null,
        array $metadata = []
    ): UsageRecord {
        $period = UsageRecord::getCurrentBillingPeriod();

        $record = UsageRecord::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $tenant->activeSubscription()?->id,
            'metric_name' => $metricName,
            'metric_type' => 'counter',
            'quantity' => $quantity,
            'unit' => $this->getMetricUnit($metricName),
            'billing_period_start' => $period['start'],
            'billing_period_end' => $period['end'],
            'attributable_type' => $attributable ? get_class($attributable) : null,
            'attributable_id' => $attributable?->getKey(),
            'metadata' => $metadata,
        ]);

        // Update cache for fast limit checking
        $this->updateUsageCache($tenant->id, $metricName, $quantity);

        // Check limits asynchronously
        dispatch(function () use ($tenant, $metricName) {
            $this->checkUsageLimits($tenant, $metricName);
        })->afterResponse();

        Log::debug('Usage recorded', [
            'tenant_id' => $tenant->id,
            'metric' => $metricName,
            'quantity' => $quantity,
        ]);

        return $record;
    }

    /**
     * Increment usage by a value (convenience method).
     */
    public function incrementUsage(
        Tenant $tenant,
        string $metricName,
        float $amount = 1.0,
        ?Model $attributable = null
    ): UsageRecord {
        return $this->recordUsage($tenant, $metricName, $amount, $attributable);
    }

    /**
     * Set absolute usage value (for gauges like storage).
     */
    public function setUsage(
        Tenant $tenant,
        string $metricName,
        float $value,
        ?Model $attributable = null
    ): UsageRecord {
        $period = UsageRecord::getCurrentBillingPeriod();

        $record = UsageRecord::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $tenant->activeSubscription()?->id,
            'metric_name' => $metricName,
            'metric_type' => 'gauge',
            'quantity' => $value,
            'unit' => $this->getMetricUnit($metricName),
            'billing_period_start' => $period['start'],
            'billing_period_end' => $period['end'],
            'attributable_type' => $attributable ? get_class($attributable) : null,
            'attributable_id' => $attributable?->getKey(),
        ]);

        // For gauges, set the cache to the absolute value
        $this->setUsageCache($tenant->id, $metricName, $value);

        return $record;
    }

    /**
     * Get total usage for a metric in the current billing period.
     */
    public function getCurrentUsage(Tenant $tenant, string $metricName): float
    {
        $cacheKey = $this->getUsageCacheKey($tenant->id, $metricName);

        return Cache::get($cacheKey, function () use ($tenant, $metricName) {
            $period = UsageRecord::getCurrentBillingPeriod();

            return (float) UsageRecord::forTenant($tenant->id)
                ->forMetric($metricName)
                ->inPeriod($period['start'], $period['end'])
                ->sum('quantity');
        });
    }

    /**
     * Get usage summary for a tenant.
     *
     * @return array<string, mixed>
     */
    public function getUsageSummary(Tenant $tenant, ?string $periodStart = null, ?string $periodEnd = null): array
    {
        $start = $periodStart ? now()->parse($periodStart) : now()->startOfMonth();
        $end = $periodEnd ? now()->parse($periodEnd) : now()->endOfMonth();

        $usageByMetric = UsageRecord::forTenant($tenant->id)
            ->whereBetween('created_at', [$start, $end])
            ->select('metric_name', DB::raw('SUM(quantity) as total'), DB::raw('COUNT(*) as records'))
            ->groupBy('metric_name')
            ->get()
            ->keyBy('metric_name')
            ->toArray();

        // Get limits for comparison
        $limits = $this->getTenantLimits($tenant);

        $summary = [];
        foreach ($usageByMetric as $metric => $data) {
            $limit = $limits[$metric] ?? null;
            $summary[$metric] = [
                'metric' => $metric,
                'total' => (float) $data['total'],
                'records' => (int) $data['records'],
                'unit' => $this->getMetricUnit($metric),
                'limit' => $limit?->limit_value,
                'usage_percent' => $limit ? round(($data['total'] / $limit->limit_value) * 100, 2) : null,
                'remaining' => $limit ? max(0, $limit->limit_value - $data['total']) : null,
            ];
        }

        return [
            'period_start' => $start->toDateString(),
            'period_end' => $end->toDateString(),
            'metrics' => $summary,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Get usage trend over time.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getUsageTrend(
        Tenant $tenant,
        string $metricName,
        string $granularity = 'daily',
        int $periods = 30
    ): array {
        $query = UsageRecord::forTenant($tenant->id)
            ->forMetric($metricName);

        if ($granularity === 'daily') {
            $query->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(quantity) as total')
            )
                ->where('created_at', '>=', now()->subDays($periods))
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date');
        } elseif ($granularity === 'monthly') {
            $query->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(quantity) as total')
            )
                ->where('created_at', '>=', now()->subMonths($periods))
                ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
                ->orderBy('month');
        } else {
            $query->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00") as hour'),
                DB::raw('SUM(quantity) as total')
            )
                ->where('created_at', '>=', now()->subHours($periods))
                ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00")'))
                ->orderBy('hour');
        }

        return $query->get()->toArray();
    }

    /**
     * Check if tenant has exceeded their usage limit.
     */
    public function hasExceededLimit(Tenant $tenant, string $metricName): bool
    {
        $limit = $this->getLimit($tenant, $metricName);

        if (! $limit) {
            return false;
        }

        $currentUsage = $this->getCurrentUsage($tenant, $metricName);

        return $currentUsage >= $limit->limit_value;
    }

    /**
     * Get remaining allowance for a metric.
     */
    public function getRemainingAllowance(Tenant $tenant, string $metricName): ?float
    {
        $limit = $this->getLimit($tenant, $metricName);

        if (! $limit) {
            return null; // Unlimited
        }

        $currentUsage = $this->getCurrentUsage($tenant, $metricName);

        return max(0, $limit->limit_value - $currentUsage);
    }

    /**
     * Report usage to Stripe for metered billing.
     */
    public function reportToStripe(Tenant $tenant, string $metricName): int
    {
        $subscription = $tenant->activeSubscription();

        if (! $subscription || ! $subscription->stripe_id) {
            Log::warning('Cannot report to Stripe: no active subscription', [
                'tenant_id' => $tenant->id,
            ]);

            return 0;
        }

        $unreportedRecords = UsageRecord::forTenant($tenant->id)
            ->forMetric($metricName)
            ->unreported()
            ->get();

        if ($unreportedRecords->isEmpty()) {
            return 0;
        }

        $totalQuantity = $unreportedRecords->sum('quantity');

        try {
            // Find the subscription item for this metric
            $subscriptionItem = $subscription->items()
                ->where('stripe_product', 'like', "%{$metricName}%")
                ->first();

            if (! $subscriptionItem) {
                Log::warning('No subscription item found for metric', [
                    'tenant_id' => $tenant->id,
                    'metric' => $metricName,
                ]);

                return 0;
            }

            // Report to Stripe (using Laravel Cashier)
            $subscriptionItem->reportUsage((int) ceil($totalQuantity));

            // Mark records as reported
            UsageRecord::whereIn('id', $unreportedRecords->pluck('id'))
                ->update([
                    'reported_to_stripe' => true,
                    'reported_at' => now(),
                ]);

            Log::info('Usage reported to Stripe', [
                'tenant_id' => $tenant->id,
                'metric' => $metricName,
                'quantity' => $totalQuantity,
                'records' => $unreportedRecords->count(),
            ]);

            return $unreportedRecords->count();
        } catch (\Exception $e) {
            Log::error('Failed to report usage to Stripe', [
                'tenant_id' => $tenant->id,
                'metric' => $metricName,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Get usage limit for a metric (tenant-specific or from plan).
     */
    protected function getLimit(Tenant $tenant, string $metricName)
    {
        // First check tenant-specific limits
        $tenantLimit = DB::table('usage_limits')
            ->where('tenant_id', $tenant->id)
            ->where('metric_name', $metricName)
            ->where('is_active', true)
            ->first();

        if ($tenantLimit) {
            return $tenantLimit;
        }

        // Fall back to plan limits
        $planId = $tenant->activeSubscription()?->plan_id;

        if ($planId) {
            return DB::table('usage_limits')
                ->where('plan_id', $planId)
                ->where('metric_name', $metricName)
                ->where('is_active', true)
                ->first();
        }

        return null;
    }

    /**
     * Get all limits for a tenant.
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getTenantLimits(Tenant $tenant)
    {
        $planId = $tenant->activeSubscription()?->plan_id;

        // Get tenant-specific limits
        $tenantLimits = DB::table('usage_limits')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get()
            ->keyBy('metric_name');

        // Get plan limits
        $planLimits = collect();
        if ($planId) {
            $planLimits = DB::table('usage_limits')
                ->where('plan_id', $planId)
                ->where('is_active', true)
                ->get()
                ->keyBy('metric_name');
        }

        // Merge (tenant limits override plan limits)
        return $planLimits->merge($tenantLimits);
    }

    /**
     * Check usage against limits and create alerts if needed.
     */
    protected function checkUsageLimits(Tenant $tenant, string $metricName): void
    {
        $limit = $this->getLimit($tenant, $metricName);

        if (! $limit) {
            return;
        }

        $currentUsage = $this->getCurrentUsage($tenant, $metricName);
        $percentUsed = ($currentUsage / $limit->limit_value) * 100;

        // Check if we need to create alerts
        $thresholds = [50, 75, 90, 100];

        foreach ($thresholds as $threshold) {
            if ($percentUsed >= $threshold) {
                $this->createAlertIfNeeded($tenant, $limit, $metricName, $threshold, $currentUsage);
            }
        }
    }

    /**
     * Create usage alert if one doesn't exist for this threshold.
     */
    protected function createAlertIfNeeded(
        Tenant $tenant,
        $limit,
        string $metricName,
        int $threshold,
        float $currentUsage
    ): void {
        $alertType = $threshold >= 100 ? 'limit_reached' : 'approaching_limit';

        // Check if alert already exists for this threshold this period
        $period = UsageRecord::getCurrentBillingPeriod();

        $existingAlert = DB::table('usage_alerts')
            ->where('tenant_id', $tenant->id)
            ->where('metric_name', $metricName)
            ->where('threshold_percent', $threshold)
            ->whereBetween('created_at', [$period['start'], $period['end']])
            ->exists();

        if ($existingAlert) {
            return;
        }

        // Create alert
        DB::table('usage_alerts')->insert([
            'id' => Str::uuid(),
            'tenant_id' => $tenant->id,
            'usage_limit_id' => $limit->id,
            'metric_name' => $metricName,
            'alert_type' => $alertType,
            'threshold_percent' => $threshold,
            'current_usage' => $currentUsage,
            'limit_value' => $limit->limit_value,
            'notification_sent' => false,
            'acknowledged' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Log::info('Usage alert created', [
            'tenant_id' => $tenant->id,
            'metric' => $metricName,
            'threshold' => $threshold,
            'usage' => $currentUsage,
            'limit' => $limit->limit_value,
        ]);
    }

    /**
     * Get the unit for a metric.
     */
    protected function getMetricUnit(string $metricName): string
    {
        return match ($metricName) {
            self::METRIC_API_CALLS => 'calls',
            self::METRIC_STORAGE_GB => 'GB',
            self::METRIC_EMAILS_SENT => 'emails',
            self::METRIC_SMS_SENT => 'messages',
            self::METRIC_ACTIVE_USERS => 'users',
            self::METRIC_DOCUMENTS => 'documents',
            self::METRIC_PROJECTS => 'projects',
            self::METRIC_EMPLOYEES => 'employees',
            default => 'units',
        };
    }

    /**
     * Get cache key for usage.
     */
    protected function getUsageCacheKey(string $tenantId, string $metricName): string
    {
        $period = UsageRecord::getCurrentBillingPeriod();

        return "usage:{$tenantId}:{$metricName}:{$period['start']->format('Y-m')}";
    }

    /**
     * Update cached usage value.
     */
    protected function updateUsageCache(string $tenantId, string $metricName, float $increment): void
    {
        $key = $this->getUsageCacheKey($tenantId, $metricName);
        $current = Cache::get($key, 0);
        Cache::put($key, $current + $increment, now()->endOfMonth());
    }

    /**
     * Set absolute cached usage value.
     */
    protected function setUsageCache(string $tenantId, string $metricName, float $value): void
    {
        $key = $this->getUsageCacheKey($tenantId, $metricName);
        Cache::put($key, $value, now()->endOfMonth());
    }
}
