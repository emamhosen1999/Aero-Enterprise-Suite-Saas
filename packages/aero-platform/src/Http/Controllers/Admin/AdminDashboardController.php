<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Admin;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Models\Subscription;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\PlatformWidgetRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin Dashboard Controller
 *
 * Main dashboard for the platform administration panel.
 * Aggregates widgets from Platform and provides real-time metrics.
 *
 * Using Platform's own widget registry:
 * - Uses PlatformWidgetRegistry for dynamic widgets (independent from Core)
 * - Provides API endpoints for lazy loading
 * - Caches expensive aggregations
 */
class AdminDashboardController extends Controller
{
    public function __construct(
        protected PlatformWidgetRegistry $widgetRegistry
    ) {}

    /**
     * Display the main admin dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::guard('landlord')->user();

        // Get platform stats (cached for performance)
        $stats = $this->getPlatformStats();

        // Get dynamic widgets from registry (from Platform + registered modules)
        // The registry handles lazy loading and permission checks
        $dynamicWidgets = $this->widgetRegistry->getWidgetsForFrontend();

        // Filter to only platform widgets for admin dashboard
        // Then key by widget key for easier frontend access
        $platformWidgets = collect($dynamicWidgets)
            ->filter(fn ($widget) => $widget['module'] === 'platform')
            ->keyBy('key')
            ->toArray();

        return Inertia::render('Platform/Admin/Dashboard', [
            'title' => 'Dashboard - Admin',
            'stats' => $stats,
            'dynamicWidgets' => $platformWidgets,
        ]);
    }

    /**
     * Get dashboard stats (for async loading).
     */
    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->getPlatformStats());
    }

    /**
     * Get widget data for a specific widget (for lazy loading).
     */
    public function widgetData(Request $request, string $widgetKey): JsonResponse
    {
        $widgets = $this->widgetRegistry->getWidgets();

        foreach ($widgets as $widget) {
            if ($widget->getKey() === $widgetKey) {
                return response()->json([
                    'key' => $widget->getKey(),
                    'data' => $widget->getData(),
                ]);
            }
        }

        return response()->json(['error' => 'Widget not found'], 404);
    }

    /**
     * Refresh dashboard cache.
     */
    public function refresh(Request $request): JsonResponse
    {
        // Clear cached stats
        Cache::forget('platform.dashboard.stats');
        Cache::forget('platform.dashboard.alerts');
        Cache::forget('platform.dashboard.subscription_distribution');

        return response()->json([
            'success' => true,
            'message' => 'Dashboard cache refreshed',
            'stats' => $this->getPlatformStats(),
        ]);
    }

    /**
     * Get platform statistics.
     * Cached for 5 minutes to reduce database load.
     */
    protected function getPlatformStats(): array
    {
        return Cache::remember('platform.dashboard.stats', 300, function () {
            return $this->calculatePlatformStats();
        });
    }

    /**
     * Calculate all platform statistics.
     */
    protected function calculatePlatformStats(): array
    {
        // Tenant statistics
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', Tenant::STATUS_ACTIVE)->count();
        $pendingTenants = Tenant::where('status', Tenant::STATUS_PENDING)->count();
        $suspendedTenants = Tenant::where('status', Tenant::STATUS_SUSPENDED)->count();
        $failedTenants = Tenant::where('status', Tenant::STATUS_FAILED)->count();
        $provisioningTenants = Tenant::where('status', Tenant::STATUS_PROVISIONING)->count();

        // Trial tenants
        $trialTenants = Tenant::where('status', Tenant::STATUS_ACTIVE)
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '>', now())
            ->count();

        // User statistics
        $totalAdmins = LandlordUser::count();
        $activeAdmins = LandlordUser::where('active', true)->count();

        // Revenue statistics
        $activeSubscriptions = Subscription::where('status', Subscription::STATUS_ACTIVE)->count();

        $monthlyMrr = Subscription::where('status', Subscription::STATUS_ACTIVE)
            ->where('billing_cycle', 'monthly')
            ->sum('amount');

        $yearlyMrr = Subscription::where('status', Subscription::STATUS_ACTIVE)
            ->where('billing_cycle', 'yearly')
            ->selectRaw('SUM(amount / 12) as mrr')
            ->value('mrr') ?? 0;

        $mrr = (float) $monthlyMrr + (float) $yearlyMrr;
        $arr = $mrr * 12;

        // Average revenue per tenant
        $arpt = $activeTenants > 0 ? $mrr / $activeTenants : 0;

        // Growth metrics
        $newThisMonth = Tenant::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $newThisWeek = Tenant::where('created_at', '>=', now()->startOfWeek())
            ->count();

        // Calculate churn rate (last 30 days)
        $cancelledLast30 = Subscription::where('status', Subscription::STATUS_CANCELLED)
            ->where('cancelled_at', '>=', now()->subDays(30))
            ->count();

        $activeAt30DaysAgo = Subscription::where('starts_at', '<=', now()->subDays(30))
            ->where(function ($q) {
                $q->whereNull('cancelled_at')
                    ->orWhere('cancelled_at', '>', now()->subDays(30));
            })
            ->count();

        $churnRate = $activeAt30DaysAgo > 0
            ? round(($cancelledLast30 / $activeAt30DaysAgo) * 100, 2)
            : 0;

        // System health indicators
        $systemStatus = 'operational';
        if ($failedTenants > 0 || $provisioningTenants > 5) {
            $systemStatus = 'degraded';
        }

        return [
            // Tenant metrics
            'totalTenants' => $totalTenants,
            'activeTenants' => $activeTenants,
            'pendingTenants' => $pendingTenants,
            'suspendedTenants' => $suspendedTenants,
            'failedTenants' => $failedTenants,
            'provisioningTenants' => $provisioningTenants,
            'trialTenants' => $trialTenants,

            // User metrics
            'totalAdmins' => $totalAdmins,
            'activeAdmins' => $activeAdmins,

            // Revenue metrics
            'activeSubscriptions' => $activeSubscriptions,
            'mrr' => round($mrr, 2),
            'arr' => round($arr, 2),
            'arpt' => round($arpt, 2),

            // Growth metrics
            'newThisMonth' => $newThisMonth,
            'newThisWeek' => $newThisWeek,
            'churnRate' => $churnRate,

            // System health
            'systemStatus' => $systemStatus,
            'uptime' => 99.98, // Would come from monitoring service

            // Formatted values for display
            'formatted' => [
                'mrr' => '$'.number_format($mrr / 1000, 1).'K',
                'arr' => '$'.number_format($arr / 1000000, 2).'M',
                'arpt' => '$'.number_format($arpt, 0),
            ],
        ];
    }
}
