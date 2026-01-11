<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Attendance;

/**
 * AttendanceLogged Event
 *
 * Dispatched when attendance is logged.
 * Consider using Attendance\AttendancePunchedIn or AttendancePunchedOut for specific actions.
 */
class AttendanceLogged extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        ?int $actorEmployeeId = null,
        array $metadata = []
    ) {
        parent::__construct($actorEmployeeId ?? $attendance->employee_id, $metadata);
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
        return $this->attendance->id;
    }

    public function getEntityType(): string
    {
        return 'attendance';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->attendance->employee_id,
            'department_id' => $this->attendance->employee?->department_id,
            'manager_employee_id' => $this->attendance->employee?->manager_employee_id,
        ]);
    }
}
