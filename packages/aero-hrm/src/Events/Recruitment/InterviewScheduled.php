<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Recruitment;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\JobInterview;

/**
 * InterviewScheduled Event
 *
 * Dispatched when an interview is scheduled for a candidate.
 *
 * Triggers:
 * - Interview invitation email to candidate
 * - Calendar invite to interviewers
 * - Reminder notifications
 * - Interview preparation materials
 */
class InterviewScheduled extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  int|null  $actorEmployeeId  Employee ID (HR/recruiter) who scheduled the interview
     */
    public function __construct(
        public JobInterview $interview,
        ?int $actorEmployeeId = null
    ) {
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'recruitment';
    }

    public function getComponentCode(): ?string
    {
        return 'interviews';
    }

    public function getActionCode(): string
    {
        return 'schedule';
    }

    public function getEntityId(): int
    {
        return (int) $this->interview->id;
    }

    public function getEntityType(): string
    {
        return 'job_interview';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'application_id' => $this->interview->application_id,
            'scheduled_at' => $this->interview->scheduled_at?->format('Y-m-d H:i:s'),
            'interview_type' => $this->interview->interview_type,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
