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
 *
 * NOTE: Attendance model uses user_id. Employee resolution happens via EmployeeServiceContract.
 */
class AttendancePunchedOut extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        public readonly bool $isEarly = false,
        public readonly bool $hasOvertime = false,
        public readonly ?int $totalMinutes = null,
        public readonly array $location = [],
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
        return 'punch-clock';
    }

    public function getActionCode(): string
    {
        return 'punch-out';
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
            'is_early' => $this->isEarly,
            'has_overtime' => $this->hasOvertime,
            'total_minutes' => $this->totalMinutes,
            'punch_out' => $this->attendance->punchout?->toIso8601String(),
            'location' => $this->location,
        ]);
    }
}
