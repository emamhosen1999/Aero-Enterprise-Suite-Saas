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
        parent::__construct($actorEmployeeId ?? $review->reviewer_employee_id);
    }

    public function getSubModuleCode(): string
    {
        return 'performance';
    }

    public function getComponentCode(): ?string
    {
        return 'reviews';
    }

    public function getActionCode(): ?string
    {
        return 'complete';
    }

    public function getEntityId(): int|string
    {
        return $this->review->id;
    }

    public function getEntityType(): string
    {
        return 'performance_review';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->review->employee_id,
            'reviewer_employee_id' => $this->review->reviewer_employee_id,
            'overall_rating' => $this->overallRating,
            'review_period' => $this->review->review_period ?? null,
        ]);
    }

    public function shouldNotify(): bool
    {
        return true;
    }
}
