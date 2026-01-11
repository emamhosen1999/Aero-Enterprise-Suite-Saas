<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Employee;

/**
 * EmployeeResigned Event
 *
 * Dispatched when an employee submits resignation.
 *
 * Triggers:
 * - Offboarding workflow initiation
 * - Manager notification
 * - HR notification
 * - Asset return reminders
 * - Exit interview scheduling
 * - Knowledge transfer planning
 */
class EmployeeResigned extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Employee  $employee
     * @param  \DateTimeInterface  $resignationDate  Date resignation was submitted
     * @param  \DateTimeInterface  $lastWorkingDate  Employee's last day
     * @param  string|null  $reason  Reason for resignation
     * @param  int|null  $noticePeriodDays  Notice period in days
     */
    public function __construct(
        public Employee $employee,
        public \DateTimeInterface $resignationDate,
        public \DateTimeInterface $lastWorkingDate,
        public ?string $reason = null,
        public ?int $noticePeriodDays = null
    ) {
        parent::__construct($employee->id);
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
        return 'resign';
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
            'resignation_date' => $this->resignationDate->format('Y-m-d'),
            'last_working_date' => $this->lastWorkingDate->format('Y-m-d'),
            'notice_period_days' => $this->noticePeriodDays,
            'reason' => $this->reason,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
