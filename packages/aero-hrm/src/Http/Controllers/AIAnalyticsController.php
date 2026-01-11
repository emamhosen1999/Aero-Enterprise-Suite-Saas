<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\EmployeeRiskScore;
use Aero\HRM\Models\EngagementSurvey;
use Aero\HRM\Services\AIAnalytics\AttritionPredictionService;
use Aero\HRM\Services\AIAnalytics\AnomalyDetectionService;
use Aero\HRM\Services\AIAnalytics\TalentMobilityService;
use Aero\HRM\Services\AIAnalytics\BurnoutRiskService;
use Aero\HRM\Services\AIAnalytics\SentimentAnalyticsService;
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
            ->where('is_resolved', false)
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
            $query->whereHas('employee', fn ($q) => 
                $q->where('department_id', $request->department_id)
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
            ->where('is_resolved', false);

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
            $query->where('is_resolved', false);
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
            'is_resolved' => true,
            'resolved_at' => now(),
            'resolved_by' => auth()->id(),
            'resolution_notes' => $request->input('notes'),
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
            'is_resolved' => true,
            'resolved_at' => now(),
            'resolved_by' => auth()->id(),
            'resolution_action' => $request->input('action'),
            'resolution_notes' => $request->input('notes'),
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
            'total_employees' => Employee::where('employment_status', 'active')->count(),
            'high_attrition_risk' => $riskScores->where('attrition_risk_score', '>=', 60)->count(),
            'high_burnout_risk' => $riskScores->where('burnout_risk_score', '>=', 60)->count(),
            'unresolved_anomalies' => \Aero\HRM\Models\BehavioralAnomaly::where('is_resolved', false)->count(),
            'unresolved_insights' => AIInsight::where('is_resolved', false)->count(),
            'pending_recommendations' => \Aero\HRM\Models\TalentMobilityRecommendation::where('status', 'pending')->count(),
            'average_engagement' => round($riskScores->avg('engagement_score') ?? 0, 1),
        ];
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
            'attendance_pattern' => 'Attendance Pattern',
            'absence_frequency' => 'Absence Frequency',
            'overtime_spike' => 'Overtime Spike',
            'leave_pattern' => 'Leave Pattern',
            'productivity_variance' => 'Productivity Variance',
        ];
    }

    /**
     * Get insight types
     */
    protected function getInsightTypes(): array
    {
        return [
            'attrition_warning' => 'Attrition Warning',
            'burnout_warning' => 'Burnout Warning',
            'engagement_warning' => 'Engagement Warning',
            'behavioral_anomaly' => 'Behavioral Anomaly',
            'talent_recommendation' => 'Talent Recommendation',
        ];
    }
}
