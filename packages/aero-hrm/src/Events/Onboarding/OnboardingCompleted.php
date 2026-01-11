<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Onboarding;

use Aero\HRM\Models\Onboarding;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * OnboardingCompleted Event
 *
 * Dispatched when all onboarding tasks are completed.
 *
 * Triggers:
 * - Completion congratulations to employee
 * - Manager notification
 * - HR notification
 * - Probation period start (if applicable)
 * - Full system access grant
 */
class OnboardingCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Onboarding  $onboarding
     * @param  \DateTimeInterface  $completedAt
     * @param  int  $daysTaken  Number of days to complete onboarding
     */
    public function __construct(
        public Onboarding $onboarding,
        public \DateTimeInterface $completedAt,
        public int $daysTaken
    ) {}
}
