<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Training;

use Aero\HRM\Models\Training;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * TrainingScheduled Event
 *
 * Dispatched when a training session is scheduled.
 *
 * Triggers:
 * - Training invitation to employees
 * - Calendar invites
 * - Reminder notifications
 * - Training materials distribution
 */
class TrainingScheduled
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Training $training,
        public array $enrolledEmployeeIds = []
    ) {}
}
