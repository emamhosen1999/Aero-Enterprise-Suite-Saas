<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Employee;

/**
 * EmployeeCreated Event
 *
 * Dispatched when a new employee record is created in the system.
 * This is the primary event for employee lifecycle management.
 *
 * Triggers:
 * - Welcome email to new employee
 * - Onboarding workflow initiation
 * - Manager notification
 * - HR team notification (via HRMAC access)
 * - Asset allocation reminders
 * - System access provisioning
 *
 * Related Events:
 * - OnboardingStarted (if onboarding enabled)
 * - WelcomeEmailSent
 */
class EmployeeCreated extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Employee  $employee  The newly created employee
     * @param  int|null  $createdByEmployeeId  Employee ID of the person who created the employee
     * @param  array  $metadata  Additional context (e.g., onboarding enabled, welcome email sent)
     */
    public function __construct(
        public Employee $employee,
        ?int $createdByEmployeeId = null,
        array $metadata = []
    ) {
        parent::__construct($createdByEmployeeId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'employees';
    }

    public function getComponentCode(): ?string
    {
        return 'employee-records';
    }

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
    {
        return $this->employee->id;
    }

    public function getEntityType(): string
    {
        return 'employee';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->employee->id,
            'employee_code' => $this->employee->employee_code,
            'manager_employee_id' => $this->employee->manager_id,
            'department_id' => $this->employee->department_id,
            'designation_id' => $this->employee->designation_id,
            'onboarding_enabled' => $this->metadata['onboarding_enabled'] ?? false,
        ]);
    }

    public function getAuditMetadata(): array
    {
        return array_merge(parent::getAuditMetadata(), [
            'employee_code' => $this->employee->employee_code,
            'department_id' => $this->employee->department_id,
            'designation_id' => $this->employee->designation_id,
            'employment_type' => $this->employee->employment_type,
            'date_of_joining' => $this->employee->date_of_joining?->toDateString(),
        ]);
    }
}
