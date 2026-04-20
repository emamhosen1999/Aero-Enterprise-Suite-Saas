<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Onboarding;
use Aero\HRM\Models\OnboardingStep;
use Aero\HRM\Models\OnboardingTask;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OnboardingOrchestratorService
{
    /**
     * Initiate onboarding for a newly hired employee.
     */
    public function initiateOnboarding(Employee $employee, array $options = []): Onboarding
    {
        return DB::transaction(function () use ($employee, $options) {
            $templateId = $options['template_id'] ?? null;
            $startDate = $options['start_date'] ?? now();
            $durationDays = $options['duration_days'] ?? 30;

            $onboarding = Onboarding::create([
                'employee_id' => $employee->id,
                'start_date' => $startDate,
                'expected_completion_date' => $startDate->copy()->addDays($durationDays),
                'status' => 'pending',
                'buddy_id' => $options['buddy_id'] ?? null,
                'notes' => $options['notes'] ?? null,
            ]);

            if ($templateId) {
                $this->applyTemplate($onboarding, $templateId);
            } else {
                $this->applyDefaultTasks($onboarding, $employee);
            }

            $onboarding->update(['status' => 'in_progress']);

            Log::info('Onboarding initiated', [
                'onboarding_id' => $onboarding->id,
                'employee_id' => $employee->id,
                'duration_days' => $durationDays,
            ]);

            return $onboarding->load('tasks');
        });
    }

    /**
     * Complete a specific onboarding task.
     */
    public function completeTask(OnboardingTask $task, array $data = []): OnboardingTask
    {
        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completed_by' => auth()->id(),
            'completion_notes' => $data['notes'] ?? null,
        ]);

        $this->checkOnboardingCompletion($task->onboarding);

        return $task->fresh();
    }

    /**
     * Skip a task with reason.
     */
    public function skipTask(OnboardingTask $task, string $reason): OnboardingTask
    {
        $task->update([
            'status' => 'skipped',
            'completed_at' => now(),
            'completion_notes' => "Skipped: {$reason}",
        ]);

        $this->checkOnboardingCompletion($task->onboarding);

        return $task->fresh();
    }

    /**
     * Assign a buddy/mentor to the new employee.
     */
    public function assignBuddy(Onboarding $onboarding, int $buddyEmployeeId): Onboarding
    {
        $onboarding->update(['buddy_id' => $buddyEmployeeId]);

        Log::info('Buddy assigned for onboarding', [
            'onboarding_id' => $onboarding->id,
            'buddy_id' => $buddyEmployeeId,
        ]);

        return $onboarding->fresh();
    }

    /**
     * Get onboarding progress for an employee.
     */
    public function getProgress(Onboarding $onboarding): array
    {
        $tasks = $onboarding->tasks;
        $total = $tasks->count();
        $completed = $tasks->whereIn('status', ['completed', 'skipped'])->count();
        $pending = $tasks->where('status', 'pending')->count();
        $overdue = $tasks->where('status', 'pending')
            ->filter(fn ($t) => $t->due_date && $t->due_date->isPast())
            ->count();

        return [
            'onboarding_id' => $onboarding->id,
            'employee_id' => $onboarding->employee_id,
            'status' => $onboarding->status,
            'start_date' => $onboarding->start_date?->toDateString(),
            'expected_completion' => $onboarding->expected_completion_date?->toDateString(),
            'days_elapsed' => $onboarding->start_date ? now()->diffInDays($onboarding->start_date) : 0,
            'total_tasks' => $total,
            'completed_tasks' => $completed,
            'pending_tasks' => $pending,
            'overdue_tasks' => $overdue,
            'progress_percentage' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
            'buddy_id' => $onboarding->buddy_id,
        ];
    }

    /**
     * Get all active onboardings with progress summary.
     */
    public function getActiveOnboardings(): Collection
    {
        return Onboarding::where('status', 'in_progress')
            ->with(['employee', 'tasks'])
            ->get()
            ->map(function ($onboarding) {
                $tasks = $onboarding->tasks;
                $total = $tasks->count();
                $completed = $tasks->whereIn('status', ['completed', 'skipped'])->count();

                return [
                    'id' => $onboarding->id,
                    'employee_id' => $onboarding->employee_id,
                    'employee_name' => $onboarding->employee?->full_name,
                    'start_date' => $onboarding->start_date?->toDateString(),
                    'expected_completion' => $onboarding->expected_completion_date?->toDateString(),
                    'progress' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                    'overdue_tasks' => $tasks->where('status', 'pending')
                        ->filter(fn ($t) => $t->due_date && $t->due_date->isPast())
                        ->count(),
                ];
            });
    }

    /**
     * Extend onboarding deadline.
     */
    public function extendDeadline(Onboarding $onboarding, int $additionalDays, ?string $reason = null): Onboarding
    {
        $newDate = $onboarding->expected_completion_date
            ? $onboarding->expected_completion_date->addDays($additionalDays)
            : now()->addDays($additionalDays);

        $onboarding->update([
            'expected_completion_date' => $newDate,
            'notes' => $onboarding->notes."\nExtended by {$additionalDays} days".($reason ? ": {$reason}" : ''),
        ]);

        Log::info('Onboarding deadline extended', [
            'onboarding_id' => $onboarding->id,
            'additional_days' => $additionalDays,
        ]);

        return $onboarding->fresh();
    }

    private function checkOnboardingCompletion(Onboarding $onboarding): void
    {
        $onboarding->refresh();
        $tasks = $onboarding->tasks;
        $allDone = $tasks->every(fn ($t) => in_array($t->status, ['completed', 'skipped']));

        if ($allDone && $tasks->isNotEmpty()) {
            $onboarding->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info('Onboarding completed', [
                'onboarding_id' => $onboarding->id,
                'employee_id' => $onboarding->employee_id,
            ]);
        }
    }

    private function applyTemplate(Onboarding $onboarding, int $templateId): void
    {
        $steps = OnboardingStep::where('onboarding_template_id', $templateId)
            ->orderBy('order')
            ->get();

        foreach ($steps as $index => $step) {
            OnboardingTask::create([
                'onboarding_id' => $onboarding->id,
                'task' => $step->title,
                'description' => $step->description,
                'due_date' => $onboarding->start_date?->addDays($step->due_day ?? ($index + 1) * 3),
                'assigned_to' => $step->assignee_id ?? null,
                'status' => 'pending',
                'category' => $step->category ?? 'general',
            ]);
        }
    }

    private function applyDefaultTasks(Onboarding $onboarding, Employee $employee): void
    {
        $defaultTasks = [
            ['task' => 'Complete HR paperwork', 'due_days' => 1, 'category' => 'documentation'],
            ['task' => 'IT equipment setup', 'due_days' => 2, 'category' => 'it'],
            ['task' => 'System access provisioning', 'due_days' => 2, 'category' => 'it'],
            ['task' => 'Team introduction', 'due_days' => 3, 'category' => 'social'],
            ['task' => 'Workspace assignment', 'due_days' => 1, 'category' => 'facilities'],
            ['task' => 'Policy acknowledgement', 'due_days' => 5, 'category' => 'compliance'],
            ['task' => 'Role-specific training', 'due_days' => 14, 'category' => 'training'],
            ['task' => 'First week check-in', 'due_days' => 7, 'category' => 'social'],
            ['task' => '30-day review meeting', 'due_days' => 30, 'category' => 'review'],
        ];

        foreach ($defaultTasks as $taskData) {
            OnboardingTask::create([
                'onboarding_id' => $onboarding->id,
                'task' => $taskData['task'],
                'due_date' => $onboarding->start_date?->addDays($taskData['due_days']),
                'status' => 'pending',
                'category' => $taskData['category'],
            ]);
        }
    }
}
