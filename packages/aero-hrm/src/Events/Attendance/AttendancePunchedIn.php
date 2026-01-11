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
 *
 * NOTE: Attendance model uses user_id. Employee resolution happens via EmployeeServiceContract.
 */
class AttendancePunchedIn extends BaseHrmEvent
{
    public function __construct(
        public readonly Attendance $attendance,
        public readonly bool $isLate = false,
        public readonly array $location = [],
        ?int $actorEmployeeId = null,
        array $metadata = []
    ) {
        // Actor is resolved from user_id via EmployeeServiceContract in listener
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
        return 'punch-in';
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
            'is_late' => $this->isLate,
            'punch_in' => $this->attendance->punchin?->toIso8601String(),
            'location' => $this->location,
        ]);
    }
}
