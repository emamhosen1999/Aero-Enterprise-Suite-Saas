<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;

/**
 * Event fired when it's an employee's work anniversary.
 *
 * This event is typically dispatched by a scheduled job that
 * checks for work anniversaries each day.
 */
class WorkAnniversary extends BaseHrmEvent
{
    public function __construct(
        public readonly Employee $employee,
        public readonly int $yearsOfService,
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
        return 'employee-directory';
    }

    public function getActionCode(): string
    {
        return 'anniversary';
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
            'employee_name' => $this->employee->full_name,
            'years_of_service' => $this->yearsOfService,
            'department_id' => $this->employee->department_id,
        ]);
    }

    public function shouldNotify(): bool
    {
        // Anniversary notifications are optional
        return config('hrm.notifications.anniversaries', true);
    }
}
