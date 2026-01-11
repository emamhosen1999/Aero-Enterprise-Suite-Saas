<?php

namespace Aero\HRM\Events;

use Aero\HRM\Models\Leave;

/**
 * @deprecated Use Aero\HRM\Events\Leave\LeaveRequested instead
 *
 * This legacy event is maintained for backward compatibility.
 * New code should use Events\Leave\LeaveRequested.
 */
class LeaveRequested extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     */
    public function __construct(
        public Leave $leave
    ) {
        // Leave uses user_id, not employee_id
        parent::__construct(null);
    }

    public function getSubModuleCode(): string
    {
        return 'leaves';
    }

    public function getComponentCode(): ?string
    {
        return 'requests';
    }

    public function getActionCode(): string
    {
        return 'request';
    }

    public function getEntityId(): int
    {
        return (int) $this->leave->id;
    }

    public function getEntityType(): string
    {
        return 'leave';
    }
}
