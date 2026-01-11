<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Performance;

use Aero\HRM\Models\PerformanceReview;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

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
class PerformanceReviewCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public PerformanceReview $review,
        public float $overallRating,
        public ?string $summary = null
    ) {}
}
