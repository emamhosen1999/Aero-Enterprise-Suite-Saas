<?php

declare(strict_types=1);

namespace Aero\Project\Notifications\Risk;

use Aero\Project\Events\Risk\RiskIdentified;
use Aero\Project\Notifications\BaseProjectNotification;

/**
 * RiskIdentifiedNotification
 *
 * Sent when a project risk is identified.
 * Escalates based on severity to appropriate stakeholders via HRMAC.
 */
class RiskIdentifiedNotification extends BaseProjectNotification
{
    protected string $eventType = 'project.risk.identified';

    protected string $subModuleCode = 'risks';

    protected ?string $componentCode = 'risk-register';

    protected string $actionCode = 'view';

    public function __construct(
        public int $riskId,
        public string $title,
        public int $projectId,
        public string $projectName,
        public string $severity,
        public string $source,
        public ?int $identifiedByUserId
    ) {}

    /**
     * Create from RiskIdentified event.
     */
    public static function fromEvent(RiskIdentified $event, string $projectName): self
    {
        return new self(
            riskId: $event->riskId,
            title: $event->title,
            projectId: $event->projectId,
            projectName: $projectName,
            severity: $event->severity,
            source: $event->source ?? 'manual',
            identifiedByUserId: $event->getActorUserId()
        );
    }

    protected function getMailSubject(): string
    {
        $severityEmoji = match ($this->severity) {
            'critical' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            default => '🟢',
        };

        return "{$severityEmoji} Risk Identified: {$this->title}";
    }

    protected function getMailLine(): string
    {
        $sourceText = $this->source === 'ai_prediction' ? 'AI has detected' : 'A new';

        return "{$sourceText} {$this->severity} severity risk '{$this->title}' has been identified in project '{$this->projectName}'.";
    }

    protected function getMailActionText(): string
    {
        return 'View Risk Details';
    }

    protected function getMailActionUrl(): string
    {
        return route('project.risks.show', ['project' => $this->projectId, 'risk' => $this->riskId]);
    }

    protected function getNotificationData(): array
    {
        return [
            'risk_id' => $this->riskId,
            'title' => $this->title,
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'severity' => $this->severity,
            'source' => $this->source,
            'is_ai_detected' => $this->source === 'ai_prediction',
            'identified_by' => $this->identifiedByUserId,
        ];
    }
}
