<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Recruitment;

use Aero\HRM\Models\JobApplication;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * ApplicationReceived Event
 *
 * Dispatched when a candidate submits a job application.
 *
 * Triggers:
 * - Acknowledgment email to candidate
 * - Recruiter notification
 * - Hiring manager notification
 * - Application tracking update
 */
class ApplicationReceived
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public JobApplication $application
    ) {}
}
