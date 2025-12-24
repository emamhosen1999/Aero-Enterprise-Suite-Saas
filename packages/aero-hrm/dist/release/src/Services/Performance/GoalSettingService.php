<?php

namespace Aero\HRM\Services\Performance;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Goal Setting Service
 *
 * Manages OKR (Objectives and Key Results) and goal management
 * for employee performance tracking.
 */
class GoalSettingService
{
    /**
     * Goal types.
     */
    public const TYPE_INDIVIDUAL = 'individual';
    public const TYPE_TEAM = 'team';
    public const TYPE_DEPARTMENT = 'department';
    public const TYPE_COMPANY = 'company';

    /**
     * Goal statuses.
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING_APPROVAL = 'pending_approval';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_ON_TRACK = 'on_track';
    public const STATUS_AT_RISK = 'at_risk';
    public const STATUS_BEHIND = 'behind';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Goal priority levels.
     */
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_CRITICAL = 'critical';

    /**
     * Key result measurement types.
     */
    public const MEASURE_PERCENTAGE = 'percentage';
    public const MEASURE_NUMBER = 'number';
    public const MEASURE_CURRENCY = 'currency';
    public const MEASURE_BOOLEAN = 'boolean';
    public const MEASURE_MILESTONE = 'milestone';

    /**
     * Create a new goal/objective.
     */
    public function createGoal(array $data): array
    {
        $validation = $this->validateGoalData($data);
        if (!$validation['valid']) {
            return ['success' => false, 'errors' => $validation['errors']];
        }

        $goalId = Str::uuid()->toString();

        $goal = [
            'id' => $goalId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? self::TYPE_INDIVIDUAL,
            'priority' => $data['priority'] ?? self::PRIORITY_MEDIUM,
            'status' => self::STATUS_DRAFT,
            'owner_id' => $data['owner_id'],
            'owner_type' => $data['owner_type'] ?? 'employee', // employee, team, department
            'parent_goal_id' => $data['parent_goal_id'] ?? null,
            'aligned_to' => $data['aligned_to'] ?? [], // IDs of goals this aligns with
            'period' => [
                'type' => $data['period_type'] ?? 'quarter', // quarter, year, custom
                'start_date' => Carbon::parse($data['start_date'])->toDateString(),
                'end_date' => Carbon::parse($data['end_date'])->toDateString(),
                'quarter' => $data['quarter'] ?? null,
                'year' => $data['year'] ?? now()->year,
            ],
            'key_results' => $this->processKeyResults($data['key_results'] ?? [], $goalId),
            'weight' => $data['weight'] ?? 1.0,
            'progress' => 0,
            'tags' => $data['tags'] ?? [],
            'visibility' => $data['visibility'] ?? 'private', // private, team, department, public
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
            'metadata' => $data['metadata'] ?? [],
        ];

        Log::info('Goal created', [
            'goal_id' => $goalId,
            'owner_id' => $data['owner_id'],
            'type' => $goal['type'],
        ]);

        return ['success' => true, 'goal' => $goal];
    }

    /**
     * Add a key result to a goal.
     */
    public function addKeyResult(string $goalId, array $keyResultData): array
    {
        $krId = Str::uuid()->toString();

        $keyResult = [
            'id' => $krId,
            'goal_id' => $goalId,
            'title' => $keyResultData['title'],
            'description' => $keyResultData['description'] ?? null,
            'measurement_type' => $keyResultData['measurement_type'] ?? self::MEASURE_PERCENTAGE,
            'start_value' => $keyResultData['start_value'] ?? 0,
            'target_value' => $keyResultData['target_value'],
            'current_value' => $keyResultData['current_value'] ?? $keyResultData['start_value'] ?? 0,
            'unit' => $keyResultData['unit'] ?? null,
            'weight' => $keyResultData['weight'] ?? 1.0,
            'progress' => 0,
            'milestones' => $keyResultData['milestones'] ?? [],
            'check_ins' => [],
            'status' => self::STATUS_ACTIVE,
            'owner_id' => $keyResultData['owner_id'] ?? null,
            'due_date' => $keyResultData['due_date'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];

        // Calculate initial progress
        $keyResult['progress'] = $this->calculateKeyResultProgress($keyResult);

        Log::info('Key result added', [
            'kr_id' => $krId,
            'goal_id' => $goalId,
        ]);

        return ['success' => true, 'key_result' => $keyResult];
    }

    /**
     * Update key result progress (check-in).
     */
    public function checkIn(string $goalId, string $keyResultId, array $data): array
    {
        $checkIn = [
            'id' => Str::uuid()->toString(),
            'key_result_id' => $keyResultId,
            'previous_value' => $data['previous_value'] ?? 0,
            'new_value' => $data['new_value'],
            'confidence' => $data['confidence'] ?? 'on_track', // on_track, at_risk, off_track
            'notes' => $data['notes'] ?? null,
            'blockers' => $data['blockers'] ?? [],
            'next_steps' => $data['next_steps'] ?? null,
            'checked_in_by' => $data['checked_in_by'] ?? null,
            'checked_in_at' => now()->toIso8601String(),
        ];

        Log::info('Key result check-in', [
            'goal_id' => $goalId,
            'kr_id' => $keyResultId,
            'new_value' => $data['new_value'],
        ]);

        return [
            'success' => true,
            'check_in' => $checkIn,
            'new_progress' => $this->calculateProgressFromValue($data['new_value'], $data['target_value'] ?? 100, $data['start_value'] ?? 0),
        ];
    }

    /**
     * Calculate goal progress from key results.
     */
    public function calculateGoalProgress(array $keyResults): float
    {
        if (empty($keyResults)) {
            return 0;
        }

        $totalWeight = 0;
        $weightedProgress = 0;

        foreach ($keyResults as $kr) {
            $weight = $kr['weight'] ?? 1.0;
            $progress = $kr['progress'] ?? 0;
            $weightedProgress += $progress * $weight;
            $totalWeight += $weight;
        }

        return $totalWeight > 0 ? round($weightedProgress / $totalWeight, 2) : 0;
    }

    /**
     * Get goals for an employee.
     */
    public function getEmployeeGoals(int $employeeId, array $filters = []): array
    {
        // In production, query from database
        return [
            'employee_id' => $employeeId,
            'goals' => [],
            'summary' => [
                'total' => 0,
                'completed' => 0,
                'in_progress' => 0,
                'at_risk' => 0,
                'average_progress' => 0,
            ],
        ];
    }

    /**
     * Get team goals.
     */
    public function getTeamGoals(int $teamId, array $filters = []): array
    {
        return [
            'team_id' => $teamId,
            'goals' => [],
            'alignment' => [],
        ];
    }

    /**
     * Get goal cascade/hierarchy.
     */
    public function getGoalCascade(string $goalId): array
    {
        return [
            'goal_id' => $goalId,
            'parent' => null,
            'children' => [],
            'aligned_goals' => [],
        ];
    }

    /**
     * Close/complete a goal.
     */
    public function closeGoal(string $goalId, array $data = []): array
    {
        $closureData = [
            'final_progress' => $data['final_progress'] ?? 0,
            'outcome' => $data['outcome'] ?? 'completed', // completed, partially_completed, not_achieved
            'learnings' => $data['learnings'] ?? null,
            'closed_by' => $data['closed_by'] ?? null,
            'closed_at' => now()->toIso8601String(),
        ];

        Log::info('Goal closed', [
            'goal_id' => $goalId,
            'outcome' => $closureData['outcome'],
        ]);

        return ['success' => true, 'closure' => $closureData];
    }

    /**
     * Get OKR analytics.
     */
    public function getAnalytics(array $filters = []): array
    {
        return [
            'period' => $filters['period'] ?? 'current_quarter',
            'summary' => [
                'total_objectives' => 0,
                'total_key_results' => 0,
                'average_progress' => 0,
                'completion_rate' => 0,
            ],
            'by_status' => [],
            'by_department' => [],
            'trending' => [],
        ];
    }

    /**
     * Process key results array.
     */
    protected function processKeyResults(array $keyResults, string $goalId): array
    {
        return array_map(function ($kr) use ($goalId) {
            $krId = Str::uuid()->toString();
            return [
                'id' => $krId,
                'goal_id' => $goalId,
                'title' => $kr['title'],
                'description' => $kr['description'] ?? null,
                'measurement_type' => $kr['measurement_type'] ?? self::MEASURE_PERCENTAGE,
                'start_value' => $kr['start_value'] ?? 0,
                'target_value' => $kr['target_value'] ?? 100,
                'current_value' => $kr['start_value'] ?? 0,
                'unit' => $kr['unit'] ?? null,
                'weight' => $kr['weight'] ?? 1.0,
                'progress' => 0,
                'status' => self::STATUS_ACTIVE,
                'created_at' => now()->toIso8601String(),
            ];
        }, $keyResults);
    }

    /**
     * Calculate key result progress.
     */
    protected function calculateKeyResultProgress(array $kr): float
    {
        return $this->calculateProgressFromValue(
            $kr['current_value'],
            $kr['target_value'],
            $kr['start_value']
        );
    }

    /**
     * Calculate progress from value.
     */
    protected function calculateProgressFromValue(float $current, float $target, float $start): float
    {
        if ($target == $start) {
            return $current >= $target ? 100 : 0;
        }

        $progress = (($current - $start) / ($target - $start)) * 100;
        return max(0, min(100, round($progress, 2)));
    }

    /**
     * Validate goal data.
     */
    protected function validateGoalData(array $data): array
    {
        $errors = [];

        if (empty($data['title'])) {
            $errors[] = 'Goal title is required';
        }

        if (empty($data['owner_id'])) {
            $errors[] = 'Goal owner is required';
        }

        if (empty($data['start_date']) || empty($data['end_date'])) {
            $errors[] = 'Goal period dates are required';
        }

        if (!empty($data['start_date']) && !empty($data['end_date'])) {
            if (Carbon::parse($data['start_date'])->gt(Carbon::parse($data['end_date']))) {
                $errors[] = 'Start date must be before end date';
            }
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }
}
