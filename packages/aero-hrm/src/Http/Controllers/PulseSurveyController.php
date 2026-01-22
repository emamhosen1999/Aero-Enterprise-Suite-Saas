<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\PulseSurvey;
use Aero\HRM\Models\PulseSurveyResponse;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PulseSurveyController extends Controller
{
    /**
     * Display pulse survey management page.
     */
    public function index(Request $request): Response
    {
        $stats = $this->getStats();

        return Inertia::render('HRM/PulseSurveys/Index', [
            'title' => 'Pulse Surveys',
            'stats' => $stats,
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    /**
     * Get paginated surveys.
     */
    public function paginate(Request $request): JsonResponse
    {
        $query = PulseSurvey::query()->with('createdBy');

        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('perPage', 15);
        $surveys = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'surveys' => $surveys->items(),
            'pagination' => [
                'currentPage' => $surveys->currentPage(),
                'lastPage' => $surveys->lastPage(),
                'perPage' => $surveys->perPage(),
                'total' => $surveys->total(),
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
        return [
            'total' => PulseSurvey::count(),
            'active' => PulseSurvey::where('status', 'active')->count(),
            'responses_this_month' => PulseSurveyResponse::where('created_at', '>=', now()->startOfMonth())->count(),
            'avg_completion_rate' => round(PulseSurvey::where('status', 'completed')->avg('completion_rate') ?? 0, 1),
            'positive_sentiment_pct' => $this->getPositiveSentimentPct(),
        ];
    }

    private function getPositiveSentimentPct(): float
    {
        $total = PulseSurveyResponse::where('created_at', '>=', now()->subMonth())->count();

        if ($total === 0) {
            return 0;
        }

        $positive = PulseSurveyResponse::where('created_at', '>=', now()->subMonth())
            ->where('sentiment', 'positive')
            ->count();

        return round(($positive / $total) * 100, 1);
    }

    /**
     * Store a new pulse survey.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:rating,text,multiple_choice,yes_no',
            'questions.*.options' => 'nullable|array',
            'frequency' => 'required|in:weekly,biweekly,monthly,one_time',
            'target_departments' => 'nullable|array',
            'target_designations' => 'nullable|array',
            'is_anonymous' => 'boolean',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'draft';

        $survey = PulseSurvey::create($validated);

        return response()->json([
            'message' => 'Pulse survey created successfully',
            'survey' => $survey,
        ]);
    }

    /**
     * Show survey details with results.
     */
    public function show(int $id): Response
    {
        $survey = PulseSurvey::with(['createdBy', 'responses'])->findOrFail($id);

        return Inertia::render('HRM/PulseSurveys/Show', [
            'title' => $survey->title,
            'survey' => $survey,
            'analytics' => $this->getSurveyAnalytics($survey),
        ]);
    }

    /**
     * Update survey.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $survey = PulseSurvey::findOrFail($id);

        if ($survey->status === 'active' && $survey->responses()->exists()) {
            return response()->json(['message' => 'Cannot edit a survey with responses'], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'questions' => 'required|array|min:1',
            'frequency' => 'required|in:weekly,biweekly,monthly,one_time',
            'target_departments' => 'nullable|array',
            'target_designations' => 'nullable|array',
            'is_anonymous' => 'boolean',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $survey->update($validated);

        return response()->json([
            'message' => 'Pulse survey updated successfully',
            'survey' => $survey->fresh(),
        ]);
    }

    /**
     * Activate survey.
     */
    public function activate(int $id): JsonResponse
    {
        $survey = PulseSurvey::findOrFail($id);
        $survey->update(['status' => 'active']);

        return response()->json([
            'message' => 'Survey activated',
            'survey' => $survey,
        ]);
    }

    /**
     * Pause survey.
     */
    public function pause(int $id): JsonResponse
    {
        $survey = PulseSurvey::findOrFail($id);
        $survey->update(['status' => 'paused']);

        return response()->json([
            'message' => 'Survey paused',
            'survey' => $survey,
        ]);
    }

    /**
     * Complete survey.
     */
    public function complete(int $id): JsonResponse
    {
        $survey = PulseSurvey::findOrFail($id);
        $survey->updateStatistics();
        $survey->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Survey completed',
            'survey' => $survey,
        ]);
    }

    /**
     * Delete survey.
     */
    public function destroy(int $id): JsonResponse
    {
        $survey = PulseSurvey::findOrFail($id);
        $survey->delete();

        return response()->json([
            'message' => 'Survey deleted successfully',
        ]);
    }

    /**
     * Submit survey response (for employees).
     */
    public function submitResponse(Request $request, int $surveyId): JsonResponse
    {
        $survey = PulseSurvey::active()->findOrFail($surveyId);
        $employeeId = Employee::where('user_id', auth()->id())->value('id');

        // Check if already responded
        $existing = PulseSurveyResponse::where('pulse_survey_id', $surveyId)
            ->where('employee_id', $employeeId)
            ->first();

        if ($existing && $existing->is_complete) {
            return response()->json(['message' => 'You have already completed this survey'], 422);
        }

        $validated = $request->validate([
            'responses' => 'required|array',
            'comments' => 'nullable|string',
        ]);

        $response = PulseSurveyResponse::updateOrCreate(
            [
                'pulse_survey_id' => $surveyId,
                'employee_id' => $survey->is_anonymous ? null : $employeeId,
            ],
            [
                'responses' => $validated['responses'],
                'comments' => $validated['comments'] ?? null,
                'is_complete' => true,
            ]
        );

        // Update survey stats
        $survey->updateStatistics();

        return response()->json([
            'message' => 'Thank you for your feedback!',
            'response' => $response,
        ]);
    }

    /**
     * Get surveys for employee to respond to.
     */
    public function myPendingSurveys(): JsonResponse
    {
        $employeeId = Employee::where('user_id', auth()->id())->value('id');
        $employee = Employee::find($employeeId);

        if (! $employee) {
            return response()->json(['surveys' => []]);
        }

        $surveys = PulseSurvey::active()
            ->whereDoesntHave('responses', function ($q) use ($employeeId) {
                $q->where('employee_id', $employeeId)->where('is_complete', true);
            })
            ->get()
            ->filter(fn ($s) => $s->isEmployeeEligible($employee));

        return response()->json([
            'surveys' => $surveys->values(),
        ]);
    }

    /**
     * Get survey analytics.
     */
    private function getSurveyAnalytics(PulseSurvey $survey): array
    {
        $responses = $survey->responses()->where('is_complete', true)->get();

        if ($responses->isEmpty()) {
            return [
                'total_responses' => 0,
                'completion_rate' => 0,
                'sentiment_distribution' => [],
                'question_averages' => [],
            ];
        }

        return [
            'total_responses' => $responses->count(),
            'completion_rate' => $survey->completion_rate,
            'sentiment_distribution' => [
                'positive' => $responses->where('sentiment', 'positive')->count(),
                'neutral' => $responses->where('sentiment', 'neutral')->count(),
                'negative' => $responses->where('sentiment', 'negative')->count(),
            ],
            'avg_score' => round($responses->avg('overall_score'), 2),
        ];
    }

    /**
     * Get analytics dashboard data.
     */
    public function analytics(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subMonths(3)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $responses = PulseSurveyResponse::whereBetween('submitted_at', [$startDate, $endDate])
            ->where('is_complete', true);

        // Sentiment trend
        $sentimentTrend = (clone $responses)
            ->selectRaw("DATE_FORMAT(submitted_at, '%Y-%m') as month, sentiment, COUNT(*) as count")
            ->groupBy('month', 'sentiment')
            ->orderBy('month')
            ->get();

        // Average score trend
        $scoreTrend = (clone $responses)
            ->selectRaw("DATE_FORMAT(submitted_at, '%Y-%m') as month, AVG(overall_score) as avg_score")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_responses' => $responses->count(),
            'avg_score' => round((clone $responses)->avg('overall_score') ?? 0, 2),
            'sentiment_distribution' => [
                'positive' => (clone $responses)->where('sentiment', 'positive')->count(),
                'neutral' => (clone $responses)->where('sentiment', 'neutral')->count(),
                'negative' => (clone $responses)->where('sentiment', 'negative')->count(),
            ],
            'sentiment_trend' => $sentimentTrend,
            'score_trend' => $scoreTrend,
        ]);
    }
}
