<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Leave;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Leave;

/**
 * Leave Requested Event
 *
 * Dispatched when an employee submits a leave request.
 * Triggers notifications to managers and employees with leave approval access.
 *
 * Note: HRM package only references Employee, never User directly.
 * User resolution happens at notification routing layer via contracts.
 */
class LeaveRequested extends BaseHrmEvent
{
    public function __construct(
        public Leave $leave,
        ?int $actorEmployeeId = null,
        array $metadata = []
    ) {
        // Store employee_id as actor, Core layer resolves to user_id via contract
        parent::__construct($actorEmployeeId ?? $leave->employee_id, $metadata);
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
        return 'create';
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
            'manager_employee_id' => $employee?->manager_id,
            'department_id' => $employee?->department_id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leave_type,
            'from_date' => $this->leave->from_date?->toDateString(),
            'to_date' => $this->leave->to_date?->toDateString(),
            'days' => $this->leave->no_of_days ?? $this->leave->days,
        ]);
    }

    public function getAuditMetadata(): array
    {
        return array_merge(parent::getAuditMetadata(), [
            'employee_id' => $this->leave->employee_id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leave_type,
            'from_date' => $this->leave->from_date?->toDateString(),
            'to_date' => $this->leave->to_date?->toDateString(),
            'days' => $this->leave->no_of_days ?? $this->leave->days,
            'reason' => $this->leave->reason,
        ]);
    }
}
