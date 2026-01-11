<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Leave;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Leave;

/**
 * Leave Rejected Event
 *
 * Dispatched when a leave request is rejected.
 * Triggers notification to the requesting employee.
 */
class LeaveRejected extends BaseHrmEvent
{
    public function __construct(
        public Leave $leave,
        ?int $rejectorEmployeeId = null,
        public ?string $rejectionReason = null,
        array $metadata = []
    ) {
        parent::__construct($rejectorEmployeeId, $metadata);
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
        return 'reject';
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
        return array_merge(parent::getNotificationContext(), [
            'leave_id' => $this->leave->id,
            'employee_id' => $this->leave->employee_id,
            'rejector_employee_id' => $this->getActorEmployeeId(),
            'rejection_reason' => $this->rejectionReason,
        ]);
    }
}
