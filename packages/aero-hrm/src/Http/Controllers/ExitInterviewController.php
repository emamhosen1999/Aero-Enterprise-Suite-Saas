<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\ExitInterview;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Offboarding;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ExitInterviewController extends Controller
{
    /**
     * Display exit interview management page.
     */
    public function index(Request $request): Response
    {
        $stats = $this->getStats();

        return Inertia::render('HRM/ExitInterviews/Index', [
            'title' => 'Exit Interviews',
            'stats' => $stats,
        ]);
    }

    /**
     * Get paginated exit interviews.
     */
    public function paginate(Request $request): JsonResponse
    {
        $query = ExitInterview::query()
            ->with(['employee.department', 'employee.designation', 'interviewer', 'offboarding']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('departure_reason')) {
            $query->where('departure_reason', $request->departure_reason);
        }

        $perPage = $request->input('perPage', 15);
        $interviews = $query->orderByDesc('interview_date')->paginate($perPage);

        return response()->json([
            'interviews' => $interviews->items(),
            'pagination' => [
                'currentPage' => $interviews->currentPage(),
                'lastPage' => $interviews->lastPage(),
                'perPage' => $interviews->perPage(),
                'total' => $interviews->total(),
            ],
        ]);
    }

    /**
     * Get statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->getStats());
    }

    private function getStats(): array
    {
        $completed = ExitInterview::completed();

        return [
            'total' => ExitInterview::count(),
            'scheduled' => ExitInterview::where('status', 'scheduled')->count(),
            'completed' => $completed->count(),
            'avg_satisfaction' => round($completed->avg('overall_satisfaction') ?? 0, 1),
            'would_recommend_pct' => $completed->count() > 0
                ? round(($completed->where('would_recommend', true)->count() / $completed->count()) * 100, 1)
                : 0,
            'top_reason' => ExitInterview::selectRaw('departure_reason, COUNT(*) as cnt')
                ->groupBy('departure_reason')
                ->orderByDesc('cnt')
                ->value('departure_reason'),
        ];
    }

    /**
     * Schedule a new exit interview.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'offboarding_id' => 'nullable|exists:offboardings,id',
            'interview_date' => 'required|date',
            'interviewer_id' => 'required|exists:users,id',
        ]);

        $validated['status'] = 'scheduled';

        $interview = ExitInterview::create($validated);

        return response()->json([
            'message' => 'Exit interview scheduled successfully',
            'interview' => $interview->load(['employee', 'interviewer']),
        ]);
    }

    /**
     * Show exit interview details.
     */
    public function show(int $id): Response
    {
        $interview = ExitInterview::with([
            'employee.department',
            'employee.designation',
            'interviewer',
            'offboarding',
        ])->findOrFail($id);

        return Inertia::render('HRM/ExitInterviews/Show', [
            'title' => 'Exit Interview Details',
            'interview' => $interview,
        ]);
    }

    /**
     * Conduct/complete exit interview.
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        $interview = ExitInterview::findOrFail($id);

        $validated = $request->validate([
            'departure_reason' => 'required|in:better_opportunity,compensation,career_growth,management,work_life_balance,relocation,personal,retirement,health,layoff,termination,other',
            'departure_reason_details' => 'nullable|string',
            'would_recommend' => 'nullable|boolean',
            'would_return' => 'nullable|boolean',
            'overall_satisfaction' => 'nullable|integer|min:1|max:5',
            'management_rating' => 'nullable|integer|min:1|max:5',
            'work_environment_rating' => 'nullable|integer|min:1|max:5',
            'compensation_rating' => 'nullable|integer|min:1|max:5',
            'career_growth_rating' => 'nullable|integer|min:1|max:5',
            'work_life_balance_rating' => 'nullable|integer|min:1|max:5',
            'team_collaboration_rating' => 'nullable|integer|min:1|max:5',
            'liked_most' => 'nullable|string',
            'liked_least' => 'nullable|string',
            'improvement_suggestions' => 'nullable|array',
            'new_employer' => 'nullable|string|max:255',
            'new_position' => 'nullable|string|max:255',
            'new_salary_range' => 'nullable|string|max:100',
            'reason_for_new_job' => 'nullable|string',
            'exit_feedback_summary' => 'nullable|string',
            'confidential_notes' => 'nullable|string',
            'follow_up_required' => 'boolean',
            'follow_up_notes' => 'nullable|string',
        ]);

        $validated['status'] = 'completed';
        $validated['interview_date'] = $interview->interview_date ?? now();

        $interview->update($validated);

        return response()->json([
            'message' => 'Exit interview completed successfully',
            'interview' => $interview->fresh(['employee', 'interviewer']),
        ]);
    }

    /**
     * Update exit interview.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $interview = ExitInterview::findOrFail($id);

        $validated = $request->validate([
            'interview_date' => 'required|date',
            'interviewer_id' => 'required|exists:users,id',
            'status' => 'required|in:scheduled,completed,declined,cancelled',
        ]);

        $interview->update($validated);

        return response()->json([
            'message' => 'Exit interview updated successfully',
            'interview' => $interview->fresh(['employee', 'interviewer']),
        ]);
    }

    /**
     * Delete exit interview.
     */
    public function destroy(int $id): JsonResponse
    {
        $interview = ExitInterview::findOrFail($id);
        $interview->delete();

        return response()->json([
            'message' => 'Exit interview deleted successfully',
        ]);
    }

    /**
     * Get exit interview analytics/trends.
     */
    public function analytics(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subYear()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $interviews = ExitInterview::completed()
            ->whereBetween('interview_date', [$startDate, $endDate]);

        // Departure reasons breakdown
        $reasonsBreakdown = (clone $interviews)
            ->selectRaw('departure_reason, COUNT(*) as count')
            ->groupBy('departure_reason')
            ->get()
            ->pluck('count', 'departure_reason');

        // Average ratings by category
        $avgRatings = [
            'overall' => round($interviews->avg('overall_satisfaction') ?? 0, 1),
            'management' => round($interviews->avg('management_rating') ?? 0, 1),
            'work_environment' => round($interviews->avg('work_environment_rating') ?? 0, 1),
            'compensation' => round($interviews->avg('compensation_rating') ?? 0, 1),
            'career_growth' => round($interviews->avg('career_growth_rating') ?? 0, 1),
            'work_life_balance' => round($interviews->avg('work_life_balance_rating') ?? 0, 1),
            'team_collaboration' => round($interviews->avg('team_collaboration_rating') ?? 0, 1),
        ];

        // Monthly trend
        $monthlyTrend = ExitInterview::completed()
            ->whereBetween('interview_date', [$startDate, $endDate])
            ->selectRaw("DATE_FORMAT(interview_date, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_interviews' => $interviews->count(),
            'reasons_breakdown' => $reasonsBreakdown,
            'avg_ratings' => $avgRatings,
            'monthly_trend' => $monthlyTrend,
            'recommend_rate' => $interviews->count() > 0
                ? round((clone $interviews)->where('would_recommend', true)->count() / $interviews->count() * 100, 1)
                : 0,
            'return_rate' => $interviews->count() > 0
                ? round((clone $interviews)->where('would_return', true)->count() / $interviews->count() * 100, 1)
                : 0,
        ]);
    }
}
