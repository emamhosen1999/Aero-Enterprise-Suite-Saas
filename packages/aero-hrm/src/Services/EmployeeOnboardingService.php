<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Onboarding;
use Aero\HRM\Models\OnboardingTask;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * EmployeeOnboardingService
 *
 * Centralized service for initializing and managing employee onboarding workflows.
 * Provides role/department-specific task templates and reusable onboarding logic.
 */
class EmployeeOnboardingService
{
    /**
     * Initialize onboarding workflow for a newly created employee.
     *
     * Creates an Onboarding record and associated default tasks based on
     * the employee's department and designation.
     *
     * @param  Employee  $employee  The employee to initialize onboarding for
     * @param  array  $options  Optional configuration (e.g., expected_completion_days)
     * @return Onboarding The created onboarding record
     */
    public function initializeOnboarding(Employee $employee, array $options = []): Onboarding
    {
        $startDate = now();
        $expectedCompletionDays = $options['expected_completion_days'] ?? 30;
        $expectedCompletionDate = $startDate->copy()->addDays($expectedCompletionDays);

        Log::info('Initializing onboarding workflow', [
            'employee_id' => $employee->id,
            'user_id' => $employee->user_id,
            'department_id' => $employee->department_id,
            'designation_id' => $employee->designation_id,
        ]);

        // Create onboarding record
        $onboarding = Onboarding::create([
            'employee_id' => $employee->id,
            'start_date' => $startDate,
            'expected_completion_date' => $expectedCompletionDate,
            'status' => Onboarding::STATUS_PENDING,
            'notes' => 'Onboarding initiated for '.($employee->user?->name ?? 'employee'),
        ]);

        // Load default tasks based on department/designation
        $defaultTasks = $this->getDefaultTasksFor($employee);

        // Create onboarding tasks
        foreach ($defaultTasks as $taskData) {
            OnboardingTask::create([
                'onboarding_id' => $onboarding->id,
                'task' => $taskData['title'],
                'description' => $taskData['description'],
                'due_date' => $taskData['due_date'],
                'assigned_to' => $taskData['assigned_to'] ?? null,
                'status' => 'pending',
                'notes' => "Priority: {$taskData['priority']}, Category: {$taskData['category']}",
            ]);
        }

        // Update onboarding status to in_progress
        $onboarding->update(['status' => Onboarding::STATUS_IN_PROGRESS]);

        Log::info('Onboarding workflow initialized', [
            'onboarding_id' => $onboarding->id,
            'employee_id' => $employee->id,
            'tasks_created' => count($defaultTasks),
        ]);

        return $onboarding->load('tasks');
    }

    /**
     * Get default onboarding tasks based on employee's role and department.
     *
     * Returns an array of task templates customized for the employee's
     * department and designation.
     *
     * @param  Employee  $employee
     * @return array Array of task data
     */
    protected function getDefaultTasksFor(Employee $employee): array
    {
        $tasks = [];
        $department = $employee->department?->name;
        $designation = $employee->designation?->title;

        // Common tasks for all employees (Day 1-7)
        $tasks = array_merge($tasks, $this->getCommonTasks());

        // Role-specific tasks
        if ($this->isTechnicalRole($designation)) {
            $tasks = array_merge($tasks, $this->getTechnicalTasks());
        } elseif ($this->isSalesRole($designation)) {
            $tasks = array_merge($tasks, $this->getSalesTasks());
        } elseif ($this->isHRRole($designation) || $department === 'Human Resources') {
            $tasks = array_merge($tasks, $this->getHRTasks());
        } elseif ($this->isFinanceRole($designation) || $department === 'Finance') {
            $tasks = array_merge($tasks, $this->getFinanceTasks());
        }

        // Department-specific tasks
        if ($department === 'Engineering' || $department === 'IT') {
            $tasks = array_merge($tasks, $this->getEngineeringDepartmentTasks());
        }

        return $tasks;
    }

    /**
     * Common tasks for all employees.
     */
    protected function getCommonTasks(): array
    {
        return [
            [
                'title' => 'Complete HR documentation',
                'description' => 'Fill out all required HR forms including tax documents, emergency contacts, and personal information',
                'category' => 'documentation',
                'priority' => 'high',
                'due_date' => now()->addDays(3),
                'sequence_order' => 1,
            ],
            [
                'title' => 'Office tour and introductions',
                'description' => 'Get familiar with office layout, meet team members, and understand office facilities',
                'category' => 'orientation',
                'priority' => 'high',
                'due_date' => now()->addDays(1),
                'sequence_order' => 2,
            ],
            [
                'title' => 'IT orientation',
                'description' => 'Setup email account, learn internal tools, understand IT policies and security protocols',
                'category' => 'it_setup',
                'priority' => 'high',
                'due_date' => now()->addDays(2),
                'sequence_order' => 3,
            ],
            [
                'title' => 'Review company policies',
                'description' => 'Read and acknowledge company handbook, code of conduct, and workplace policies',
                'category' => 'compliance',
                'priority' => 'medium',
                'due_date' => now()->addDays(5),
                'sequence_order' => 4,
            ],
            [
                'title' => 'Benefits enrollment',
                'description' => 'Review and enroll in company benefits programs (health insurance, retirement, etc.)',
                'category' => 'hr',
                'priority' => 'medium',
                'due_date' => now()->addDays(7),
                'sequence_order' => 5,
            ],
        ];
    }

    /**
     * Technical role tasks (Engineering, IT, Development).
     */
    protected function getTechnicalTasks(): array
    {
        return [
            [
                'title' => 'Laptop and equipment setup',
                'description' => 'Receive laptop, monitor, keyboard, mouse, and other necessary equipment. Configure workstation.',
                'category' => 'it_setup',
                'priority' => 'high',
                'due_date' => now()->addDays(1),
                'sequence_order' => 10,
            ],
            [
                'title' => 'Development environment setup',
                'description' => 'Install required IDEs, SDKs, and development tools. Configure local development environment.',
                'category' => 'technical',
                'priority' => 'high',
                'due_date' => now()->addDays(3),
                'sequence_order' => 11,
            ],
            [
                'title' => 'GitHub/GitLab access setup',
                'description' => 'Get access to code repositories, understand branching strategy, and review contribution guidelines',
                'category' => 'technical',
                'priority' => 'high',
                'due_date' => now()->addDays(2),
                'sequence_order' => 12,
            ],
            [
                'title' => 'Codebase walkthrough',
                'description' => 'Review system architecture, understand codebase structure, and learn coding standards',
                'category' => 'training',
                'priority' => 'medium',
                'due_date' => now()->addDays(5),
                'sequence_order' => 13,
            ],
            [
                'title' => 'Technical documentation review',
                'description' => 'Read technical docs, API documentation, and system design documents',
                'category' => 'training',
                'priority' => 'medium',
                'due_date' => now()->addDays(7),
                'sequence_order' => 14,
            ],
        ];
    }

    /**
     * Sales role tasks.
     */
    protected function getSalesTasks(): array
    {
        return [
            [
                'title' => 'CRM system training',
                'description' => 'Learn to use the CRM system, understand lead management, and reporting tools',
                'category' => 'training',
                'priority' => 'high',
                'due_date' => now()->addDays(2),
                'sequence_order' => 20,
            ],
            [
                'title' => 'Sales pipeline overview',
                'description' => 'Understand sales process, pipeline stages, and qualification criteria',
                'category' => 'training',
                'priority' => 'high',
                'due_date' => now()->addDays(3),
                'sequence_order' => 21,
            ],
            [
                'title' => 'Product knowledge session',
                'description' => 'Learn about company products/services, features, benefits, and competitive advantages',
                'category' => 'training',
                'priority' => 'high',
                'due_date' => now()->addDays(5),
                'sequence_order' => 22,
            ],
            [
                'title' => 'Territory assignment',
                'description' => 'Receive territory or account assignments and understand coverage responsibilities',
                'category' => 'administrative',
                'priority' => 'medium',
                'due_date' => now()->addDays(1),
                'sequence_order' => 23,
            ],
            [
                'title' => 'Client database access',
                'description' => 'Get access to client records, understand data privacy policies, and learn contact protocols',
                'category' => 'administrative',
                'priority' => 'medium',
                'due_date' => now()->addDays(2),
                'sequence_order' => 24,
            ],
        ];
    }

    /**
     * HR/Admin role tasks.
     */
    protected function getHRTasks(): array
    {
        return [
            [
                'title' => 'HRIS system training',
                'description' => 'Learn to use HRIS for employee records, leave management, and payroll processing',
                'category' => 'training',
                'priority' => 'high',
                'due_date' => now()->addDays(2),
                'sequence_order' => 30,
            ],
            [
                'title' => 'Company policies review',
                'description' => 'Deep dive into all HR policies, employee handbook, and compliance requirements',
                'category' => 'compliance',
                'priority' => 'high',
                'due_date' => now()->addDays(3),
                'sequence_order' => 31,
            ],
            [
                'title' => 'Compliance training',
                'description' => 'Complete mandatory compliance training (labor laws, GDPR, workplace safety, etc.)',
                'category' => 'compliance',
                'priority' => 'high',
                'due_date' => now()->addDays(5),
                'sequence_order' => 32,
            ],
            [
                'title' => 'Document management access',
                'description' => 'Get access to employee files, understand document retention policies, and confidentiality protocols',
                'category' => 'administrative',
                'priority' => 'medium',
                'due_date' => now()->addDays(1),
                'sequence_order' => 33,
            ],
        ];
    }

    /**
     * Finance role tasks.
     */
    protected function getFinanceTasks(): array
    {
        return [
            [
                'title' => 'Financial systems access',
                'description' => 'Get access to ERP, accounting software, and financial reporting tools',
                'category' => 'it_setup',
                'priority' => 'high',
                'due_date' => now()->addDays(1),
                'sequence_order' => 40,
            ],
            [
                'title' => 'Financial policies review',
                'description' => 'Review company financial policies, approval workflows, and internal controls',
                'category' => 'compliance',
                'priority' => 'high',
                'due_date' => now()->addDays(3),
                'sequence_order' => 41,
            ],
            [
                'title' => 'Compliance and audit training',
                'description' => 'Understand audit requirements, SOX compliance, and financial regulations',
                'category' => 'compliance',
                'priority' => 'high',
                'due_date' => now()->addDays(5),
                'sequence_order' => 42,
            ],
        ];
    }

    /**
     * Engineering department tasks.
     */
    protected function getEngineeringDepartmentTasks(): array
    {
        return [
            [
                'title' => 'Team introduction meeting',
                'description' => 'Meet with team members, understand roles, and discuss collaboration tools',
                'category' => 'orientation',
                'priority' => 'high',
                'due_date' => now()->addDays(2),
                'sequence_order' => 50,
            ],
            [
                'title' => 'Project management tools setup',
                'description' => 'Get access to Jira, Confluence, or other project management tools. Understand ticketing workflow.',
                'category' => 'it_setup',
                'priority' => 'medium',
                'due_date' => now()->addDays(3),
                'sequence_order' => 51,
            ],
        ];
    }

    /**
     * Check if designation is a technical role.
     */
    protected function isTechnicalRole(?string $designation): bool
    {
        if (! $designation) {
            return false;
        }

        $technicalKeywords = [
            'developer', 'engineer', 'programmer', 'architect', 'devops',
            'qa', 'tester', 'analyst', 'technical', 'software', 'data',
        ];

        $designation = strtolower($designation);

        foreach ($technicalKeywords as $keyword) {
            if (str_contains($designation, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if designation is a sales role.
     */
    protected function isSalesRole(?string $designation): bool
    {
        if (! $designation) {
            return false;
        }

        $salesKeywords = [
            'sales', 'account', 'business development', 'bd', 'representative',
            'executive', 'manager', 'director', 'consultant',
        ];

        $designation = strtolower($designation);

        foreach ($salesKeywords as $keyword) {
            if (str_contains($designation, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if designation is an HR role.
     */
    protected function isHRRole(?string $designation): bool
    {
        if (! $designation) {
            return false;
        }

        $hrKeywords = ['hr', 'human resource', 'recruiter', 'talent', 'people'];

        $designation = strtolower($designation);

        foreach ($hrKeywords as $keyword) {
            if (str_contains($designation, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if designation is a finance role.
     */
    protected function isFinanceRole(?string $designation): bool
    {
        if (! $designation) {
            return false;
        }

        $financeKeywords = [
            'finance', 'accounting', 'accountant', 'financial', 'controller',
            'auditor', 'cfo', 'treasurer',
        ];

        $designation = strtolower($designation);

        foreach ($financeKeywords as $keyword) {
            if (str_contains($designation, $keyword)) {
                return true;
            }
        }

        return false;
    }
}
