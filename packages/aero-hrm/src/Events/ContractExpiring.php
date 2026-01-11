<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;

/**
 * Event fired when an employee's contract is about to expire.
 *
 * This event is typically dispatched by a scheduled job.
 */
class ContractExpiring extends BaseHrmEvent
{
    public function __construct(
        public readonly Employee $employee,
        public readonly int $daysRemaining,
        array $metadata = []
    ) {
        // System-triggered event, no actor
        parent::__construct(null, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'employees';
    }

    public function getComponentCode(): ?string
    {
        return 'contracts';
    }

    public function getActionCode(): string
    {
        return 'expiring';
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
            'employee_name' => $this->employee->name,
            'days_remaining' => $this->daysRemaining,
            'department_id' => $this->employee->department_id,
            'manager_id' => $this->employee->manager_id,
        ]);
    }
}
