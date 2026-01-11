<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Attendance;

use Aero\HRM\Models\Attendance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

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
class LateArrivalDetected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Attendance  $attendance
     * @param  int  $lateMinutes  Minutes late
     * @param  \DateTimeInterface  $scheduledTime  Scheduled start time
     * @param  \DateTimeInterface  $actualTime  Actual punch-in time
     */
    public function __construct(
        public Attendance $attendance,
        public int $lateMinutes,
        public \DateTimeInterface $scheduledTime,
        public \DateTimeInterface $actualTime
    ) {}
}
