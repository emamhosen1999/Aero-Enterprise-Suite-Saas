<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeRiskScore;
use Aero\HRM\Models\PulseSurvey;
use Aero\HRM\Models\PulseSurveyResponse;
use Aero\HRM\Services\AIAnalytics\AnomalyDetectionService;
use Aero\HRM\Services\AIAnalytics\AttritionPredictionService;
use Aero\HRM\Services\AIAnalytics\BurnoutRiskService;
use Aero\HRM\Services\AIAnalytics\SentimentAnalyticsService;
use Aero\HRM\Services\AIAnalytics\TalentMobilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AIAnalyticsController extends Controller
{
    public function __construct(
        protected AttritionPredictionService $attritionService,
        protected AnomalyDetectionService $anomalyService,
        protected TalentMobilityService $mobilityService,
        protected BurnoutRiskService $burnoutService,
        protected SentimentAnalyticsService $sentimentService
    ) {}

    /**
     * AI Analytics Dashboard
     */
    public function dashboard(): Response
    {
        $stats = $this->getDashboardStats();
        $recentInsights = AIInsight::query()
            ->with('employee', 'department')
            ->where('status', '!=', 'resolved')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $highRiskEmployees = EmployeeRiskScore::query()
            ->with('employee.department', 'employee.designation')
            ->where(function ($q) {
                $q->where('attrition_risk_score', '>=', 60)
                    ->orWhere('burnout_risk_score', '>=', 60);
            })
            ->orderByRaw('GREATEST(attrition_risk_score, burnout_risk_score) DESC')
            ->limit(10)
            ->get();

        return Inertia::render('HRM/AIAnalytics/Dashboard', [
            'title' => 'AI Analytics Dashboard',
            'stats' => $stats,
            'recentInsights' => $recentInsights,
            'highRiskEmployees' => $highRiskEmployees,
        ]);
    }

    /**
     * Attrition prediction page
     */
    public function attritionPredictions(Request $request): Response
    {
        $query = EmployeeRiskScore::query()
            ->with('employee.department', 'employee.designation')
            ->whereNotNull('attrition_risk_score');

        if ($request->filled('risk_level')) {
            $minScore = match ($request->risk_level) {
                'critical' => 80,
                'high' => 60,
                'moderate' => 40,
                default => 0,
            };
            $maxScore = match ($request->risk_level) {
                'critical' => 100,
                'high' => 79,
                'moderate' => 59,
                default => 39,
            };
            $query->whereBetween('attrition_risk_score', [$minScore, $maxScore]);
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $request->department_id)
            );
        }

        $predictions = $query
            ->orderByDesc('attrition_risk_score')
            ->paginate(20);

        return Inertia::render('HRM/AIAnalytics/AttritionPredictions', [
            'title' => 'Attrition Predictions',
            'predictions' => $predictions,
            'filters' => $request->only(['risk_level', 'department_id']),
            'riskDistribution' => $this->getRiskDistribution('attrition'),
        ]);
    }

    /**
     * Burnout risk page
     */
    public function burnoutRisks(Request $request): Response
    {
        $query = EmployeeRiskScore::query()
            ->with('employee.department', 'employee.designation')
            ->whereNotNull('burnout_risk_score');

        if ($request->filled('risk_level')) {
            $minScore = match ($request->risk_level) {
                'critical' => 80,
                'high' => 60,
                'moderate' => 40,
                default => 0,
            };
            $maxScore = match ($request->risk_level) {
                'critical' => 100,
                'high' => 79,
                'moderate' => 59,
                default => 39,
            };
            $query->whereBetween('burnout_risk_score', [$minScore, $maxScore]);
        }

        $risks = $query
            ->orderByDesc('burnout_risk_score')
            ->paginate(20);

        return Inertia::render('HRM/AIAnalytics/BurnoutRisks', [
            'title' => 'Burnout Risk Analysis',
            'risks' => $risks,
            'filters' => $request->only(['risk_level', 'department_id']),
            'riskDistribution' => $this->getRiskDistribution('burnout'),
        ]);
    }

    /**
     * Behavioral anomalies page
     */
    public function anomalies(Request $request): Response
    {
        $query = \Aero\HRM\Models\BehavioralAnomaly::query()
            ->with('employee.department')
            ->where('status', '!=', 'resolved');

        if ($request->filled('anomaly_type')) {
            $query->where('anomaly_type', $request->anomaly_type);
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        $anomalies = $query
            ->orderByDesc('detected_at')
            ->paginate(20);

        return Inertia::render('HRM/AIAnalytics/Anomalies', [
            'title' => 'Behavioral Anomalies',
            'anomalies' => $anomalies,
            'filters' => $request->only(['anomaly_type', 'severity']),
            'anomalyTypes' => $this->getAnomalyTypes(),
        ]);
    }

    /**
     * Talent mobility recommendations
     */
    public function talentMobility(Request $request): Response
    {
        $query = \Aero\HRM\Models\TalentMobilityRecommendation::query()
            ->with('employee.department', 'employee.designation', 'targetPosition')
            ->where('status', 'pending');

        if ($request->filled('recommendation_type')) {
            $query->where('recommendation_type', $request->recommendation_type);
        }

        $recommendations = $query
            ->orderByDesc('match_score')
            ->paginate(20);

        return Inertia::render('HRM/AIAnalytics/TalentMobility', [
            'title' => 'Talent Mobility',
            'recommendations' => $recommendations,
            'filters' => $request->only(['recommendation_type']),
            'promotionPipeline' => $this->mobilityService->getPromotionPipeline(),
        ]);
    }

    /**
     * Engagement sentiment page
     */
    public function engagementSentiment(Request $request): Response
    {
        $organizationTrends = $this->sentimentService->getOrganizationTrends(90);

        $departmentSentiments = \Aero\HRM\Models\Department::all()
            ->map(function ($dept) {
                return array_merge(
                    ['department' => $dept],
                    $this->sentimentService->getDepartmentSentiment($dept->id)
                );
            })
            ->filter(fn ($d) => $d['has_data'] ?? false)
            ->sortBy('average_score');

        $engagementIssues = $this->sentimentService->identifyEngagementIssues();

        return Inertia::render('HRM/AIAnalytics/EngagementSentiment', [
            'title' => 'Engagement & Sentiment',
            'organizationTrends' => $organizationTrends,
            'departmentSentiments' => $departmentSentiments->values(),
            'engagementIssues' => $engagementIssues,
        ]);
    }

    /**
     * Employee Net Promoter Score dashboard.
     */
    public function enpsDashboard(Request $request): Response
    {
        $departmentId = $request->integer('department_id') ?: null;
        $surveyId = $request->integer('survey_id') ?: null;

        $baseQuery = PulseSurveyResponse::query()
            ->where('is_complete', true)
            ->whereNotNull('submitted_at');

        if ($surveyId) {
            $baseQuery->where('pulse_survey_id', $surveyId);
        }

        if ($departmentId) {
            $baseQuery->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
        }

        $responses = (clone $baseQuery)->get();

        $scores = $responses
            ->map(fn (PulseSurveyResponse $response) => $this->normalizeEnpsScore($response->overall_score, $response->sentiment))
            ->filter(fn ($score) => $score !== null)
            ->values();

        $total = $scores->count();
        $promoters = $scores->filter(fn ($score) => $score >= 9)->count();
        $passives = $scores->filter(fn ($score) => $score >= 7 && $score < 9)->count();
        $detractors = $scores->filter(fn ($score) => $score < 7)->count();

        $enps = $total > 0
            ? round((($promoters - $detractors) / $total) * 100, 1)
            : 0.0;

        $trend = $responses
            ->groupBy(fn (PulseSurveyResponse $response) => $response->submitted_at?->format('Y-m') ?? 'Unknown')
            ->map(function ($group, $month) {
                $monthScores = collect($group)
                    ->map(fn (PulseSurveyResponse $response) => $this->normalizeEnpsScore($response->overall_score, $response->sentiment))
                    ->filter(fn ($score) => $score !== null)
                    ->values();

                $monthTotal = $monthScores->count();
                $monthPromoters = $monthScores->filter(fn ($score) => $score >= 9)->count();
                $monthDetractors = $monthScores->filter(fn ($score) => $score < 7)->count();

                return [
                    'month' => $month,
                    'responses' => $monthTotal,
                    'enps' => $monthTotal > 0 ? round((($monthPromoters - $monthDetractors) / $monthTotal) * 100, 1) : 0.0,
                    'avg_score' => $monthTotal > 0 ? round($monthScores->avg(), 2) : 0.0,
                ];
            })
            ->sortKeys()
            ->values();

        $departmentBreakdown = Department::query()
            ->select(['id', 'name'])
            ->get()
            ->map(function (Department $department) use ($surveyId) {
                $query = PulseSurveyResponse::query()
                    ->where('is_complete', true)
                    ->whereNotNull('submitted_at')
                    ->whereHas('employee', fn ($q) => $q->where('department_id', $department->id));

                if ($surveyId) {
                    $query->where('pulse_survey_id', $surveyId);
                }

                $scores = $query->get()
                    ->map(fn (PulseSurveyResponse $response) => $this->normalizeEnpsScore($response->overall_score, $response->sentiment))
                    ->filter(fn ($score) => $score !== null)
                    ->values();

                if ($scores->isEmpty()) {
                    return null;
                }

                $deptTotal = $scores->count();
                $deptPromoters = $scores->filter(fn ($score) => $score >= 9)->count();
                $deptDetractors = $scores->filter(fn ($score) => $score < 7)->count();

                return [
                    'department_id' => $department->id,
                    'department_name' => $department->name,
                    'responses' => $deptTotal,
                    'enps' => round((($deptPromoters - $deptDetractors) / $deptTotal) * 100, 1),
                    'avg_score' => round($scores->avg(), 2),
                ];
            })
            ->filter()
            ->sortByDesc('enps')
            ->values();

        return Inertia::render('HRM/AIAnalytics/ENPSDashboard', [
            'title' => 'eNPS Dashboard',
            'enps' => [
                'score' => $enps,
                'total_responses' => $total,
                'promoters' => $promoters,
                'promoters_pct' => $total > 0 ? round(($promoters / $total) * 100, 1) : 0,
                'passives' => $passives,
                'passives_pct' => $total > 0 ? round(($passives / $total) * 100, 1) : 0,
                'detractors' => $detractors,
                'detractors_pct' => $total > 0 ? round(($detractors / $total) * 100, 1) : 0,
            ],
            'trend' => $trend,
            'departmentBreakdown' => $departmentBreakdown,
            'surveys' => PulseSurvey::query()->select(['id', 'title'])->orderByDesc('created_at')->limit(50)->get(),
            'departments' => Department::query()->select(['id', 'name'])->orderBy('name')->get(),
            'filters' => $request->only(['department_id', 'survey_id']),
        ]);
    }

    /**
     * AI Insights list
     */
    public function insights(Request $request): Response
    {
        $query = AIInsight::query()
            ->with('employee', 'department');

        if ($request->filled('insight_type')) {
            $query->where('insight_type', $request->insight_type);
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->boolean('unresolved_only', true)) {
            $query->where('status', '!=', 'resolved');
        }

        $insights = $query
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('HRM/AIAnalytics/Insights', [
            'title' => 'AI Insights',
            'insights' => $insights,
            'filters' => $request->only(['insight_type', 'severity', 'unresolved_only']),
            'insightTypes' => $this->getInsightTypes(),
        ]);
    }

    /**
     * Employee risk profile
     */
    public function employeeRiskProfile(Employee $employee): Response
    {
        $employee->load(['department', 'designation', 'manager', 'riskScore']);

        $attritionAnalysis = $this->attritionService->predictAttritionRisk($employee);
        $burnoutAnalysis = $this->burnoutService->calculateBurnoutRisk($employee);
        $sentimentAnalysis = $this->sentimentService->analyzeEmployeeSentiment($employee);
        $mobilityRecommendations = $this->mobilityService->generateRecommendations($employee);
        $recentAnomalies = $this->anomalyService->getRecentAnomalies($employee->id);

        return Inertia::render('HRM/AIAnalytics/EmployeeRiskProfile', [
            'title' => "Risk Profile: {$employee->full_name}",
            'employee' => $employee,
            'attritionAnalysis' => $attritionAnalysis,
            'burnoutAnalysis' => $burnoutAnalysis,
            'sentimentAnalysis' => $sentimentAnalysis,
            'mobilityRecommendations' => $mobilityRecommendations,
            'recentAnomalies' => $recentAnomalies,
        ]);
    }

    /**
     * Run predictions for all employees
     */
    public function runPredictions(Request $request): JsonResponse
    {
        $type = $request->input('type', 'all');
        $results = [];

        if (in_array($type, ['all', 'attrition'])) {
            $this->attritionService->predictForAllEmployees();
            $results['attrition'] = 'completed';
        }

        if (in_array($type, ['all', 'burnout'])) {
            $this->burnoutService->calculateForAllEmployees();
            $results['burnout'] = 'completed';
        }

        if (in_array($type, ['all', 'anomaly'])) {
            $this->anomalyService->detectForAllEmployees();
            $results['anomaly'] = 'completed';
        }

        return response()->json([
            'message' => 'Predictions completed successfully',
            'results' => $results,
        ]);
    }

    /**
     * Resolve an insight
     */
    public function resolveInsight(AIInsight $insight, Request $request): JsonResponse
    {
        $insight->update([
            'status' => 'resolved',
            'actioned_at' => now(),
            'actioned_by' => auth()->id(),
            'action_taken' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Insight marked as resolved',
        ]);
    }

    /**
     * Resolve an anomaly
     */
    public function resolveAnomaly(\Aero\HRM\Models\BehavioralAnomaly $anomaly, Request $request): JsonResponse
    {
        $anomaly->update([
            'status' => 'reviewed',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Anomaly marked as resolved',
        ]);
    }

    /**
     * Get dashboard statistics
     */
    protected function getDashboardStats(): array
    {
        $riskScores = EmployeeRiskScore::all();

        return [
            'total_employees' => Employee::where('status', 'active')->count(),
            'high_attrition_risk' => $riskScores->where('attrition_risk_score', '>=', 60)->count(),
            'high_burnout_risk' => $riskScores->where('burnout_risk_score', '>=', 60)->count(),
            'unresolved_anomalies' => \Aero\HRM\Models\BehavioralAnomaly::where('status', '!=', 'reviewed')->count(),
            'unresolved_insights' => AIInsight::where('status', '!=', 'resolved')->count(),
            'pending_recommendations' => \Aero\HRM\Models\TalentMobilityRecommendation::where('status', 'pending')->count(),
            'average_engagement' => round($riskScores->avg('engagement_score') ?? 0, 1),
        ];
    }

    protected function normalizeEnpsScore(mixed $overallScore, ?string $sentiment): ?float
    {
        if (is_numeric($overallScore)) {
            $score = (float) $overallScore;

            // Legacy surveys used a 1-5 scale; normalize to 0-10 for eNPS.
            if ($score > 0 && $score <= 5) {
                $score *= 2;
            }

            return max(0.0, min(10.0, $score));
        }

        return match ($sentiment) {
            'positive' => 9.0,
            'neutral' => 8.0,
            'negative' => 5.0,
            default => null,
        };
    }

    /**
     * Get risk distribution
     */
    protected function getRiskDistribution(string $type): array
    {
        $column = $type === 'attrition' ? 'attrition_risk_score' : 'burnout_risk_score';

        $scores = EmployeeRiskScore::whereNotNull($column)->pluck($column);

        return [
            'critical' => $scores->filter(fn ($s) => $s >= 80)->count(),
            'high' => $scores->filter(fn ($s) => $s >= 60 && $s < 80)->count(),
            'moderate' => $scores->filter(fn ($s) => $s >= 40 && $s < 60)->count(),
            'low' => $scores->filter(fn ($s) => $s < 40)->count(),
        ];
    }

    /**
     * Get anomaly types
     */
    protected function getAnomalyTypes(): array
    {
        return [
            'attendance_pattern',
            'absence_frequency',
            'overtime_spike',
            'leave_pattern',
            'productivity_variance',
        ];
    }

    /**
     * Get insight types
     */
    protected function getInsightTypes(): array
    {
        return [
            'attrition_warning',
            'burnout_warning',
            'engagement_warning',
            'behavioral_anomaly',
            'talent_recommendation',
        ];
    }
}

