<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Leave;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Leave;

/**
 * Leave Approved Event
 *
 * Dispatched when a leave request is approved.
 * Triggers notification to the requesting employee.
 */
class LeaveApproved extends BaseHrmEvent
{
    public function __construct(
        public Leave $leave,
        ?int $approverEmployeeId = null,
        array $metadata = []
    ) {
        parent::__construct($approverEmployeeId, $metadata);
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
        return 'approve';
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
            'approver_employee_id' => $this->getActorEmployeeId(),
            'department_id' => $employee?->department_id,
        ]);
    }
}
