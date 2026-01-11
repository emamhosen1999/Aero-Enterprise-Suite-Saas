<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Attendance;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Attendance;

/**
 * AttendancePunchedIn Event
 *
 * Dispatched when an employee punches in (clock in/start work).
 *
 * Triggers:
 * - Attendance confirmation notification
 * - Late arrival detection (if applicable)
 * - Location validation
 * - Manager notification (if configured)
 */
class AttendancePunchedIn extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        public readonly bool $isLate = false,
        public readonly array $location = [],
        array $metadata = []
    ) {
        parent::__construct($attendance->employee_id, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'attendance';
    }

    public function getComponentCode(): ?string
    {
        return 'punch-clock';
    }

    public function getActionCode(): string
    {
        return 'punch-in';
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
            'is_late' => $this->isLate,
            'check_in' => $this->attendance->check_in?->toIso8601String(),
            'location' => $this->location,
        ]);
    }
}
