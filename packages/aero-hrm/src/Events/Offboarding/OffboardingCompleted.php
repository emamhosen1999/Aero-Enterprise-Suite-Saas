<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Offboarding;

use Aero\HRM\Models\Offboarding;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * OffboardingCompleted Event
 *
 * Dispatched when all offboarding tasks are completed.
 *
 * Triggers:
 * - Final settlement processing
 * - System access revocation
 * - Asset clearance confirmation
 * - Exit interview completion
 * - Manager notification
 * - HR notification
 */
class OffboardingCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Offboarding  $offboarding
     * @param  \DateTimeInterface  $completedAt
     * @param  bool  $allClearancesObtained
     */
    public function __construct(
        public Offboarding $offboarding,
        public \DateTimeInterface $completedAt,
        public bool $allClearancesObtained
    ) {}
}
