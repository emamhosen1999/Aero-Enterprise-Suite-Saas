<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Recruitment;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\JobApplication;

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
class ApplicationReceived extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  JobApplication  $application
     */
    public function __construct(
        public JobApplication $application
    ) {
        parent::__construct(null);
    }

    public function getSubModuleCode(): string
    {
        return 'recruitment';
    }

    public function getComponentCode(): ?string
    {
        return 'applications';
    }

    public function getActionCode(): ?string
    {
        return 'receive';
    }

    public function getEntityId(): int|string
    {
        return $this->application->id;
    }

    public function getEntityType(): string
    {
        return 'job_application';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'candidate_name' => $this->application->candidate_name ?? null,
            'candidate_email' => $this->application->candidate_email ?? null,
            'job_posting_id' => $this->application->job_posting_id ?? null,
            'applied_at' => $this->application->created_at?->format('Y-m-d H:i:s'),
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
