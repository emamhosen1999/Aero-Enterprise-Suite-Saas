<?php

declare(strict_types=1);

namespace Aero\Platform\Services;

use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Subscription;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\PlanEntitlementService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Subscription Lifecycle Service
 * 
 * Handles upgrade/downgrade workflows with grace periods,
 * cancellation policies, and prorated billing.
 */
class SubscriptionLifecycleService
{
    /**
     * Upgrade subscription to a higher plan.
     */
    public function upgrade(Subscription $subscription, Plan $newPlan): Subscription
    {
        DB::beginTransaction();

        try {
            $oldPlan = $subscription->plan;

            // Calculate prorated amount if upgrading mid-cycle
            $proratedAmount = $this->calculateProratedAmount(
                $subscription,
                $oldPlan,
                $newPlan
            );

            // Update subscription
            $subscription->update([
                'plan_id' => $newPlan->id,
                'upgraded_from_plan_id' => $oldPlan->id,
                'upgraded_at' => now(),
                'next_billing_date' => $this->calculateNextBillingDate($newPlan),
            ]);

            // Log the upgrade
            Log::info('Subscription upgraded', [
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'old_plan' => $oldPlan->name,
                'new_plan' => $newPlan->name,
                'prorated_amount' => $proratedAmount,
            ]);

            DB::commit();

            $this->reconcileTenantModules($subscription->fresh(), $newPlan);

            return $subscription->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Downgrade subscription with grace period.
     */
    public function downgrade(Subscription $subscription, Plan $newPlan): Subscription
    {
        DB::beginTransaction();

        try {
            $oldPlan = $subscription->plan;
            $downgradePolicyValue = $oldPlan->downgrade_policy ?? 'end_of_period';

            // Apply downgrade policy
            match ($downgradePolicyValue) {
                'immediate' => $this->applyImmediateDowngrade($subscription, $newPlan, $oldPlan),
                'end_of_period' => $this->applyEndOfPeriodDowngrade($subscription, $newPlan, $oldPlan),
                'grace_period' => $this->applyGracePeriodDowngrade($subscription, $newPlan, $oldPlan),
                default => $this->applyEndOfPeriodDowngrade($subscription, $newPlan, $oldPlan),
            };

            Log::info('Subscription downgraded', [
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'old_plan' => $oldPlan->name,
                'new_plan' => $newPlan->name,
                'policy' => $downgradePolicyValue,
            ]);

            DB::commit();

            $this->reconcileTenantModules($subscription->fresh(), $newPlan);

            return $subscription->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancel subscription with cancellation policy.
     */
    public function cancel(Subscription $subscription): Subscription
    {
        DB::beginTransaction();

        try {
            $plan = $subscription->plan;
            $cancellationPolicy = $plan->cancellation_policy ?? 'end_of_period';

            match ($cancellationPolicy) {
                'immediate' => $this->applyImmediateCancellation($subscription),
                'end_of_period' => $this->applyEndOfPeriodCancellation($subscription),
                'grace_period' => $this->applyGracePeriodCancellation($subscription, $plan),
                default => $this->applyEndOfPeriodCancellation($subscription),
            };

            Log::info('Subscription cancelled', [
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
                'plan' => $plan->name,
                'policy' => $cancellationPolicy,
            ]);

            DB::commit();

            // Clear entitlement cache
            app(PlanEntitlementService::class)->clearCache($subscription->tenant_id);

            return $subscription->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Apply immediate downgrade.
     */
    protected function applyImmediateDowngrade(Subscription $subscription, Plan $newPlan, Plan $oldPlan): void
    {
        $subscription->update([
            'plan_id' => $newPlan->id,
            'downgraded_from_plan_id' => $oldPlan->id,
            'downgraded_at' => now(),
            'status' => 'active',
        ]);
    }

    /**
     * Apply end-of-period downgrade.
     */
    protected function applyEndOfPeriodDowngrade(Subscription $subscription, Plan $newPlan, Plan $oldPlan): void
    {
        $subscription->update([
            'pending_plan_id' => $newPlan->id,
            'downgrade_scheduled_at' => $subscription->next_billing_date ?? now()->addMonth(),
            'downgraded_from_plan_id' => $oldPlan->id,
        ]);
    }

    /**
     * Apply grace period downgrade.
     */
    protected function applyGracePeriodDowngrade(Subscription $subscription, Plan $newPlan, Plan $oldPlan): void
    {
        $graceDays = $oldPlan->grace_days ?? 14;
        $graceEndsAt = now()->addDays($graceDays);

        $subscription->update([
            'pending_plan_id' => $newPlan->id,
            'downgrade_scheduled_at' => $graceEndsAt,
            'downgraded_from_plan_id' => $oldPlan->id,
            'grace_period_ends_at' => $graceEndsAt,
        ]);
    }

    /**
     * Apply immediate cancellation.
     */
    protected function applyImmediateCancellation(Subscription $subscription): void
    {
        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'ends_at' => now(),
        ]);
    }

    /**
     * Apply end-of-period cancellation.
     */
    protected function applyEndOfPeriodCancellation(Subscription $subscription): void
    {
        $endsAt = $subscription->next_billing_date ?? now()->addMonth();
        
        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'ends_at' => $endsAt,
        ]);
    }

    /**
     * Apply grace period cancellation.
     */
    protected function applyGracePeriodCancellation(Subscription $subscription, Plan $plan): void
    {
        $graceDays = $plan->grace_days ?? 14;
        $graceEndsAt = now()->addDays($graceDays);

        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'ends_at' => $graceEndsAt,
            'grace_period_ends_at' => $graceEndsAt,
        ]);
    }

    /**
     * Calculate prorated amount for mid-cycle upgrade.
     */
    protected function calculateProratedAmount(Subscription $subscription, Plan $oldPlan, Plan $newPlan): float
    {
        $billingCycleStart = $subscription->current_period_start ?? now()->startOfMonth();
        $billingCycleEnd = $subscription->next_billing_date ?? now()->endOfMonth();
        
        $totalDays = $billingCycleStart->diffInDays($billingCycleEnd);
        $remainingDays = now()->diffInDays($billingCycleEnd);

        if ($totalDays === 0) {
            return 0;
        }

        // Calculate unused portion of old plan
        $unusedAmount = ($oldPlan->price / $totalDays) * $remainingDays;

        // Calculate prorated amount for new plan
        $newPlanProrated = ($newPlan->price / $totalDays) * $remainingDays;

        return max(0, $newPlanProrated - $unusedAmount);
    }

    /**
     * Calculate next billing date based on plan duration.
     */
    protected function calculateNextBillingDate(Plan $plan): Carbon
    {
        $months = $plan->duration_in_months ?? 1;
        return now()->addMonths($months);
    }

    /**
     * Process pending downgrades (run via scheduled job).
     */
    public function processPendingDowngrades(): int
    {
        $subscriptions = Subscription::whereNotNull('pending_plan_id')
            ->whereNotNull('downgrade_scheduled_at')
            ->where('downgrade_scheduled_at', '<=', now())
            ->get();

        $processed = 0;

        foreach ($subscriptions as $subscription) {
            try {
                $newPlan = Plan::find($subscription->pending_plan_id);
                
                if (!$newPlan) {
                    continue;
                }

                $subscription->update([
                    'plan_id' => $newPlan->id,
                    'pending_plan_id' => null,
                    'downgrade_scheduled_at' => null,
                    'downgraded_at' => now(),
                    'status' => 'active',
                ]);

                $this->reconcileTenantModules($subscription->fresh(), $newPlan);

                $processed++;
            } catch (\Exception $e) {
                Log::error('Failed to process pending downgrade', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $processed;
    }

    /**
     * Align tenant modules to the active plan and clear entitlement cache.
     */
    protected function reconcileTenantModules(Subscription $subscription, Plan $plan): void
    {
        $tenant = Tenant::find($subscription->tenant_id);

        if (! $tenant) {
            return;
        }

        $allowed = $this->getAllowedModulesFromPlan($plan);

        if ($allowed === null) {
            return;
        }

        $tenant->update(['modules' => $allowed]);

        app(PlanEntitlementService::class)->clearCache($tenant->id);
    }

    /**
     * Retrieve allowed modules from plan definition.
     */
    protected function getAllowedModulesFromPlan(Plan $plan): ?array
    {
        $modules = $plan->module_codes ?? $plan->modules?->pluck('code')->all();

        if ($modules === null) {
            return null;
        }

        if (is_string($modules)) {
            $modules = json_decode($modules, true) ?? [];
        }

        return array_values(array_filter($modules));
    }
}
