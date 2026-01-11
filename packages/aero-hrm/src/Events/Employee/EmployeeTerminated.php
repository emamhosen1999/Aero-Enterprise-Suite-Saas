<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Employee;

/**
 * EmployeeTerminated Event
 *
 * Dispatched when an employee is terminated by the company.
 *
 * Triggers:
 * - Immediate offboarding
 * - System access revocation
 * - Asset return enforcement
 * - Exit notification
 * - Final settlement processing
 * - Manager notification
 * - HR notification
 */
class EmployeeTerminated extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  Employee  $employee
     * @param  \DateTimeInterface  $terminationDate
     * @param  string  $reason  Reason for termination
     * @param  int|null  $actorEmployeeId  Employee ID (HR/Manager) who performed termination
     * @param  bool  $immediate  Whether termination is immediate (no notice)
     */
    public function __construct(
        public Employee $employee,
        public \DateTimeInterface $terminationDate,
        public string $reason,
        ?int $actorEmployeeId = null,
        public bool $immediate = false
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
        return 'terminate';
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
            'termination_date' => $this->terminationDate->format('Y-m-d'),
            'reason' => $this->reason,
            'immediate' => $this->immediate,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
