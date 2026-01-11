<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Attendance;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Attendance;

/**
 * AttendancePunchedOut Event
 *
 * Dispatched when an employee punches out (clock out/end work).
 *
 * Triggers:
 * - Attendance summary notification
 * - Early departure detection (if applicable)
 * - Overtime detection
 * - Manager notification (if configured)
 */
class AttendancePunchedOut extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        public readonly bool $isEarly = false,
        public readonly bool $hasOvertime = false,
        public readonly ?int $totalMinutes = null,
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
        return 'punch-out';
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
            'is_early' => $this->isEarly,
            'has_overtime' => $this->hasOvertime,
            'total_minutes' => $this->totalMinutes,
            'check_out' => $this->attendance->check_out?->toIso8601String(),
            'location' => $this->location,
        ]);
    }
}
