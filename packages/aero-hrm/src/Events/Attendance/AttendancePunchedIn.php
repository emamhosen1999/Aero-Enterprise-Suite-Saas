<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Attendance;

use Aero\HRM\Models\Attendance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

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
class AttendancePunchedIn
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Attendance  $attendance
     * @param  bool  $isLate  Whether the punch-in is late
     * @param  array  $location  Location data (lat, lng, address)
     */
    public function __construct(
        public Attendance $attendance,
        public bool $isLate = false,
        public array $location = []
    ) {}
}
