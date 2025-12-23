<?php

namespace Aero\HRM\Services\Performance;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Performance Review Service
 *
 * Manages 360-degree performance reviews, feedback collection,
 * and performance evaluations.
 */
class PerformanceReviewService
{
    /**
     * Review types.
     */
    public const TYPE_ANNUAL = 'annual';
    public const TYPE_MID_YEAR = 'mid_year';
    public const TYPE_QUARTERLY = 'quarterly';
    public const TYPE_PROBATION = 'probation';
    public const TYPE_PROJECT = 'project';
    public const TYPE_CONTINUOUS = 'continuous';

    /**
     * Review statuses.
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SELF_REVIEW = 'self_review';
    public const STATUS_PEER_REVIEW = 'peer_review';
    public const STATUS_MANAGER_REVIEW = 'manager_review';
    public const STATUS_CALIBRATION = 'calibration';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_ACKNOWLEDGED = 'acknowledged';

    /**
     * Reviewer types for 360-degree.
     */
    public const REVIEWER_SELF = 'self';
    public const REVIEWER_MANAGER = 'manager';
    public const REVIEWER_PEER = 'peer';
    public const REVIEWER_DIRECT_REPORT = 'direct_report';
    public const REVIEWER_EXTERNAL = 'external';

    /**
     * Rating scales.
     */
    public const SCALE_5_POINT = '5_point';
    public const SCALE_4_POINT = '4_point';
    public const SCALE_10_POINT = '10_point';
    public const SCALE_CUSTOM = 'custom';

    /**
     * Default rating labels.
     */
    protected array $ratingLabels = [
        1 => 'Needs Improvement',
        2 => 'Developing',
        3 => 'Meets Expectations',
        4 => 'Exceeds Expectations',
        5 => 'Outstanding',
    ];

    /**
     * Create a review cycle.
     */
    public function createReviewCycle(array $data): array
    {
        $cycleId = Str::uuid()->toString();

        $cycle = [
            'id' => $cycleId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? self::TYPE_ANNUAL,
            'period' => [
                'start_date' => Carbon::parse($data['start_date'])->toDateString(),
                'end_date' => Carbon::parse($data['end_date'])->toDateString(),
                'year' => $data['year'] ?? now()->year,
            ],
            'phases' => $this->buildReviewPhases($data['phases'] ?? []),
            'template_id' => $data['template_id'] ?? null,
            'rating_scale' => $data['rating_scale'] ?? self::SCALE_5_POINT,
            'is_360' => $data['is_360'] ?? true,
            'peer_selection' => $data['peer_selection'] ?? 'manager_selected', // self_selected, manager_selected, both
            'min_peers' => $data['min_peers'] ?? 3,
            'max_peers' => $data['max_peers'] ?? 5,
            'include_goals' => $data['include_goals'] ?? true,
            'include_competencies' => $data['include_competencies'] ?? true,
            'eligible_employees' => $data['eligible_employees'] ?? [],
            'excluded_employees' => $data['excluded_employees'] ?? [],
            'status' => 'draft',
            'created_by' => $data['created_by'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];

        Log::info('Review cycle created', [
            'cycle_id' => $cycleId,
            'type' => $cycle['type'],
        ]);

        return ['success' => true, 'cycle' => $cycle];
    }

    /**
     * Start a review for an employee.
     */
    public function initiateReview(string $cycleId, int $employeeId, array $data = []): array
    {
        $reviewId = Str::uuid()->toString();

        $review = [
            'id' => $reviewId,
            'cycle_id' => $cycleId,
            'employee_id' => $employeeId,
            'manager_id' => $data['manager_id'] ?? null,
            'status' => self::STATUS_DRAFT,
            'reviewers' => $this->assignReviewers($employeeId, $data),
            'sections' => $this->buildReviewSections($data['template_id'] ?? null),
            'goals_summary' => $data['goals_summary'] ?? [],
            'competency_ratings' => [],
            'overall_rating' => null,
            'calibrated_rating' => null,
            'strengths' => [],
            'areas_for_improvement' => [],
            'development_plan' => null,
            'acknowledgement' => null,
            'started_at' => now()->toIso8601String(),
            'due_dates' => $this->calculateDueDates($data['phases'] ?? []),
        ];

        Log::info('Review initiated', [
            'review_id' => $reviewId,
            'employee_id' => $employeeId,
            'cycle_id' => $cycleId,
        ]);

        return ['success' => true, 'review' => $review];
    }

    /**
     * Submit self-assessment.
     */
    public function submitSelfAssessment(string $reviewId, array $data): array
    {
        $selfAssessment = [
            'submitted_at' => now()->toIso8601String(),
            'accomplishments' => $data['accomplishments'] ?? [],
            'challenges' => $data['challenges'] ?? [],
            'goals_reflection' => $data['goals_reflection'] ?? null,
            'competency_self_ratings' => $data['competency_ratings'] ?? [],
            'development_goals' => $data['development_goals'] ?? [],
            'feedback_for_manager' => $data['feedback_for_manager'] ?? null,
            'career_aspirations' => $data['career_aspirations'] ?? null,
        ];

        Log::info('Self assessment submitted', [
            'review_id' => $reviewId,
        ]);

        return ['success' => true, 'self_assessment' => $selfAssessment];
    }

    /**
     * Submit peer feedback.
     */
    public function submitPeerFeedback(string $reviewId, int $reviewerId, array $data): array
    {
        $feedback = [
            'id' => Str::uuid()->toString(),
            'review_id' => $reviewId,
            'reviewer_id' => $reviewerId,
            'reviewer_type' => $data['reviewer_type'] ?? self::REVIEWER_PEER,
            'relationship' => $data['relationship'] ?? null,
            'submitted_at' => now()->toIso8601String(),
            'ratings' => $data['ratings'] ?? [],
            'strengths' => $data['strengths'] ?? [],
            'areas_for_improvement' => $data['areas_for_improvement'] ?? [],
            'collaboration_feedback' => $data['collaboration_feedback'] ?? null,
            'additional_comments' => $data['additional_comments'] ?? null,
            'is_anonymous' => $data['is_anonymous'] ?? true,
        ];

        Log::info('Peer feedback submitted', [
            'review_id' => $reviewId,
            'reviewer_id' => $reviewerId,
            'anonymous' => $feedback['is_anonymous'],
        ]);

        return ['success' => true, 'feedback' => $feedback];
    }

    /**
     * Submit manager evaluation.
     */
    public function submitManagerEvaluation(string $reviewId, array $data): array
    {
        $evaluation = [
            'submitted_at' => now()->toIso8601String(),
            'competency_ratings' => $data['competency_ratings'] ?? [],
            'goal_ratings' => $data['goal_ratings'] ?? [],
            'overall_rating' => $data['overall_rating'],
            'rating_justification' => $data['rating_justification'] ?? null,
            'strengths' => $data['strengths'] ?? [],
            'areas_for_improvement' => $data['areas_for_improvement'] ?? [],
            'achievements' => $data['achievements'] ?? [],
            'development_recommendations' => $data['development_recommendations'] ?? [],
            'promotion_readiness' => $data['promotion_readiness'] ?? null,
            'retention_risk' => $data['retention_risk'] ?? null,
            'compensation_recommendation' => $data['compensation_recommendation'] ?? null,
            'comments' => $data['comments'] ?? null,
        ];

        Log::info('Manager evaluation submitted', [
            'review_id' => $reviewId,
            'overall_rating' => $data['overall_rating'],
        ]);

        return ['success' => true, 'evaluation' => $evaluation];
    }

    /**
     * Calibrate ratings.
     */
    public function calibrate(array $reviewIds, array $calibrationData): array
    {
        $calibrations = [];

        foreach ($reviewIds as $reviewId) {
            $calibration = [
                'review_id' => $reviewId,
                'original_rating' => $calibrationData[$reviewId]['original'] ?? null,
                'calibrated_rating' => $calibrationData[$reviewId]['calibrated'] ?? null,
                'adjustment_reason' => $calibrationData[$reviewId]['reason'] ?? null,
                'calibrated_by' => $calibrationData['calibrated_by'] ?? null,
                'calibrated_at' => now()->toIso8601String(),
            ];
            $calibrations[] = $calibration;
        }

        Log::info('Ratings calibrated', [
            'review_count' => count($reviewIds),
        ]);

        return ['success' => true, 'calibrations' => $calibrations];
    }

    /**
     * Complete review and generate summary.
     */
    public function completeReview(string $reviewId, array $data = []): array
    {
        $summary = [
            'review_id' => $reviewId,
            'completed_at' => now()->toIso8601String(),
            'final_rating' => $data['final_rating'] ?? null,
            'rating_label' => $this->getRatingLabel($data['final_rating'] ?? 0),
            'feedback_summary' => $this->aggregateFeedback($reviewId),
            'development_plan' => $data['development_plan'] ?? null,
            'goals_for_next_period' => $data['goals_for_next_period'] ?? [],
            'compensation_impact' => $data['compensation_impact'] ?? null,
        ];

        Log::info('Review completed', [
            'review_id' => $reviewId,
            'final_rating' => $summary['final_rating'],
        ]);

        return ['success' => true, 'summary' => $summary];
    }

    /**
     * Employee acknowledges review.
     */
    public function acknowledgeReview(string $reviewId, int $employeeId, array $data = []): array
    {
        $acknowledgement = [
            'review_id' => $reviewId,
            'employee_id' => $employeeId,
            'acknowledged_at' => now()->toIso8601String(),
            'agrees_with_rating' => $data['agrees'] ?? null,
            'employee_comments' => $data['comments'] ?? null,
            'dispute_requested' => $data['dispute'] ?? false,
            'signature' => $data['signature'] ?? null,
        ];

        Log::info('Review acknowledged', [
            'review_id' => $reviewId,
            'employee_id' => $employeeId,
            'agrees' => $acknowledgement['agrees_with_rating'],
        ]);

        return ['success' => true, 'acknowledgement' => $acknowledgement];
    }

    /**
     * Get review analytics.
     */
    public function getAnalytics(string $cycleId): array
    {
        return [
            'cycle_id' => $cycleId,
            'completion_stats' => [
                'total_reviews' => 0,
                'completed' => 0,
                'in_progress' => 0,
                'not_started' => 0,
                'completion_rate' => 0,
            ],
            'rating_distribution' => [],
            'by_department' => [],
            'average_ratings' => [],
            'calibration_stats' => [],
        ];
    }

    /**
     * Build review phases with dates.
     */
    protected function buildReviewPhases(array $phases): array
    {
        $defaultPhases = [
            ['name' => 'Self Review', 'duration_days' => 7],
            ['name' => 'Peer Feedback', 'duration_days' => 10],
            ['name' => 'Manager Review', 'duration_days' => 7],
            ['name' => 'Calibration', 'duration_days' => 5],
            ['name' => 'Employee Discussion', 'duration_days' => 7],
        ];

        return array_merge($defaultPhases, $phases);
    }

    /**
     * Assign reviewers for 360 feedback.
     */
    protected function assignReviewers(int $employeeId, array $data): array
    {
        $reviewers = [];

        // Self
        $reviewers[] = [
            'id' => Str::uuid()->toString(),
            'reviewer_id' => $employeeId,
            'type' => self::REVIEWER_SELF,
            'status' => 'pending',
        ];

        // Manager
        if (!empty($data['manager_id'])) {
            $reviewers[] = [
                'id' => Str::uuid()->toString(),
                'reviewer_id' => $data['manager_id'],
                'type' => self::REVIEWER_MANAGER,
                'status' => 'pending',
            ];
        }

        // Peers
        foreach ($data['peers'] ?? [] as $peerId) {
            $reviewers[] = [
                'id' => Str::uuid()->toString(),
                'reviewer_id' => $peerId,
                'type' => self::REVIEWER_PEER,
                'status' => 'pending',
            ];
        }

        // Direct reports
        foreach ($data['direct_reports'] ?? [] as $reportId) {
            $reviewers[] = [
                'id' => Str::uuid()->toString(),
                'reviewer_id' => $reportId,
                'type' => self::REVIEWER_DIRECT_REPORT,
                'status' => 'pending',
            ];
        }

        return $reviewers;
    }

    /**
     * Build review sections from template.
     */
    protected function buildReviewSections(?string $templateId): array
    {
        return [
            [
                'id' => 'goals',
                'name' => 'Goals & Objectives',
                'weight' => 40,
                'questions' => [],
            ],
            [
                'id' => 'competencies',
                'name' => 'Core Competencies',
                'weight' => 30,
                'questions' => [],
            ],
            [
                'id' => 'values',
                'name' => 'Company Values',
                'weight' => 20,
                'questions' => [],
            ],
            [
                'id' => 'development',
                'name' => 'Development & Growth',
                'weight' => 10,
                'questions' => [],
            ],
        ];
    }

    /**
     * Calculate due dates for phases.
     */
    protected function calculateDueDates(array $phases): array
    {
        $dueDates = [];
        $currentDate = now();

        foreach ($phases as $phase) {
            $currentDate = $currentDate->addDays($phase['duration_days'] ?? 7);
            $dueDates[$phase['name']] = $currentDate->toDateString();
        }

        return $dueDates;
    }

    /**
     * Get rating label.
     */
    protected function getRatingLabel(float $rating): string
    {
        $roundedRating = (int) round($rating);
        return $this->ratingLabels[$roundedRating] ?? 'Unknown';
    }

    /**
     * Aggregate feedback from all reviewers.
     */
    protected function aggregateFeedback(string $reviewId): array
    {
        return [
            'average_peer_rating' => 0,
            'common_strengths' => [],
            'common_improvements' => [],
            'response_count' => 0,
        ];
    }
}
