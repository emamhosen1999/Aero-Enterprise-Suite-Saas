<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Employee;

/**
 * EmployeePromoted Event
 *
 * Dispatched when an employee receives a promotion (designation or department change).
 *
 * Triggers:
 * - Congratulations notification to employee
 * - Team announcement
 * - Manager notification
 * - HR notification
 * - Update org chart
 */
class EmployeePromoted extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Employee  $employee
     * @param  int|null  $oldDesignationId
     * @param  int|null  $newDesignationId
     * @param  int|null  $oldDepartmentId
     * @param  int|null  $newDepartmentId
     * @param  float|null  $oldSalary
     * @param  float|null  $newSalary
     * @param  string|null  $reason
     * @param  int|null  $actorEmployeeId  Employee ID (HR/Manager) who processed the promotion
     */
    public function __construct(
        public Employee $employee,
        public ?int $oldDesignationId = null,
        public ?int $newDesignationId = null,
        public ?int $oldDepartmentId = null,
        public ?int $newDepartmentId = null,
        public ?float $oldSalary = null,
        public ?float $newSalary = null,
        public ?string $reason = null,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'employees';
    }

    public function getComponentCode(): ?string
    {
        return 'profile';
    }

    public function getActionCode(): ?string
    {
        return 'promote';
    }

    public function getEntityId(): int|string
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
            'old_designation_id' => $this->oldDesignationId,
            'new_designation_id' => $this->newDesignationId,
            'old_department_id' => $this->oldDepartmentId,
            'new_department_id' => $this->newDepartmentId,
            'salary_change' => $this->newSalary !== null && $this->oldSalary !== null
                ? $this->newSalary - $this->oldSalary
                : null,
            'reason' => $this->reason,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
