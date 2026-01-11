<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Performance;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\PerformanceReview;

/**
 * PerformanceReviewCompleted Event
 *
 * Dispatched when a performance review is completed.
 *
 * Triggers:
 * - Feedback notification to employee
 * - Manager notification
 * - HR notification
 * - Development plan creation
 * - Salary review trigger (if applicable)
 */
class PerformanceReviewCompleted extends BaseHrmEvent
{
    /**
     * Create a new event instance.
     *
     * @param  PerformanceReview  $review
     * @param  float  $overallRating
     * @param  string|null  $summary
     * @param  int|null  $actorEmployeeId  Employee ID (reviewer) who completed the review
     */
    public function __construct(
        public PerformanceReview $review,
        public float $overallRating,
        public ?string $summary = null,
        ?int $actorEmployeeId = null
    ) {
        // PerformanceReview uses user_id fields (employee_id, reviewer_id)
        parent::__construct($actorEmployeeId);
    }

    public function getSubModuleCode(): string
    {
        return 'performance';
    }

    public function getComponentCode(): ?string
    {
        return 'reviews';
    }

    public function getActionCode(): string
    {
        return 'complete';
    }

    public function getEntityId(): int
    {
        return (int) $this->review->id;
    }

    public function getEntityType(): string
    {
        return 'performance_review';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'user_id' => $this->review->employee_id,
            'reviewer_user_id' => $this->review->reviewer_id,
            'overall_rating' => $this->overallRating,
            'review_period_start' => $this->review->review_period_start?->toDateString(),
            'review_period_end' => $this->review->review_period_end?->toDateString(),
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
