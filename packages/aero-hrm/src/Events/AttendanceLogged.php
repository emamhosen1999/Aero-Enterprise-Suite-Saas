<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Attendance;

/**
 * AttendanceLogged Event
 *
 * Dispatched when attendance is logged.
 * Consider using Attendance\AttendancePunchedIn or AttendancePunchedOut for specific actions.
 *
 * NOTE: Attendance model uses user_id. Employee resolution happens via EmployeeServiceContract.
 */
class AttendanceLogged extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        ?int $actorEmployeeId = null,
        array $metadata = []
    ) {
        parent::__construct($actorEmployeeId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'attendance';
    }

    public function getComponentCode(): ?string
    {
        return 'attendance-log';
    }

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
    {
        return (int) $this->attendance->id;
    }

    public function getEntityType(): string
    {
        return 'attendance';
    }

    /**
     * Get the user ID from the attendance record.
     */
    public function getUserId(): ?int
    {
        return $this->attendance->user_id;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'user_id' => $this->attendance->user_id,
        ]);
    }
}
