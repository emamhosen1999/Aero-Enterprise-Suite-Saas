<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Onboarding;

use Aero\HRM\Models\Onboarding;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * OnboardingStarted Event
 *
 * Dispatched when an onboarding process is initiated for a new employee.
 *
 * Triggers:
 * - Welcome email with onboarding checklist
 * - Manager notification
 * - HR notification
 * - Task assignment notifications
 * - System access provisioning
 */
class OnboardingStarted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Onboarding  $onboarding
     * @param  int|null  $createdBy  User ID who initiated onboarding
     */
    public function __construct(
        public Onboarding $onboarding,
        public ?int $createdBy = null
    ) {}
}
