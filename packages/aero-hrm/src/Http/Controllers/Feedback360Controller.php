<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\Feedback360;
use Aero\HRM\Models\Feedback360Response;
use Aero\HRM\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * 360 Feedback Controller
 *
 * Manages 360-degree feedback reviews.
 */
class Feedback360Controller extends Controller
{
    /**
     * Display 360 feedback dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('HRM/Feedback360/Index', [
            'title' => '360° Feedback',
        ]);
    }

    /**
     * Get paginated 360 feedback reviews.
     */
    public function paginate(Request $request)
    {
        $perPage = $request->input('perPage', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = Feedback360::query()
            ->with(['employee.department', 'employee.designation', 'createdBy'])
            ->withCount('responses');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('employee', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%"));
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        return response()->json([
            'items' => $query->orderByDesc('created_at')->paginate($perPage),
        ]);
    }

    /**
     * Get 360 feedback statistics.
     */
    public function stats()
    {
        $totalReviews = Feedback360::count();
        $activeReviews = Feedback360::where('status', 'active')->count();
        $completedReviews = Feedback360::where('status', 'completed')->count();
        $pendingResponses = Feedback360Response::where('status', 'pending')->count();
        $averageScore = Feedback360::whereNotNull('overall_score')->avg('overall_score') ?? 0;

        return response()->json([
            'total_reviews' => $totalReviews,
            'active_reviews' => $activeReviews,
            'completed_reviews' => $completedReviews,
            'pending_responses' => $pendingResponses,
            'average_score' => round($averageScore, 2),
        ]);
    }

    /**
     * Create a new 360 feedback review.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'competencies_to_evaluate' => 'nullable|array',
            'questions' => 'nullable|array',
            'self_assessment_required' => 'boolean',
            'manager_assessment_required' => 'boolean',
            'peer_assessment_required' => 'boolean',
            'direct_report_assessment_required' => 'boolean',
            'min_peer_reviewers' => 'nullable|integer|min:1',
            'max_peer_reviewers' => 'nullable|integer|min:1',
            'is_anonymous' => 'boolean',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $validated['status'] = 'draft';
        $validated['created_by'] = auth()->id();

        $feedback = Feedback360::create($validated);

        return response()->json([
            'message' => '360 feedback review created successfully',
            'data' => $feedback->load('employee'),
        ]);
    }

    /**
     * Show a specific 360 feedback review.
     */
    public function show(int $id)
    {
        $feedback = Feedback360::with([
            'employee.department',
            'employee.designation',
            'responses.reviewer',
            'createdBy',
        ])->findOrFail($id);

        return response()->json(['data' => $feedback]);
    }

    /**
     * Update a 360 feedback review.
     */
    public function update(Request $request, int $id)
    {
        $feedback = Feedback360::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'competencies_to_evaluate' => 'nullable|array',
            'questions' => 'nullable|array',
            'self_assessment_required' => 'boolean',
            'manager_assessment_required' => 'boolean',
            'peer_assessment_required' => 'boolean',
            'direct_report_assessment_required' => 'boolean',
            'min_peer_reviewers' => 'nullable|integer|min:1',
            'max_peer_reviewers' => 'nullable|integer|min:1',
            'is_anonymous' => 'boolean',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'nullable|in:draft,active,completed,cancelled',
        ]);

        $feedback->update($validated);

        return response()->json([
            'message' => '360 feedback review updated successfully',
            'data' => $feedback->fresh('employee'),
        ]);
    }

    /**
     * Delete a 360 feedback review.
     */
    public function destroy(int $id)
    {
        $feedback = Feedback360::findOrFail($id);
        $feedback->delete();

        return response()->json(['message' => '360 feedback review deleted successfully']);
    }

    /**
     * Launch a 360 feedback review (send invitations).
     */
    public function launch(int $id)
    {
        $feedback = Feedback360::findOrFail($id);

        if ($feedback->status !== 'draft') {
            return response()->json(['message' => 'Only draft reviews can be launched'], 422);
        }

        $feedback->update(['status' => 'active']);

        // TODO: Send invitation notifications to reviewers

        return response()->json([
            'message' => '360 feedback review launched successfully',
            'data' => $feedback,
        ]);
    }

    /**
     * Add reviewers to a 360 feedback.
     */
    public function addReviewers(Request $request, int $id)
    {
        $feedback = Feedback360::findOrFail($id);

        $validated = $request->validate([
            'reviewers' => 'required|array',
            'reviewers.*.user_id' => 'required|exists:users,id',
            'reviewers.*.reviewer_type' => 'required|in:self,manager,peer,direct_report,external',
            'reviewers.*.relationship_to_employee' => 'nullable|string',
        ]);

        foreach ($validated['reviewers'] as $reviewer) {
            Feedback360Response::create([
                'feedback_360_id' => $feedback->id,
                'reviewer_id' => $reviewer['user_id'],
                'reviewer_type' => $reviewer['reviewer_type'],
                'relationship_to_employee' => $reviewer['relationship_to_employee'] ?? null,
                'status' => 'pending',
                'invited_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Reviewers added successfully',
            'data' => $feedback->fresh('responses'),
        ]);
    }

    /**
     * Submit a 360 feedback response.
     */
    public function submitResponse(Request $request, int $id, int $responseId)
    {
        $response = Feedback360Response::where('feedback_360_id', $id)
            ->findOrFail($responseId);

        $validated = $request->validate([
            'competency_ratings' => 'required|array',
            'question_responses' => 'nullable|array',
            'strengths' => 'nullable|array',
            'areas_for_improvement' => 'nullable|array',
            'overall_rating' => 'nullable|numeric|min:1|max:5',
            'comments' => 'nullable|string',
        ]);

        $validated['submitted_at'] = now();
        $validated['status'] = 'submitted';

        $response->update($validated);

        // Check if all responses are submitted
        $feedback = $response->feedback360;
        $allSubmitted = $feedback->responses()->where('status', '!=', 'submitted')->count() === 0;

        if ($allSubmitted) {
            $this->calculateOverallScore($feedback);
        }

        return response()->json([
            'message' => 'Feedback submitted successfully',
            'data' => $response,
        ]);
    }

    /**
     * Calculate overall score for a completed 360 feedback.
     */
    private function calculateOverallScore(Feedback360 $feedback)
    {
        $responses = $feedback->responses()->whereNotNull('overall_rating')->get();

        if ($responses->isEmpty()) {
            return;
        }

        $overallScore = $responses->avg('overall_rating');

        $feedback->update([
            'overall_score' => $overallScore,
            'status' => 'completed',
            'summary_report' => $this->generateSummaryReport($feedback),
        ]);
    }

    /**
     * Generate summary report for 360 feedback.
     */
    private function generateSummaryReport(Feedback360 $feedback): array
    {
        $responses = $feedback->responses()->whereNotNull('competency_ratings')->get();

        $competencyAverages = [];
        $allStrengths = [];
        $allImprovements = [];

        foreach ($responses as $response) {
            if (is_array($response->competency_ratings)) {
                foreach ($response->competency_ratings as $competency => $rating) {
                    if (! isset($competencyAverages[$competency])) {
                        $competencyAverages[$competency] = [];
                    }
                    $competencyAverages[$competency][] = $rating;
                }
            }

            if (is_array($response->strengths)) {
                $allStrengths = array_merge($allStrengths, $response->strengths);
            }

            if (is_array($response->areas_for_improvement)) {
                $allImprovements = array_merge($allImprovements, $response->areas_for_improvement);
            }
        }

        // Calculate averages
        foreach ($competencyAverages as $competency => $ratings) {
            $competencyAverages[$competency] = round(array_sum($ratings) / count($ratings), 2);
        }

        return [
            'competency_scores' => $competencyAverages,
            'top_strengths' => array_slice(array_count_values($allStrengths), 0, 5),
            'top_improvements' => array_slice(array_count_values($allImprovements), 0, 5),
            'response_count' => $responses->count(),
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Get my pending feedback requests.
     */
    public function myPendingFeedback()
    {
        $responses = Feedback360Response::where('reviewer_id', auth()->id())
            ->where('status', 'pending')
            ->with(['feedback360.employee'])
            ->get();

        return response()->json(['data' => $responses]);
    }
}
