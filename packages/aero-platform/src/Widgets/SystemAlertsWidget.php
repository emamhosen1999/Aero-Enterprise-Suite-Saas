<?php

declare(strict_types=1);

namespace Aero\Platform\Widgets;

use Aero\Platform\Contracts\AbstractPlatformWidget;
use Aero\Platform\Contracts\PlatformWidgetCategory;
use Aero\Platform\Models\ErrorLog;
use Aero\Platform\Models\Subscription;
use Aero\Platform\Models\Tenant;
use Illuminate\Support\Facades\Cache;

/**
 * System Alerts Widget for Admin Dashboard
 *
 * Displays active alerts that require attention:
 * - Failed tenant provisioning
 * - Payment failures
 * - System errors
 * - Quota warnings
 *
 * This is an ALERT widget - requires attention.
 */
class SystemAlertsWidget extends AbstractPlatformWidget
{
    protected string $position = 'sidebar';

    protected int $order = 1;

    protected int|string $span = 1;

    protected PlatformWidgetCategory $category = PlatformWidgetCategory::ALERT;

    protected array $requiredPermissions = [];

    public function getKey(): string
    {
        return 'platform.system_alerts';
    }

    public function getComponent(): string
    {
        return 'Widgets/Platform/SystemAlertsWidget';
    }

    public function getTitle(): string
    {
        return 'System Alerts';
    }

    public function getDescription(): string
    {
        return 'Active issues requiring attention';
    }

    public function getModuleCode(): string
    {
        return 'platform';
    }

    /**
     * Widget is enabled when there are alerts.
     */
    public function isEnabled(): bool
    {
        return true;
    }

    /**
     * Get widget data for frontend.
     * Cached for 1 minute.
     */
    public function getData(): array
    {
        return Cache::remember('platform.dashboard.alerts', 60, function () {
            return $this->collectAlerts();
        });
    }

    /**
     * Collect all active alerts.
     */
    protected function collectAlerts(): array
    {
        $alerts = [];

        // Failed tenant provisioning
        $failedTenants = Tenant::where('status', Tenant::STATUS_FAILED)->count();
        if ($failedTenants > 0) {
            $alerts[] = [
                'id' => 'failed_provisioning',
                'severity' => 'critical',
                'title' => 'Failed Tenant Provisioning',
                'description' => "{$failedTenants} tenant(s) failed during provisioning",
                'count' => $failedTenants,
                'href' => '/admin/tenants?status=failed',
            ];
        }

        // Tenants stuck in provisioning
        $stuckProvisioning = Tenant::where('status', Tenant::STATUS_PROVISIONING)
            ->where('updated_at', '<', now()->subMinutes(15))
            ->count();
        if ($stuckProvisioning > 0) {
            $alerts[] = [
                'id' => 'stuck_provisioning',
                'severity' => 'warning',
                'title' => 'Provisioning Timeout',
                'description' => "{$stuckProvisioning} tenant(s) stuck in provisioning",
                'count' => $stuckProvisioning,
                'href' => '/admin/tenants?status=provisioning',
            ];
        }

        // Past due subscriptions
        $pastDueSubscriptions = Subscription::where('status', Subscription::STATUS_PAST_DUE)->count();
        if ($pastDueSubscriptions > 0) {
            $alerts[] = [
                'id' => 'past_due',
                'severity' => 'warning',
                'title' => 'Past Due Payments',
                'description' => "{$pastDueSubscriptions} subscription(s) with past due payments",
                'count' => $pastDueSubscriptions,
                'href' => '/admin/billing?status=past_due',
            ];
        }

        // Suspended tenants
        $suspendedTenants = Tenant::where('status', Tenant::STATUS_SUSPENDED)->count();
        if ($suspendedTenants > 0) {
            $alerts[] = [
                'id' => 'suspended',
                'severity' => 'info',
                'title' => 'Suspended Tenants',
                'description' => "{$suspendedTenants} tenant(s) currently suspended",
                'count' => $suspendedTenants,
                'href' => '/admin/tenants?status=suspended',
            ];
        }

        // Recent error logs (last 24 hours)
        try {
            if (class_exists(ErrorLog::class)) {
                $recentErrors = ErrorLog::where('created_at', '>=', now()->subDay())
                    ->where('level', 'error')
                    ->count();
                if ($recentErrors > 0) {
                    $alerts[] = [
                        'id' => 'error_logs',
                        'severity' => $recentErrors > 50 ? 'critical' : 'warning',
                        'title' => 'System Errors',
                        'description' => "{$recentErrors} error(s) in the last 24 hours",
                        'count' => $recentErrors,
                        'href' => '/admin/logs/errors',
                    ];
                }
            }
        } catch (\Exception $e) {
            // ErrorLog table might not exist
        }

        return [
            'alerts' => $alerts,
            'totalCount' => count($alerts),
            'hasCritical' => collect($alerts)->where('severity', 'critical')->isNotEmpty(),
        ];
    }
}
