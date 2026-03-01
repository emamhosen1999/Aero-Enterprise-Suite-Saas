<?php

declare(strict_types=1);

namespace Aero\Project\Events\Risk;

use Aero\Project\Events\BaseProjectEvent;

/**
 * RiskIdentified Event
 *
 * Dispatched when a new project risk is identified (manually or by AI).
 *
 * Triggers:
 * - Risk assessment workflow
 * - Project manager alert
 * - Risk register update
 * - Audit log entry
 *
 * HRMAC Routing: Users with project.risks.create access
 */
class RiskIdentified extends BaseProjectEvent
{
    /**
     * @param  int  $riskId  The project risk ID
     * @param  int  $projectId  The project ID
     * @param  string  $severity  Risk severity (low, medium, high, critical)
     * @param  string  $title  Risk title
     * @param  string|null  $source  Source of risk identification (manual, ai_prediction, threshold_breach)
     */
    public function __construct(
        public int $riskId,
        public int $projectId,
        public string $severity,
        public string $title,
        public ?string $source = 'manual',
        ?int $identifiedByUserId = null,
        array $metadata = []
    ) {
        parent::__construct($identifiedByUserId, array_merge($metadata, [
            'severity' => $severity,
            'source' => $source,
        ]));
    }

    public function getSubModuleCode(): string
    {
        return 'risks';
    }

    public function getComponentCode(): ?string
    {
        return 'risk-register';
    }

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
    {
        return $this->riskId;
    }

    public function getEntityType(): string
    {
        return 'project_risk';
    }

    public function getProjectId(): int
    {
        return $this->projectId;
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'risk_id' => $this->riskId,
            'project_id' => $this->projectId,
            'severity' => $this->severity,
            'title' => $this->title,
            'source' => $this->source,
            'is_ai_detected' => $this->source === 'ai_prediction',
        ]);
    }

    public function shouldNotify(): bool
    {
        // Always notify for medium+ severity risks
        return in_array($this->severity, ['medium', 'high', 'critical']);
    }
}
