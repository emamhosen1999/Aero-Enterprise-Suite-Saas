<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\PulseSurvey;
use Aero\HRM\Models\PulseSurveyResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class PulseSurveyAnalyticsService
{
    /**
     * Create a new pulse survey.
     */
    public function createSurvey(array $data): PulseSurvey
    {
        $survey = PulseSurvey::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'questions' => $data['questions'],
            'target_department_id' => $data['department_id'] ?? null,
            'frequency' => $data['frequency'] ?? 'weekly',
            'is_anonymous' => $data['is_anonymous'] ?? true,
            'start_date' => $data['start_date'] ?? now(),
            'end_date' => $data['end_date'] ?? now()->addDays(7),
            'status' => 'active',
            'created_by' => auth()->id(),
        ]);

        Log::info('Pulse survey created', [
            'survey_id' => $survey->id,
            'title' => $survey->title,
        ]);

        return $survey;
    }

    /**
     * Submit a response to a pulse survey.
     */
    public function submitResponse(PulseSurvey $survey, int $employeeId, array $answers): PulseSurveyResponse
    {
        $existing = PulseSurveyResponse::where('pulse_survey_id', $survey->id)
            ->where('employee_id', $employeeId)
            ->first();

        if ($existing) {
            throw new \RuntimeException('Employee has already responded to this survey.');
        }

        $sentimentScore = $this->calculateSentimentScore($answers);

        $response = PulseSurveyResponse::create([
            'pulse_survey_id' => $survey->id,
            'employee_id' => $survey->is_anonymous ? null : $employeeId,
            'answers' => $answers,
            'sentiment_score' => $sentimentScore,
            'submitted_at' => now(),
        ]);

        Log::info('Pulse survey response submitted', [
            'survey_id' => $survey->id,
            'response_id' => $response->id,
        ]);

        return $response;
    }

    /**
     * Calculate Employee Net Promoter Score (eNPS).
     */
    public function calculateENPS(?int $surveyId = null, ?int $departmentId = null): array
    {
        $query = PulseSurveyResponse::query();

        if ($surveyId) {
            $query->where('pulse_survey_id', $surveyId);
        }

        if ($departmentId) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
        }

        $responses = $query->get();

        if ($responses->isEmpty()) {
            return [
                'enps' => 0,
                'promoters' => 0,
                'passives' => 0,
                'detractors' => 0,
                'total_responses' => 0,
            ];
        }

        $scores = $responses->pluck('sentiment_score')->filter();

        $promoters = $scores->filter(fn ($s) => $s >= 9)->count();
        $passives = $scores->filter(fn ($s) => $s >= 7 && $s < 9)->count();
        $detractors = $scores->filter(fn ($s) => $s < 7)->count();
        $total = $scores->count();

        $enps = $total > 0
            ? round((($promoters - $detractors) / $total) * 100, 1)
            : 0;

        return [
            'enps' => $enps,
            'promoters' => $promoters,
            'promoters_pct' => $total > 0 ? round(($promoters / $total) * 100, 1) : 0,
            'passives' => $passives,
            'passives_pct' => $total > 0 ? round(($passives / $total) * 100, 1) : 0,
            'detractors' => $detractors,
            'detractors_pct' => $total > 0 ? round(($detractors / $total) * 100, 1) : 0,
            'total_responses' => $total,
            'interpretation' => $this->interpretENPS($enps),
        ];
    }

    /**
     * Detect sentiment trends over time.
     */
    public function getSentimentTrend(?int $departmentId = null, int $months = 6): array
    {
        $startDate = now()->subMonths($months)->startOfMonth();

        $query = PulseSurveyResponse::where('submitted_at', '>=', $startDate)
            ->whereNotNull('sentiment_score');

        if ($departmentId) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
        }

        $responses = $query->get();

        $monthlyTrend = $responses->groupBy(fn ($r) => $r->submitted_at->format('Y-m'))
            ->map(function (Collection $monthResponses) {
                return [
                    'avg_score' => round($monthResponses->avg('sentiment_score'), 2),
                    'response_count' => $monthResponses->count(),
                    'min_score' => $monthResponses->min('sentiment_score'),
                    'max_score' => $monthResponses->max('sentiment_score'),
                ];
            })
            ->sortKeys();

        $trendValues = $monthlyTrend->pluck('avg_score')->values()->toArray();
        $trendDirection = $this->detectTrendDirection($trendValues);

        return [
            'period_start' => $startDate->toDateString(),
            'period_end' => now()->toDateString(),
            'monthly_data' => $monthlyTrend->toArray(),
            'overall_avg' => round($responses->avg('sentiment_score') ?? 0, 2),
            'trend_direction' => $trendDirection,
            'total_responses' => $responses->count(),
        ];
    }

    /**
     * Get department comparison for pulse surveys.
     */
    public function getDepartmentComparison(?int $surveyId = null): array
    {
        $query = PulseSurveyResponse::whereNotNull('sentiment_score')
            ->whereHas('employee');

        if ($surveyId) {
            $query->where('pulse_survey_id', $surveyId);
        } else {
            $query->where('submitted_at', '>=', now()->subMonths(3));
        }

        $responses = $query->with('employee.department')->get();

        $byDepartment = $responses->groupBy(fn ($r) => $r->employee?->department_id)
            ->map(function (Collection $deptResponses, $deptId) {
                return [
                    'department_id' => $deptId,
                    'response_count' => $deptResponses->count(),
                    'avg_sentiment' => round($deptResponses->avg('sentiment_score'), 2),
                    'enps' => $this->calculateDeptENPS($deptResponses),
                ];
            })
            ->sortByDesc('avg_sentiment')
            ->values();

        return [
            'departments' => $byDepartment->toArray(),
            'overall_avg' => round($responses->avg('sentiment_score') ?? 0, 2),
            'highest_morale' => $byDepartment->first(),
            'lowest_morale' => $byDepartment->last(),
        ];
    }

    /**
     * Get survey participation rates.
     */
    public function getParticipationRate(PulseSurvey $survey): array
    {
        $targetQuery = Employee::where('status', 'active');
        if ($survey->target_department_id) {
            $targetQuery->where('department_id', $survey->target_department_id);
        }
        $targetCount = $targetQuery->count();

        $responseCount = PulseSurveyResponse::where('pulse_survey_id', $survey->id)->count();

        return [
            'survey_id' => $survey->id,
            'target_employees' => $targetCount,
            'responses_received' => $responseCount,
            'participation_rate' => $targetCount > 0
                ? round(($responseCount / $targetCount) * 100, 1)
                : 0,
            'is_statistically_valid' => $targetCount > 0 && ($responseCount / $targetCount) >= 0.3,
        ];
    }

    /**
     * Identify alert conditions (sudden drops, low scores).
     */
    public function detectAlerts(): array
    {
        $alerts = [];

        $recentResponses = PulseSurveyResponse::where('submitted_at', '>=', now()->subWeeks(2))
            ->whereNotNull('sentiment_score')
            ->with('employee.department')
            ->get();

        $previousResponses = PulseSurveyResponse::whereBetween('submitted_at', [now()->subWeeks(4), now()->subWeeks(2)])
            ->whereNotNull('sentiment_score')
            ->with('employee.department')
            ->get();

        $recentAvg = $recentResponses->avg('sentiment_score') ?? 0;
        $previousAvg = $previousResponses->avg('sentiment_score') ?? 0;

        if ($previousAvg > 0 && $recentAvg < $previousAvg * 0.8) {
            $alerts[] = [
                'type' => 'sentiment_drop',
                'severity' => 'high',
                'message' => 'Overall sentiment dropped by '.round((($previousAvg - $recentAvg) / $previousAvg) * 100, 1).'% in last 2 weeks',
                'current_avg' => round($recentAvg, 2),
                'previous_avg' => round($previousAvg, 2),
            ];
        }

        $deptScores = $recentResponses->groupBy(fn ($r) => $r->employee?->department_id)
            ->map(fn (Collection $g) => $g->avg('sentiment_score'));

        foreach ($deptScores as $deptId => $score) {
            if ($score < 5) {
                $alerts[] = [
                    'type' => 'low_department_score',
                    'severity' => 'medium',
                    'message' => "Department {$deptId} has critically low sentiment score: ".round($score, 2),
                    'department_id' => $deptId,
                    'score' => round($score, 2),
                ];
            }
        }

        return $alerts;
    }

    private function calculateSentimentScore(array $answers): float
    {
        $numericAnswers = collect($answers)->filter(fn ($a) => is_numeric($a));

        if ($numericAnswers->isEmpty()) {
            return 5.0;
        }

        return round($numericAnswers->avg(), 2);
    }

    private function calculateDeptENPS(Collection $responses): float
    {
        $scores = $responses->pluck('sentiment_score')->filter();
        $total = $scores->count();
        if ($total === 0) {
            return 0;
        }

        $promoters = $scores->filter(fn ($s) => $s >= 9)->count();
        $detractors = $scores->filter(fn ($s) => $s < 7)->count();

        return round((($promoters - $detractors) / $total) * 100, 1);
    }

    private function interpretENPS(float $enps): string
    {
        if ($enps >= 50) {
            return 'Excellent';
        }
        if ($enps >= 20) {
            return 'Good';
        }
        if ($enps >= 0) {
            return 'Acceptable';
        }
        if ($enps >= -20) {
            return 'Concerning';
        }

        return 'Critical';
    }

    private function detectTrendDirection(array $values): string
    {
        if (count($values) < 2) {
            return 'stable';
        }

        $lastTwo = array_slice($values, -2);
        $diff = end($lastTwo) - reset($lastTwo);

        if ($diff > 0.5) {
            return 'improving';
        }
        if ($diff < -0.5) {
            return 'declining';
        }

        return 'stable';
    }
}
