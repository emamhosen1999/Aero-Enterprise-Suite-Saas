<?php

declare(strict_types=1);

namespace Aero\Platform\Jobs;

use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Quotas\EnhancedQuotaEnforcementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Check Quota Limits Job
 *
 * Scheduled job to check all tenants' quota usage and send warnings:
 * - Runs hourly
 * - Checks all active tenants
 * - Sends escalated warnings based on usage:
 *   - 90%+: Daily email alerts
 *   - 95%+: Hourly email + SMS warnings
 *   - 99%+: Real-time critical alerts
 */
class CheckQuotaLimitsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(EnhancedQuotaEnforcementService $quotaService): void
    {
        Log::info('Starting quota limits check for all tenants');

        $tenants = Tenant::where('status', 'active')->get();
        $quotaTypes = ['users', 'storage_gb', 'api_calls_monthly', 'employees', 'projects'];

        $criticalCount = 0;
        $warningCount = 0;

        foreach ($tenants as $tenant) {
            foreach ($quotaTypes as $quotaType) {
                try {
                    $current = $quotaService->getCurrentUsage($tenant, str_replace('_monthly', '', str_replace('_gb', '', $quotaType)));
                    $limit = $quotaService->getQuotaLimit($tenant, str_replace('_monthly', '', str_replace('_gb', '', $quotaType)));

                    // Skip unlimited quotas
                    if ($limit === -1) {
                        continue;
                    }

                    $percentage = ($current / $limit) * 100;

                    // Critical level (99%+): Real-time alert
                    if ($percentage >= 99) {
                        $this->sendCriticalAlert($quotaService, $tenant, $quotaType, $percentage);
                        $criticalCount++;
                    }
                    // High level (95-98%): Hourly alert (only if this job runs hourly)
                    elseif ($percentage >= 95) {
                        $this->sendHighAlert($quotaService, $tenant, $quotaType, $percentage);
                        $criticalCount++;
                    }
                    // Warning level (90-94%): Daily alert (check if we sent one today)
                    elseif ($percentage >= 90) {
                        if (!$this->sentAlertToday($tenant, $quotaType)) {
                            $this->sendWarningAlert($quotaService, $tenant, $quotaType, $percentage);
                            $warningCount++;
                        }
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to check quota for tenant {$tenant->id}, type {$quotaType}: {$e->getMessage()}");
                }
            }
        }

        Log::info("Quota check complete: {$criticalCount} critical, {$warningCount} warnings sent");
    }

    /**
     * Send critical alert (99%+ usage).
     */
    protected function sendCriticalAlert(EnhancedQuotaEnforcementService $quotaService, Tenant $tenant, string $quotaType, float $percentage): void
    {
        Log::critical("CRITICAL: Tenant {$tenant->id} at {$percentage}% for {$quotaType}");
        
        // Create warning record
        $quotaService->getQuotaSummary($tenant); // This triggers internal warning creation
        
        // TODO: Send immediate notification via email + SMS
        // TODO: Alert super administrators
    }

    /**
     * Send high alert (95-98% usage).
     */
    protected function sendHighAlert(EnhancedQuotaEnforcementService $quotaService, Tenant $tenant, string $quotaType, float $percentage): void
    {
        Log::warning("HIGH: Tenant {$tenant->id} at {$percentage}% for {$quotaType}");
        
        // TODO: Send email + SMS notification
    }

    /**
     * Send warning alert (90-94% usage).
     */
    protected function sendWarningAlert(EnhancedQuotaEnforcementService $quotaService, Tenant $tenant, string $quotaType, float $percentage): void
    {
        Log::info("WARNING: Tenant {$tenant->id} at {$percentage}% for {$quotaType}");
        
        // TODO: Send email notification
    }

    /**
     * Check if we already sent an alert today for this tenant/quota.
     */
    protected function sentAlertToday(Tenant $tenant, string $quotaType): bool
    {
        return \Aero\Platform\Models\QuotaWarning::where('tenant_id', $tenant->id)
            ->where('quota_type', $quotaType)
            ->where('created_at', '>=', now()->startOfDay())
            ->exists();
    }
}
