<?php

namespace Aero\HRM\Listeners\Onboarding;

use Aero\HRM\Events\Onboarding\OnboardingStarted;
use Aero\HRM\Models\OnboardingTask;
use Aero\HRM\Models\TaskTemplate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Automatically assigns onboarding tasks when onboarding starts.
 */
class AssignOnboardingTasks implements ShouldQueue
{
    public function handle(OnboardingStarted $event): void
    {
        $onboarding = $event->onboarding;
        $employee = $onboarding->employee;

        if (! $employee) {
            Log::warning('Onboarding has no associated employee for task assignment', [
                'onboarding_id' => $onboarding->id,
            ]);

            return;
        }

        try {
            // Get task templates for onboarding
            $taskTemplates = $this->getOnboardingTaskTemplates($employee);

            // Create tasks from templates
            $tasksCreated = 0;
            foreach ($taskTemplates as $template) {
                $this->createTaskFromTemplate($onboarding, $template);
                $tasksCreated++;
            }

            // If no templates, create default tasks
            if ($tasksCreated === 0) {
                $this->createDefaultTasks($onboarding);
                $tasksCreated = count($this->getDefaultTasks());
            }

            Log::info('Onboarding tasks assigned', [
                'onboarding_id' => $onboarding->id,
                'employee_id' => $employee->id,
                'tasks_created' => $tasksCreated,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to assign onboarding tasks', [
                'onboarding_id' => $onboarding->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function getOnboardingTaskTemplates($employee): \Illuminate\Support\Collection
    {
        try {
            $query = TaskTemplate::where('type', 'onboarding')
                ->where('is_active', true);

            // Filter by department if applicable
            if ($employee->department_id) {
                $query->where(function ($q) use ($employee) {
                    $q->whereNull('department_id')
                        ->orWhere('department_id', $employee->department_id);
                });
            }

            // Filter by designation if applicable
            if ($employee->designation_id) {
                $query->where(function ($q) use ($employee) {
                    $q->whereNull('designation_id')
                        ->orWhere('designation_id', $employee->designation_id);
                });
            }

            return $query->orderBy('sequence')->get();
        } catch (\Exception $e) {
            Log::warning('Could not fetch task templates', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    protected function createTaskFromTemplate($onboarding, $template): void
    {
        OnboardingTask::create([
            'onboarding_id' => $onboarding->id,
            'title' => $template->title,
            'description' => $template->description,
            'category' => $template->category ?? 'general',
            'priority' => $template->priority ?? 'medium',
            'due_date' => now()->addDays($template->due_days ?? 7),
            'assigned_to' => $template->default_assignee_id,
            'status' => 'pending',
            'sequence' => $template->sequence ?? 0,
        ]);
    }

    protected function createDefaultTasks($onboarding): void
    {
        $tasks = $this->getDefaultTasks();

        foreach ($tasks as $index => $task) {
            OnboardingTask::create([
                'onboarding_id' => $onboarding->id,
                'title' => $task['title'],
                'description' => $task['description'],
                'category' => $task['category'],
                'priority' => $task['priority'],
                'due_date' => now()->addDays($task['due_days']),
                'status' => 'pending',
                'sequence' => $index + 1,
            ]);
        }
    }

    protected function getDefaultTasks(): array
    {
        return [
            [
                'title' => 'Complete HR Documentation',
                'description' => 'Submit all required HR documents including ID, tax forms, and emergency contacts',
                'category' => 'hr',
                'priority' => 'high',
                'due_days' => 3,
            ],
            [
                'title' => 'IT Setup',
                'description' => 'Set up workstation, email, and required software access',
                'category' => 'it',
                'priority' => 'high',
                'due_days' => 1,
            ],
            [
                'title' => 'Security Training',
                'description' => 'Complete mandatory security awareness training',
                'category' => 'training',
                'priority' => 'high',
                'due_days' => 7,
            ],
            [
                'title' => 'Meet Team Members',
                'description' => 'Introduction to team members and key stakeholders',
                'category' => 'orientation',
                'priority' => 'medium',
                'due_days' => 5,
            ],
            [
                'title' => 'Review Company Policies',
                'description' => 'Read and acknowledge company handbook and policies',
                'category' => 'hr',
                'priority' => 'medium',
                'due_days' => 7,
            ],
            [
                'title' => 'Department-Specific Training',
                'description' => 'Complete role-specific training and orientation',
                'category' => 'training',
                'priority' => 'medium',
                'due_days' => 14,
            ],
            [
                'title' => 'Benefits Enrollment',
                'description' => 'Review and enroll in company benefits programs',
                'category' => 'hr',
                'priority' => 'medium',
                'due_days' => 30,
            ],
            [
                'title' => '30-Day Check-in',
                'description' => 'Schedule 30-day review meeting with manager',
                'category' => 'review',
                'priority' => 'low',
                'due_days' => 30,
            ],
        ];
    }

    public function failed(OnboardingStarted $event, \Throwable $exception): void
    {
        Log::error('Failed to assign onboarding tasks', [
            'onboarding_id' => $event->onboarding->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
