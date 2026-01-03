<?php

namespace Aero\Compliance\Traits;

use Aero\Compliance\Services\PermitValidationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * RequiresPermit Trait - Automatic PTW Enforcement (PATENTABLE)
 * 
 * Automatically checks Compliance module for active Permit to Work
 * before allowing model to be saved or approved.
 * 
 * Prevents unauthorized high-risk work from proceeding.
 */
trait RequiresPermit
{
    /**
     * Boot the trait
     */
    public static function bootRequiresPermit(): void
    {
        // Before creating/updating, check for valid permit
        static::saving(function ($model) {
            return $model->validatePermitRequirement();
        });

        // Before approval, revalidate permit (it might have expired)
        static::updating(function ($model) {
            if ($model->isDirty('status') && $model->status === 'approved') {
                return $model->validatePermitRequirement();
            }
            return true;
        });
    }

    /**
     * Validate that a valid PTW exists for this work
     *
     * @return bool
     * @throws \Exception If permit is required but missing
     */
    protected function validatePermitRequirement(): bool
    {
        // Skip if explicitly disabled (e.g., for admin overrides)
        if ($this->skipPermitValidation ?? false) {
            return true;
        }

        // Get work details from model
        $workType = $this->work_type ?? $this->activity_type ?? null;
        $chainage = $this->start_chainage ?? $this->chainage ?? null;
        $workDate = $this->work_date ?? $this->created_at ?? now();
        $projectId = $this->project_id ?? null;

        if (!$workType || !$projectId) {
            // If missing context, allow save (to prevent breaking other functionality)
            return true;
        }

        // Validate permit
        $permitService = app(PermitValidationService::class);
        
        $validation = $permitService->validatePermit(
            $workType,
            $projectId,
            (float) ($chainage ?? 0),
            $workDate instanceof Carbon ? $workDate : Carbon::parse($workDate),
            auth()->id()
        );

        // Store validation result
        $this->permit_validation_result = json_encode([
            'has_permit' => $validation['has_permit'],
            'permit_id' => $validation['permit']?->id,
            'violations' => $validation['violations'],
            'validated_at' => now()->toIso8601String()
        ]);

        if (!$validation['has_permit'] && $validation['required']) {
            // Log the violation
            Log::channel('compliance')->warning('PTW validation failed', [
                'model' => get_class($this),
                'id' => $this->id ?? 'new',
                'work_type' => $workType,
                'project_id' => $projectId,
                'user_id' => auth()->id(),
                'violations' => $validation['violations']
            ]);

            // Check if any violations are blocking
            $hasBlockingViolation = !empty(array_filter(
                $validation['violations'],
                fn($v) => $v['blocking'] ?? true
            ));

            if ($hasBlockingViolation && ($this->permitEnforcement ?? true)) {
                // Block the save/approval
                $messages = array_column($validation['violations'], 'message');
                throw new \Exception(
                    'STOP WORK: ' . implode(' | ', $messages) . 
                    ' (Contact HSE department to obtain Permit to Work)'
                );
            }

            // If not blocking, flag for review
            $this->permit_validation_status = 'failed';
            $this->requires_hse_review = true;
            $this->hse_review_reason = 'Missing or invalid Permit to Work';
        } else {
            $this->permit_validation_status = 'passed';
            if ($validation['permit']) {
                $this->permit_to_work_id = $validation['permit']->id;
            }
        }

        return true;
    }

    /**
     * Check if model has valid permit
     */
    public function hasValidPermit(): bool
    {
        return $this->permit_validation_status === 'passed';
    }

    /**
     * Get associated permit
     */
    public function permitToWork()
    {
        return $this->belongsTo(\Aero\Compliance\Models\PermitToWork::class, 'permit_to_work_id');
    }

    /**
     * Scope to query only records with valid permits
     */
    public function scopeWithValidPermit($query)
    {
        return $query->where('permit_validation_status', 'passed');
    }

    /**
     * Scope to query records missing permits
     */
    public function scopeMissingPermit($query)
    {
        return $query->where('permit_validation_status', 'failed')
            ->orWhereNull('permit_validation_status');
    }

    /**
     * Disable permit validation for this model instance (emergency override)
     */
    public function skipPermitValidation(): self
    {
        $this->skipPermitValidation = true;
        
        // Log the override for audit
        Log::channel('compliance')->warning('PTW validation bypassed', [
            'model' => get_class($this),
            'id' => $this->id ?? 'new',
            'user_id' => auth()->id(),
            'reason' => 'Manual override'
        ]);

        return $this;
    }

    /**
     * Force permit re-validation (call after permit is obtained)
     */
    public function revalidatePermit(): bool
    {
        // Temporarily clear validation status
        $this->permit_validation_status = null;
        
        // Re-run validation
        return $this->validatePermitRequirement();
    }
}
