<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Offboarding;
use Aero\HRM\Models\OffboardingTask;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OffboardingOrchestratorService
{
    /**
     * Initiate offboarding for a departing employee.
     */
    public function initiateOffboarding(Employee $employee, array $data): Offboarding
    {
        return DB::transaction(function () use ($employee, $data) {
            $offboarding = Offboarding::create([
                'employee_id' => $employee->id,
                'last_working_day' => $data['last_working_day'],
                'reason' => $data['reason'] ?? 'resignation',
                'initiated_by' => auth()->id(),
                'status' => 'initiated',
                'notes' => $data['notes'] ?? null,
                'notice_period_start' => $data['notice_period_start'] ?? now(),
                'notice_period_days' => $data['notice_period_days'] ?? 30,
            ]);

            $this->createOffboardingChecklist($offboarding, $employee);

            Log::info('Offboarding initiated', [
                'offboarding_id' => $offboarding->id,
                'employee_id' => $employee->id,
                'last_working_day' => $data['last_working_day'],
            ]);

            return $offboarding->load('tasks');
        });
    }

    /**
     * Complete an offboarding task.
     */
    public function completeTask(OffboardingTask $task, array $data = []): OffboardingTask
    {
        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completed_by' => auth()->id(),
            'notes' => $data['notes'] ?? null,
        ]);

        $this->checkOffboardingCompletion($task->offboarding);

        return $task->fresh();
    }

    /**
     * Record asset return during offboarding.
     */
    public function recordAssetReturn(Offboarding $offboarding, int $assetId, array $data = []): void
    {
        DB::transaction(function () use ($offboarding, $assetId, $data) {
            $task = $offboarding->tasks()
                ->where('type', 'asset_return')
                ->where('reference_id', $assetId)
                ->first();

            if ($task) {
                $task->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'notes' => $data['condition'] ?? 'Returned in good condition',
                ]);
            }

            Log::info('Asset returned during offboarding', [
                'offboarding_id' => $offboarding->id,
                'asset_id' => $assetId,
            ]);
        });
    }

    /**
     * Revoke system access for the departing employee.
     */
    public function revokeAccess(Offboarding $offboarding): Offboarding
    {
        return DB::transaction(function () use ($offboarding) {
            $accessTask = $offboarding->tasks()
                ->where('type', 'access_revocation')
                ->first();

            if ($accessTask) {
                $accessTask->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'completed_by' => auth()->id(),
                ]);
            }

            $offboarding->update(['access_revoked_at' => now()]);

            Log::info('Access revoked for offboarding', [
                'offboarding_id' => $offboarding->id,
                'employee_id' => $offboarding->employee_id,
            ]);

            return $offboarding->fresh();
        });
    }

    /**
     * Generate exit clearance certificate.
     */
    public function generateClearance(Offboarding $offboarding): array
    {
        $tasks = $offboarding->tasks;
        $allCompleted = $tasks->every(fn ($t) => $t->status === 'completed');
        $pendingTasks = $tasks->where('status', '!=', 'completed');

        if (! $allCompleted) {
            return [
                'cleared' => false,
                'pending_items' => $pendingTasks->pluck('task')->toArray(),
                'message' => 'Cannot generate clearance — pending tasks remain.',
            ];
        }

        $offboarding->update([
            'status' => 'cleared',
            'cleared_at' => now(),
            'clearance_number' => 'CLR-'.strtoupper(uniqid()).'-'.now()->format('Y'),
        ]);

        return [
            'cleared' => true,
            'clearance_number' => $offboarding->fresh()->clearance_number,
            'cleared_at' => now()->toDateString(),
            'employee_id' => $offboarding->employee_id,
        ];
    }

    /**
     * Get offboarding progress.
     */
    public function getProgress(Offboarding $offboarding): array
    {
        $tasks = $offboarding->tasks;
        $total = $tasks->count();
        $completed = $tasks->where('status', 'completed')->count();

        return [
            'offboarding_id' => $offboarding->id,
            'employee_id' => $offboarding->employee_id,
            'status' => $offboarding->status,
            'last_working_day' => $offboarding->last_working_day,
            'days_remaining' => $offboarding->last_working_day
                ? max(0, now()->diffInDays($offboarding->last_working_day, false))
                : 0,
            'total_tasks' => $total,
            'completed_tasks' => $completed,
            'progress_percentage' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
            'pending_tasks' => $tasks->where('status', '!=', 'completed')
                ->pluck('task')
                ->toArray(),
        ];
    }

    /**
     * Get all active offboardings.
     */
    public function getActiveOffboardings(): Collection
    {
        return Offboarding::whereNotIn('status', ['completed', 'cleared', 'cancelled'])
            ->with(['employee', 'tasks'])
            ->orderBy('last_working_day')
            ->get()
            ->map(function ($offboarding) {
                $tasks = $offboarding->tasks;
                $total = $tasks->count();
                $completed = $tasks->where('status', 'completed')->count();

                return [
                    'id' => $offboarding->id,
                    'employee_id' => $offboarding->employee_id,
                    'employee_name' => $offboarding->employee?->full_name,
                    'last_working_day' => $offboarding->last_working_day,
                    'reason' => $offboarding->reason,
                    'progress' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                    'days_remaining' => $offboarding->last_working_day
                        ? max(0, now()->diffInDays($offboarding->last_working_day, false))
                        : 0,
                ];
            });
    }

    /**
     * Schedule knowledge transfer sessions.
     */
    public function scheduleKnowledgeTransfer(Offboarding $offboarding, array $sessions): Collection
    {
        return DB::transaction(function () use ($offboarding, $sessions) {
            $tasks = collect();

            foreach ($sessions as $session) {
                $task = OffboardingTask::create([
                    'offboarding_id' => $offboarding->id,
                    'task' => "Knowledge transfer: {$session['topic']}",
                    'type' => 'knowledge_transfer',
                    'assigned_to' => $session['successor_id'] ?? null,
                    'due_date' => $session['date'] ?? null,
                    'status' => 'pending',
                    'notes' => $session['notes'] ?? null,
                ]);

                $tasks->push($task);
            }

            Log::info('Knowledge transfer sessions scheduled', [
                'offboarding_id' => $offboarding->id,
                'sessions_count' => $tasks->count(),
            ]);

            return $tasks;
        });
    }

    private function createOffboardingChecklist(Offboarding $offboarding, Employee $employee): void
    {
        $checklist = [
            ['task' => 'Resignation acceptance letter', 'type' => 'documentation', 'due_days' => 1],
            ['task' => 'Knowledge transfer plan', 'type' => 'knowledge_transfer', 'due_days' => 3],
            ['task' => 'Return company assets', 'type' => 'asset_return', 'due_days' => -1],
            ['task' => 'Revoke system access', 'type' => 'access_revocation', 'due_days' => 0],
            ['task' => 'Exit interview', 'type' => 'exit_interview', 'due_days' => -3],
            ['task' => 'Final settlement calculation', 'type' => 'finance', 'due_days' => -1],
            ['task' => 'Experience certificate generation', 'type' => 'documentation', 'due_days' => 0],
            ['task' => 'Remove from benefits/insurance', 'type' => 'benefits', 'due_days' => 0],
            ['task' => 'Update org chart', 'type' => 'administration', 'due_days' => 0],
        ];

        $lastDay = $offboarding->last_working_day ? Carbon::parse($offboarding->last_working_day) : now()->addDays(30);

        foreach ($checklist as $item) {
            OffboardingTask::create([
                'offboarding_id' => $offboarding->id,
                'task' => $item['task'],
                'type' => $item['type'],
                'due_date' => $lastDay->copy()->addDays($item['due_days']),
                'status' => 'pending',
            ]);
        }
    }

    private function checkOffboardingCompletion(Offboarding $offboarding): void
    {
        $offboarding->refresh();
        $allCompleted = $offboarding->tasks->every(fn ($t) => $t->status === 'completed');

        if ($allCompleted && $offboarding->tasks->isNotEmpty()) {
            $offboarding->update(['status' => 'completed']);

            Log::info('Offboarding completed', [
                'offboarding_id' => $offboarding->id,
                'employee_id' => $offboarding->employee_id,
            ]);
        }
    }
}
