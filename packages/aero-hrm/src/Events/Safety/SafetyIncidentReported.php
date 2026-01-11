<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Safety;

use Aero\HRM\Models\SafetyIncident;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * SafetyIncidentReported Event
 *
 * Dispatched when a workplace safety incident is reported.
 *
 * Triggers:
 * - Immediate safety team notification
 * - Manager notification
 * - HR notification
 * - Incident investigation initiation
 * - Corrective action tracking
 */
class SafetyIncidentReported
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public SafetyIncident $incident,
        public string $severity,
        public bool $requiresImmediateAction = false
    ) {}
}
