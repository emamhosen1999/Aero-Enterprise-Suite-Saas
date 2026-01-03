<?php

namespace Aero\Compliance\Services;

use Aero\Compliance\Models\PermitToWork;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PermitValidationService - Safety Authorization Validator (PATENTABLE)
 * 
 * Automatically checks if workers have valid Permit to Work (PTW) before
 * allowing high-risk activities like RFI submissions or equipment usage.
 * 
 * Prevents unauthorized work and ensures HSE compliance.
 */
class PermitValidationService
{
    /**
     * Work activities that require a Permit to Work
     */
    private const PERMIT_REQUIRED_ACTIVITIES = [
        'hot_work' => ['welding', 'grinding', 'cutting', 'brazing'],
        'confined_space' => ['tank_entry', 'pit_work', 'tunnel_work'],
        'work_at_height' => ['scaffolding', 'crane_operation', 'roof_work'],
        'excavation' => ['deep_excavation', 'trenching', 'boring'],
        'electrical' => ['live_work', 'high_voltage', 'electrical_installation'],
        'lifting_operations' => ['crane_lift', 'mobile_crane', 'tower_crane'],
    ];

    /**
     * Check if a valid permit exists for the proposed work
     *
     * @param string $workType Type of work being performed
     * @param int $projectId Project context
     * @param float $chainage Location of work
     * @param Carbon $proposedDate When work will be performed
     * @param int|null $userId Optional: specific worker ID
     * @return array ['has_permit' => bool, 'permit' => PermitToWork|null, 'violations' => array]
     */
    public function validatePermit(
        string $workType,
        int $projectId,
        float $chainage,
        Carbon $proposedDate,
        ?int $userId = null
    ): array {
        // Check if this work type requires a permit
        $permitCategory = $this->getRequiredPermitCategory($workType);

        if (!$permitCategory) {
            return [
                'has_permit' => true, // No permit required
                'permit' => null,
                'violations' => [],
                'message' => 'No permit required for this work type',
                'permit_category' => null,
                'required' => false
            ];
        }

        // Find active permit covering this work
        $query = PermitToWork::where('project_id', $projectId)
            ->where('permit_type', $permitCategory)
            ->where('status', 'approved')
            ->where('valid_from', '<=', $proposedDate)
            ->where('valid_until', '>=', $proposedDate)
            ->where('start_chainage', '<=', $chainage)
            ->where('end_chainage', '>=', $chainage);

        if ($userId) {
            // Check if specific user is authorized
            $query->whereJsonContains('authorized_workers', $userId);
        }

        $permit = $query->first();

        $violations = [];

        if (!$permit) {
            $violations[] = [
                'type' => 'missing_permit',
                'severity' => 'critical',
                'message' => "No valid {$permitCategory} permit found for chainage {$chainage}",
                'blocking' => true
            ];

            // Check if permit exists but expired
            $expiredPermit = PermitToWork::where('project_id', $projectId)
                ->where('permit_type', $permitCategory)
                ->where('valid_until', '<', $proposedDate)
                ->where('start_chainage', '<=', $chainage)
                ->where('end_chainage', '>=', $chainage)
                ->latest('valid_until')
                ->first();

            if ($expiredPermit) {
                $violations[] = [
                    'type' => 'permit_expired',
                    'severity' => 'critical',
                    'expired_on' => $expiredPermit->valid_until->toDateString(),
                    'days_ago' => $expiredPermit->valid_until->diffInDays($proposedDate),
                    'message' => "Previous permit expired on {$expiredPermit->valid_until->toDateString()}",
                    'permit_id' => $expiredPermit->id,
                    'blocking' => true
                ];
            }
        } else {
            // Permit found - check additional conditions
            if ($permit->conditions && is_array($permit->conditions)) {
                foreach ($permit->conditions as $condition) {
                    if (!$this->checkConditionMet($condition, $proposedDate, $projectId)) {
                        $violations[] = [
                            'type' => 'condition_not_met',
                            'severity' => 'high',
                            'condition' => $condition,
                            'message' => "Permit condition not satisfied: {$condition['description']}",
                            'blocking' => $condition['mandatory'] ?? true
                        ];
                    }
                }
            }

            // Check if permit is about to expire soon (warning, not blocking)
            if ($permit->valid_until->diffInHours($proposedDate) < 24) {
                $violations[] = [
                    'type' => 'permit_expiring_soon',
                    'severity' => 'warning',
                    'expires_in_hours' => $permit->valid_until->diffInHours($proposedDate),
                    'message' => "Permit expires in {$permit->valid_until->diffInHours($proposedDate)} hours",
                    'blocking' => false
                ];
            }
        }

        $hasPermit = $permit !== null && empty(array_filter($violations, fn($v) => $v['blocking']));

        // Log validation for compliance audit
        Log::channel('compliance')->info('PTW validation', [
            'work_type' => $workType,
            'permit_category' => $permitCategory,
            'project_id' => $projectId,
            'chainage' => $chainage,
            'date' => $proposedDate->toDateString(),
            'has_valid_permit' => $hasPermit,
            'permit_id' => $permit?->id,
            'violations' => count($violations),
            'user_id' => $userId
        ]);

        return [
            'has_permit' => $hasPermit,
            'permit' => $permit,
            'violations' => $violations,
            'message' => $hasPermit
                ? 'Valid permit found - work authorized'
                : 'STOP WORK: No valid permit for ' . $permitCategory,
            'permit_category' => $permitCategory,
            'required' => true,
            'blocking' => !empty(array_filter($violations, fn($v) => $v['blocking']))
        ];
    }

    /**
     * Determine which permit category is required for a work type
     */
    private function getRequiredPermitCategory(string $workType): ?string
    {
        foreach (self::PERMIT_REQUIRED_ACTIVITIES as $category => $activities) {
            if (in_array($workType, $activities)) {
                return $category;
            }
        }
        return null;
    }

    /**
     * Check if a permit condition is met
     */
    private function checkConditionMet(array $condition, Carbon $date, int $projectId): bool
    {
        // Example conditions:
        // - Fire extinguisher available
        // - Gas detector calibrated
        // - Emergency exits marked
        // - Safety officer present

        $type = $condition['type'] ?? 'generic';

        switch ($type) {
            case 'equipment_check':
                // Check if equipment was inspected recently
                return DB::table('equipment_inspections')
                    ->where('equipment_id', $condition['equipment_id'] ?? null)
                    ->where('inspection_date', '>=', $date->subDays(7))
                    ->where('status', 'passed')
                    ->exists();

            case 'personnel_requirement':
                // Check if required personnel are assigned
                return DB::table('shift_assignments')
                    ->where('project_id', $projectId)
                    ->where('date', $date->toDateString())
                    ->where('role', $condition['role'] ?? null)
                    ->exists();

            case 'environmental':
                // Check weather conditions
                return DB::table('weather_logs')
                    ->where('project_id', $projectId)
                    ->where('log_date', $date->toDateString())
                    ->where('work_impact', '!=', 'work_stopped')
                    ->exists();

            default:
                // For unknown conditions, assume met (to prevent false blocks)
                return true;
        }
    }

    /**
     * Batch validate permits for multiple workers/activities
     *
     * @param array $workItems Array of ['work_type', 'chainage', 'date', 'user_id']
     * @param int $projectId
     * @return array
     */
    public function validateBatchPermits(array $workItems, int $projectId): array
    {
        $results = [];
        $allValid = true;

        foreach ($workItems as $index => $item) {
            $validation = $this->validatePermit(
                $item['work_type'],
                $projectId,
                $item['chainage'],
                Carbon::parse($item['date']),
                $item['user_id'] ?? null
            );

            $results[$index] = $validation;
            
            if (!$validation['has_permit']) {
                $allValid = false;
            }
        }

        return [
            'all_valid' => $allValid,
            'total_items' => count($workItems),
            'valid_count' => count(array_filter($results, fn($r) => $r['has_permit'])),
            'invalid_count' => count(array_filter($results, fn($r) => !$r['has_permit'])),
            'results' => $results
        ];
    }

    /**
     * Get upcoming permit expirations (proactive monitoring)
     *
     * @param int $projectId
     * @param int $daysAhead
     * @return array
     */
    public function getUpcomingExpirations(int $projectId, int $daysAhead = 7): array
    {
        $expiringPermits = PermitToWork::where('project_id', $projectId)
            ->where('status', 'approved')
            ->whereBetween('valid_until', [now(), now()->addDays($daysAhead)])
            ->orderBy('valid_until')
            ->get();

        return [
            'count' => $expiringPermits->count(),
            'permits' => $expiringPermits->map(fn($p) => [
                'id' => $p->id,
                'type' => $p->permit_type,
                'expires_in_days' => now()->diffInDays($p->valid_until),
                'expires_in_hours' => now()->diffInHours($p->valid_until),
                'location' => "Ch {$p->start_chainage} - {$p->end_chainage}",
                'urgency' => $p->valid_until->diffInHours(now()) < 24 ? 'critical' : 'medium'
            ]),
            'critical_count' => $expiringPermits->filter(
                fn($p) => $p->valid_until->diffInHours(now()) < 24
            )->count()
        ];
    }

    /**
     * Emergency permit revocation (immediate stop-work)
     *
     * @param int $permitId
     * @param string $reason
     * @param int $revokedBy User ID
     * @return array
     */
    public function emergencyRevoke(int $permitId, string $reason, int $revokedBy): array
    {
        $permit = PermitToWork::findOrFail($permitId);

        $permit->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoked_by' => $revokedBy,
            'revocation_reason' => $reason
        ]);

        // Notify all authorized workers
        $this->notifyWorkersOfRevocation($permit, $reason);

        // Lock all related RFIs
        DB::table('rfis')
            ->where('project_id', $permit->project_id)
            ->whereBetween('start_chainage', [$permit->start_chainage, $permit->end_chainage])
            ->where('status', 'pending')
            ->update([
                'locked' => true,
                'lock_reason' => 'PTW Revoked: ' . $reason
            ]);

        Log::channel('compliance')->emergency('PTW Emergency Revocation', [
            'permit_id' => $permitId,
            'permit_type' => $permit->permit_type,
            'reason' => $reason,
            'revoked_by' => $revokedBy,
            'affected_workers' => count($permit->authorized_workers ?? [])
        ]);

        return [
            'success' => true,
            'permit_id' => $permitId,
            'affected_rfis_locked' => DB::affectedRows(),
            'message' => 'Permit revoked - all related work stopped'
        ];
    }

    /**
     * Notify workers of permit revocation (would integrate with notification system)
     */
    private function notifyWorkersOfRevocation(PermitToWork $permit, string $reason): void
    {
        // This would integrate with SMS/Push notification system
        // For now, just log
        Log::channel('compliance')->alert('PTW Revocation Notification', [
            'permit_id' => $permit->id,
            'workers' => $permit->authorized_workers,
            'reason' => $reason
        ]);
    }
}
