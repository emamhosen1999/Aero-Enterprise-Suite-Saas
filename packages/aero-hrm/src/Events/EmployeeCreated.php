<?php

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;

/**
 * @deprecated Use Aero\HRM\Events\Employee\EmployeeCreated instead
 *
 * This legacy event is maintained for backward compatibility.
 * New code should use the Employee model directly via Events\Employee\EmployeeCreated.
 */
class EmployeeCreated extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Employee  $employee  The employee that was created
     * @param  int|null  $actorEmployeeId  Employee ID who created this employee
     */
    public function __construct(
        public Employee $employee,
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

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
    {
        return (int) $this->employee->id;
    }

    public function getEntityType(): string
    {
        return 'employee';
    }
}
