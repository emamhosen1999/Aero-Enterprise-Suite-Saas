<?php

namespace Aero\HRM\Listeners\Employee;

use Aero\HRM\Events\Employee\EmployeeTerminated;
use Aero\HRM\Events\Offboarding\OffboardingStarted;
use Aero\HRM\Models\Offboarding;
use Aero\HRM\Models\OffboardingTask;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Initiates immediate offboarding for terminated employees.
 */
class InitiateImmediateOffboarding implements ShouldQueue
{
    public function handle(EmployeeTerminated $event): void
    {
        $employee = $event->employee;

        // Check if offboarding already exists
        $existingOffboarding = Offboarding::where('employee_id', $employee->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->first();

        if ($existingOffboarding) {
            Log::info('Offboarding already exists for employee', [
                'employee_id' => $employee->id,
                'offboarding_id' => $existingOffboarding->id,
            ]);

            // Mark it as urgent if immediate termination
            if ($event->immediate) {
                $existingOffboarding->update([
                    'is_urgent' => true,
                    'notes' => ($existingOffboarding->notes ?? '') . "\n[Immediate termination - expedited processing required]",
                ]);
            }

            return;
        }

        try {
            // Create offboarding record
            $offboarding = Offboarding::create([
                'employee_id' => $employee->id,
                'reason' => 'termination',
                'status' => $event->immediate ? 'in_progress' : 'pending',
                'last_working_date' => $event->lastWorkingDate ?? now(),
                'initiated_by' => $event->terminatedBy,
                'initiated_at' => now(),
                'is_urgent' => $event->immediate,
                'notes' => "Termination reason: {$event->reason}",
            ]);

            // Create default offboarding tasks
            $this->createOffboardingTasks($offboarding, $event->immediate);

            // Dispatch OffboardingStarted event
            event(new OffboardingStarted($offboarding, 'termination', $event->terminatedBy));

            Log::info('Offboarding initiated for terminated employee', [
                'employee_id' => $employee->id,
                'offboarding_id' => $offboarding->id,
                'immediate' => $event->immediate,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to initiate offboarding', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function createOffboardingTasks(Offboarding $offboarding, bool $immediate): void
    {
        $tasks = [
            [
                'title' => 'Revoke System Access',
                'description' => 'Disable all system accounts and access credentials',
                'category' => 'it',
                'priority' => $immediate ? 'urgent' : 'high',
                'due_days' => $immediate ? 0 : 1,
            ],
            [
                'title' => 'Collect Company Assets',
                'description' => 'Collect laptop, ID card, keys, and other company property',
                'category' => 'assets',
                'priority' => 'high',
                'due_days' => $immediate ? 0 : 3,
            ],
            [
                'title' => 'Process Final Settlement',
                'description' => 'Calculate and process final salary, dues, and benefits',
                'category' => 'finance',
                'priority' => 'medium',
                'due_days' => $immediate ? 3 : 7,
            ],
            [
                'title' => 'Conduct Exit Interview',
                'description' => 'Schedule and conduct exit interview if applicable',
                'category' => 'hr',
                'priority' => $immediate ? 'low' : 'medium',
                'due_days' => $immediate ? 1 : 5,
            ],
            [
                'title' => 'Knowledge Transfer',
                'description' => 'Ensure proper handover of responsibilities and documentation',
                'category' => 'operations',
                'priority' => $immediate ? 'urgent' : 'high',
                'due_days' => $immediate ? 1 : 7,
            ],
            [
                'title' => 'Update Records',
                'description' => 'Update employee records and archive files',
                'category' => 'hr',
                'priority' => 'medium',
                'due_days' => 7,
            ],
        ];

        foreach ($tasks as $task) {
            OffboardingTask::create([
                'offboarding_id' => $offboarding->id,
                'title' => $task['title'],
                'description' => $task['description'],
                'category' => $task['category'],
                'priority' => $task['priority'],
                'due_date' => now()->addDays($task['due_days']),
                'status' => 'pending',
            ]);
        }
    }

    public function failed(EmployeeTerminated $event, \Throwable $exception): void
    {
        Log::error('Failed to initiate immediate offboarding', [
            'employee_id' => $event->employee->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
