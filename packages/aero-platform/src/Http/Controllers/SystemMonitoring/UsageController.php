<?php

namespace Aero\Platform\Http\Controllers\SystemMonitoring;

use Aero\Platform\Services\Billing\MeteredBillingService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UsageController extends Controller
{
    public function __construct(
        protected MeteredBillingService $billingService
    ) {}

    /**
     * Display usage dashboard.
     */
    public function index(): Response
    {
        $tenant = tenant();

        $summary = $this->billingService->getUsageSummary($tenant);

        // Get trends for key metrics
        $trends = [];
        foreach ([
            MeteredBillingService::METRIC_API_CALLS,
            MeteredBillingService::METRIC_STORAGE_GB,
            MeteredBillingService::METRIC_ACTIVE_USERS,
        ] as $metric) {
            $trends[$metric] = $this->billingService->getUsageTrend($tenant, $metric, 'daily', 30);
        }

        return Inertia::render('Settings/Usage', [
            'summary' => $summary,
            'trends' => $trends,
        ]);
    }

    /**
     * Get usage summary as JSON.
     */
    public function summary(Request $request): JsonResponse
    {
        $tenant = tenant();

        $summary = $this->billingService->getUsageSummary(
            $tenant,
            $request->input('start'),
            $request->input('end')
        );

        return response()->json($summary);
    }

    /**
     * Get usage trend for a specific metric.
     */
    public function trend(Request $request, string $metric): JsonResponse
    {
        $validated = $request->validate([
            'granularity' => 'in:hourly,daily,monthly',
            'periods' => 'integer|min:1|max:365',
        ]);

        $tenant = tenant();

        $trend = $this->billingService->getUsageTrend(
            $tenant,
            $metric,
            $validated['granularity'] ?? 'daily',
            $validated['periods'] ?? 30
        );

        return response()->json([
            'metric' => $metric,
            'data' => $trend,
        ]);
    }

    /**
     * Check if limit is exceeded for a metric.
     */
    public function checkLimit(string $metric): JsonResponse
    {
        $tenant = tenant();

        $exceeded = $this->billingService->hasExceededLimit($tenant, $metric);
        $remaining = $this->billingService->getRemainingAllowance($tenant, $metric);
        $current = $this->billingService->getCurrentUsage($tenant, $metric);

        return response()->json([
            'metric' => $metric,
            'exceeded' => $exceeded,
            'current_usage' => $current,
            'remaining' => $remaining,
            'is_unlimited' => $remaining === null,
        ]);
    }

    /**
     * Get all current usage limits and status.
     */
    public function limits(): JsonResponse
    {
        $tenant = tenant();

        $metrics = [
            MeteredBillingService::METRIC_API_CALLS,
            MeteredBillingService::METRIC_STORAGE_GB,
            MeteredBillingService::METRIC_EMAILS_SENT,
            MeteredBillingService::METRIC_SMS_SENT,
            MeteredBillingService::METRIC_ACTIVE_USERS,
            MeteredBillingService::METRIC_DOCUMENTS,
            MeteredBillingService::METRIC_PROJECTS,
            MeteredBillingService::METRIC_EMPLOYEES,
        ];

        $limits = [];
        foreach ($metrics as $metric) {
            $limits[$metric] = [
                'metric' => $metric,
                'current' => $this->billingService->getCurrentUsage($tenant, $metric),
                'remaining' => $this->billingService->getRemainingAllowance($tenant, $metric),
                'exceeded' => $this->billingService->hasExceededLimit($tenant, $metric),
            ];
        }

        return response()->json($limits);
    }
}
