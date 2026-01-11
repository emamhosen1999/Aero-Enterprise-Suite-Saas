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
        // Actor is passed explicitly; Leave model stores user_id not employee_id
        parent::__construct($actorEmployeeId, $metadata);
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
        // Note: leave->employee() returns User not Employee model
        // Core layer uses EmployeeServiceContract to resolve employee from user_id
        return array_merge(parent::getNotificationContext(), [
            'leave_id' => $this->leave->id,
            'user_id' => $this->leave->user_id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leave_type,
            'from_date' => $this->leave->from_date,
            'to_date' => $this->leave->to_date,
            'days' => $this->leave->no_of_days,
        ]);
    }

    public function getAuditMetadata(): array
    {
        return array_merge(parent::getAuditMetadata(), [
            'user_id' => $this->leave->user_id,
            'leave_type' => $this->leave->leaveSetting?->leave_type ?? $this->leave->leave_type,
            'from_date' => $this->leave->from_date,
            'to_date' => $this->leave->to_date,
            'days' => $this->leave->no_of_days,
            'reason' => $this->leave->reason,
        ]);
    }
}
