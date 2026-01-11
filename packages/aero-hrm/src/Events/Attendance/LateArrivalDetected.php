<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Attendance;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Attendance;

/**
 * LateArrivalDetected Event
 *
 * Dispatched when an employee arrives late (punch-in after scheduled time).
 *
 * Triggers:
 * - Late arrival notification to employee
 * - Manager notification
 * - HR notification (if chronic lateness)
 * - Attendance policy application
 */
class LateArrivalDetected extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        public readonly int $lateMinutes,
        public readonly \DateTimeInterface $scheduledTime,
        public readonly \DateTimeInterface $actualTime,
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
        return 'late-arrivals';
    }

    public function getActionCode(): string
    {
        return 'detect';
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
            'late_minutes' => $this->lateMinutes,
            'scheduled_time' => $this->scheduledTime->format('H:i'),
            'actual_time' => $this->actualTime->format('H:i'),
        ]);
    }
}
