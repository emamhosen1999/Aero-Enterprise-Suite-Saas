<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Offboarding;

use Aero\HRM\Models\Offboarding;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * OffboardingStarted Event
 *
 * Dispatched when an offboarding process begins (resignation or termination).
 *
 * Triggers:
 * - Offboarding checklist notification to employee
 * - Manager notification
 * - HR notification
 * - Asset return reminders
 * - System access review
 * - Exit interview scheduling
 */
class OffboardingStarted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Offboarding  $offboarding
     * @param  string  $reason  'resignation' or 'termination'
     * @param  int|null  $createdBy  User ID who initiated offboarding
     */
    public function __construct(
        public Offboarding $offboarding,
        public string $reason,
        public ?int $createdBy = null
    ) {}
}
