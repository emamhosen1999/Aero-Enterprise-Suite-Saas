<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Leave;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Leave;

/**
 * Leave Cancelled Event
 *
 * Dispatched when a leave request is cancelled.
 * Triggers notifications to managers/approvers.
 */
class LeaveCancelled extends BaseHrmEvent
{
    public function __construct(
        public Leave $leave,
        ?int $cancellerEmployeeId = null,
        array $metadata = []
    ) {
        parent::__construct($cancellerEmployeeId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'leaves';
    }

    public function getComponentCode(): ?string
    {
        return 'leave-requests';
    }

    public function getActionCode(): string
    {
        return 'cancel';
    }

    public function getEntityId(): int
    {
        return $this->leave->id;
    }

    public function getEntityType(): string
    {
        return 'leave';
    }

    public function getNotificationContext(): array
    {
        $employee = $this->leave->employee;

        return array_merge(parent::getNotificationContext(), [
            'leave_id' => $this->leave->id,
            'employee_id' => $this->leave->employee_id,
            'canceller_employee_id' => $this->getActorEmployeeId(),
            'manager_employee_id' => $employee?->manager_id,
            'department_id' => $employee?->department_id,
        ]);
    }
}
