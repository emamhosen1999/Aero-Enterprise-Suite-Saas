<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\JobApplication;

/**
 * CandidateApplied Event
 *
 * Dispatched when a candidate submits a job application.
 */
class CandidateApplied extends BaseHrmEvent
{
    public function __construct(
        public readonly JobApplication $application,
        array $metadata = []
    ) {
        // External applicant, no actor employee
        parent::__construct(null, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'recruitment';
    }

    public function getComponentCode(): ?string
    {
        return 'applications';
    }

    public function getActionCode(): string
    {
        return 'create';
    }

    public function getEntityId(): int
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
            'job_id' => $this->application->job_posting_id,
            'candidate_name' => $this->application->candidate_name,
            'candidate_email' => $this->application->candidate_email,
        ]);
    }
}
