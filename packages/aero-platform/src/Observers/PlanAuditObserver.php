<?php

declare(strict_types=1);

namespace Aero\Platform\Observers;

use Aero\Platform\Models\Plan;
use Illuminate\Support\Facades\Log;

/**
 * Plan Audit Observer
 * 
 * Logs all plan mutations for compliance and audit purposes.
 */
class PlanAuditObserver
{
    /**
     * Handle the Plan "created" event.
     */
    public function created(Plan $plan): void
    {
        $this->logAudit('created', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
            'tier' => $plan->tier,
            'plan_type' => $plan->plan_type,
            'price' => $plan->price,
            'duration_in_months' => $plan->duration_in_months,
        ]);
    }

    /**
     * Handle the Plan "updated" event.
     */
    public function updated(Plan $plan): void
    {
        $changes = $plan->getChanges();
        
        // Don't log if only timestamps changed
        if (count($changes) === 1 && isset($changes['updated_at'])) {
            return;
        }

        $this->logAudit('updated', $plan, [
            'changes' => $changes,
            'original' => $plan->getOriginal(),
        ]);
    }

    /**
     * Handle the Plan "deleted" event.
     */
    public function deleted(Plan $plan): void
    {
        $this->logAudit('deleted', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
            'tier' => $plan->tier,
            'had_subscriptions' => $plan->subscriptions()->exists(),
        ]);
    }

    /**
     * Handle the Plan "restored" event.
     */
    public function restored(Plan $plan): void
    {
        $this->logAudit('restored', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
        ]);
    }

    /**
     * Handle the Plan "force deleted" event.
     */
    public function forceDeleted(Plan $plan): void
    {
        $this->logAudit('force_deleted', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
        ]);
    }

    /**
     * Log audit event.
     */
    protected function logAudit(string $action, Plan $plan, array $data): void
    {
        Log::channel('audit')->info(sprintf(
            'Plan %s: %s (ID: %s)',
            $action,
            $plan->name,
            $plan->id
        ), [
            'action' => $action,
            'plan_id' => $plan->id,
            'plan_slug' => $plan->slug,
            'user_id' => auth()->id(),
            'user_email' => auth()->user()?->email,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
