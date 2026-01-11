<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Attendance;

use Aero\HRM\Models\Attendance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

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
class AttendancePunchedOut
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Attendance  $attendance
     * @param  bool  $isEarly  Whether the punch-out is early
     * @param  bool  $hasOvertime  Whether overtime was worked
     * @param  int|null  $totalMinutes  Total minutes worked
     * @param  array  $location  Location data (lat, lng, address)
     */
    public function __construct(
        public Attendance $attendance,
        public bool $isEarly = false,
        public bool $hasOvertime = false,
        public ?int $totalMinutes = null,
        public array $location = []
    ) {}
}
