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
 *
 * NOTE: Attendance model uses user_id. Employee resolution happens via EmployeeServiceContract.
 */
class LateArrivalDetected extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        public readonly int $lateMinutes,
        public readonly \DateTimeInterface $scheduledTime,
        public readonly \DateTimeInterface $actualTime,
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
        return 'late-arrivals';
    }

    public function getActionCode(): string
    {
        return 'detect';
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
            'late_minutes' => $this->lateMinutes,
            'scheduled_time' => $this->scheduledTime->format('H:i'),
            'actual_time' => $this->actualTime->format('H:i'),
        ]);
    }
}
