<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Safety;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\SafetyIncident;

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
class SafetyIncidentReported extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  SafetyIncident  $incident
     * @param  string  $severity
     * @param  bool  $requiresImmediateAction
     * @param  int|null  $actorEmployeeId  Employee ID who reported the incident
     */
    public function __construct(
        public SafetyIncident $incident,
        public string $severity,
        public bool $requiresImmediateAction = false,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId ?? $incident->reported_by_employee_id);
    }

    public function getSubModuleCode(): string
    {
        return 'safety';
    }

    public function getComponentCode(): ?string
    {
        return 'incidents';
    }

    public function getActionCode(): ?string
    {
        return 'report';
    }

    public function getEntityId(): int|string
    {
        return $this->incident->id;
    }

    public function getEntityType(): string
    {
        return 'safety_incident';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'reported_by_employee_id' => $this->incident->reported_by_employee_id,
            'severity' => $this->severity,
            'requires_immediate_action' => $this->requiresImmediateAction,
            'incident_date' => $this->incident->incident_date?->toDateString(),
            'location' => $this->incident->location ?? null,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
