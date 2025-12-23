<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\Core\Http\Controllers\Controller;
use Aero\HRM\Services\Performance\PerformanceReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function __construct(
        protected PerformanceReviewService $reviewService
    ) {}

    /**
     * Display reviews dashboard.
     */
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;
        $filters = $request->only(['status', 'type', 'period']);
        
        return Inertia::render('Hrm/Performance/Reviews/Index', [
            'myReviews' => fn () => $this->reviewService->getReviewsForEmployee($userId, $filters),
            'pendingReviews' => fn () => $this->reviewService->getPendingReviewsForReviewer($userId),
            'filters' => $filters,
            'reviewTypes' => PerformanceReviewService::REVIEW_TYPES,
        ]);
    }

    /**
     * Show review cycles (admin).
     */
    public function cycles(Request $request): Response
    {
        $filters = $request->only(['status', 'year']);
        
        return Inertia::render('Hrm/Performance/Reviews/Cycles', [
            'cycles' => fn () => $this->reviewService->getReviewCycles($filters),
            'filters' => $filters,
        ]);
    }

    /**
     * Create new review cycle.
     */
    public function createCycle(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', PerformanceReviewService::REVIEW_TYPES),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'self_review_deadline' => 'nullable|date',
            'peer_review_deadline' => 'nullable|date',
            'manager_review_deadline' => 'nullable|date',
            'employee_ids' => 'nullable|array',
            'include_all_employees' => 'nullable|boolean',
        ]);
        
        $validated['created_by'] = $request->user()->id;
        
        $result = $this->reviewService->createReviewCycle($validated);
        
        if ($result['success']) {
            return redirect()->route('hrm.performance.reviews.cycles')
                ->with('success', 'Review cycle created successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to create review cycle');
    }

    /**
     * Show specific review.
     */
    public function show(string $reviewId): Response
    {
        $review = $this->reviewService->getReview($reviewId);
        
        return Inertia::render('Hrm/Performance/Reviews/Show', [
            'review' => $review,
        ]);
    }

    /**
     * Submit self assessment.
     */
    public function submitSelfAssessment(Request $request, string $reviewId)
    {
        $validated = $request->validate([
            'ratings' => 'required|array',
            'ratings.*.criteria_id' => 'required|string',
            'ratings.*.score' => 'required|integer|min:1|max:5',
            'ratings.*.comments' => 'nullable|string',
            'achievements' => 'nullable|string',
            'challenges' => 'nullable|string',
            'development_areas' => 'nullable|string',
            'goals_for_next_period' => 'nullable|string',
        ]);
        
        $result = $this->reviewService->submitSelfAssessment($reviewId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Self assessment submitted');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to submit assessment');
    }

    /**
     * Submit peer feedback.
     */
    public function submitPeerFeedback(Request $request, string $reviewId)
    {
        $validated = $request->validate([
            'ratings' => 'required|array',
            'ratings.*.criteria_id' => 'required|string',
            'ratings.*.score' => 'required|integer|min:1|max:5',
            'ratings.*.comments' => 'nullable|string',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'additional_comments' => 'nullable|string',
        ]);
        
        $validated['reviewer_id'] = $request->user()->id;
        
        $result = $this->reviewService->submitPeerFeedback($reviewId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Peer feedback submitted');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to submit feedback');
    }

    /**
     * Submit manager evaluation.
     */
    public function submitManagerEvaluation(Request $request, string $reviewId)
    {
        $validated = $request->validate([
            'ratings' => 'required|array',
            'overall_rating' => 'required|integer|min:1|max:5',
            'performance_summary' => 'required|string',
            'achievements' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'development_plan' => 'nullable|string',
            'promotion_readiness' => 'nullable|string|in:ready,developing,not_ready',
            'salary_recommendation' => 'nullable|string',
        ]);
        
        $validated['manager_id'] = $request->user()->id;
        
        $result = $this->reviewService->submitManagerEvaluation($reviewId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Manager evaluation submitted');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to submit evaluation');
    }

    /**
     * Acknowledge review (employee).
     */
    public function acknowledge(Request $request, string $reviewId)
    {
        $validated = $request->validate([
            'acknowledged' => 'required|boolean',
            'employee_comments' => 'nullable|string',
            'dispute' => 'nullable|boolean',
            'dispute_reason' => 'nullable|required_if:dispute,true|string',
        ]);
        
        $result = $this->reviewService->acknowledgeReview($reviewId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Review acknowledged');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to acknowledge review');
    }

    /**
     * Calibration view for HR/managers.
     */
    public function calibration(Request $request, string $cycleId): Response
    {
        return Inertia::render('Hrm/Performance/Reviews/Calibration', [
            'cycleId' => $cycleId,
            'calibrationData' => fn () => $this->reviewService->getCalibrationData($cycleId),
        ]);
    }

    /**
     * Apply calibration adjustments.
     */
    public function applyCalibration(Request $request, string $cycleId)
    {
        $validated = $request->validate([
            'adjustments' => 'required|array',
            'adjustments.*.review_id' => 'required|string',
            'adjustments.*.adjusted_rating' => 'required|integer|min:1|max:5',
            'adjustments.*.justification' => 'required|string',
        ]);
        
        $result = $this->reviewService->calibrateRatings($cycleId, $validated['adjustments']);
        
        if ($result['success']) {
            return back()->with('success', 'Calibration applied');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to apply calibration');
    }

    /**
     * Get review analytics.
     */
    public function analytics(Request $request): Response
    {
        $filters = $request->only(['department_id', 'period', 'cycle_id']);
        
        return Inertia::render('Hrm/Performance/Reviews/Analytics', [
            'analytics' => fn () => $this->reviewService->getReviewAnalytics($filters),
            'filters' => $filters,
        ]);
    }
}
