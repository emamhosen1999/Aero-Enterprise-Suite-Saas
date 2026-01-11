<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

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
class EmployeePromoted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Employee  $employee
     * @param  int|null  $oldDesignationId
     * @param  int|null  $newDesignationId
     * @param  int|null  $oldDepartmentId
     * @param  int|null  $newDepartmentId
     * @param  float|null  $oldSalary
     * @param  float|null  $newSalary
     * @param  string|null  $reason
     */
    public function __construct(
        public Employee $employee,
        public ?int $oldDesignationId = null,
        public ?int $newDesignationId = null,
        public ?int $oldDepartmentId = null,
        public ?int $newDepartmentId = null,
        public ?float $oldSalary = null,
        public ?float $newSalary = null,
        public ?string $reason = null
    ) {}
}
