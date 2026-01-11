<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Recruitment;

use Aero\HRM\Models\JobInterview;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * InterviewScheduled Event
 *
 * Dispatched when an interview is scheduled for a candidate.
 *
 * Triggers:
 * - Interview invitation email to candidate
 * - Calendar invite to interviewers
 * - Reminder notifications
 * - Interview preparation materials
 */
class InterviewScheduled
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public JobInterview $interview
    ) {}
}
