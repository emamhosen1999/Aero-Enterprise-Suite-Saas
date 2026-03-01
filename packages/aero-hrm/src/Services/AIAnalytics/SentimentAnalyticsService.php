<?php

namespace Aero\HRM\Services\AIAnalytics;

use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeRiskScore;
use Aero\HRM\Models\EmployeeSentimentRecord;
use Aero\HRM\Models\EngagementSurvey;
use Aero\HRM\Models\EngagementSurveyResponse;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Continuous Engagement Sentiment Analytics Service
 *
 * Analyzes employee sentiment from multiple sources:
 * - Engagement surveys
 * - Pulse checks
 * - Performance review comments
 * - One-on-one meeting notes
 * - Exit interview data
 *
 * Uses keyword analysis and scoring patterns to detect:
 * - Overall sentiment (positive/neutral/negative)
 * - Specific satisfaction dimensions
 * - Trend analysis over time
 * - Early warning signals
 */
class SentimentAnalyticsService
{
    /**
     * Positive sentiment keywords with weights
     */
    protected array $positiveKeywords = [
        'great' => 1.0, 'excellent' => 1.2, 'amazing' => 1.2, 'love' => 1.0,
        'wonderful' => 1.1, 'fantastic' => 1.2, 'enjoy' => 0.9, 'happy' => 1.0,
        'satisfied' => 0.8, 'supportive' => 0.9, 'helpful' => 0.8, 'growth' => 0.9,
        'opportunity' => 0.8, 'appreciate' => 0.9, 'valued' => 1.0, 'proud' => 1.0,
        'exciting' => 0.9, 'inspiring' => 1.0, 'collaborative' => 0.8, 'motivated' => 0.9,
        'empowered' => 0.9, 'flexible' => 0.7, 'balanced' => 0.7, 'respected' => 1.0,
    ];

    /**
     * Negative sentiment keywords with weights
     */
    protected array $negativeKeywords = [
        'frustrated' => -1.0, 'disappointed' => -1.0, 'unhappy' => -1.1, 'stressed' => -0.9,
        'overwhelmed' => -1.0, 'unfair' => -1.1, 'ignored' => -1.2, 'undervalued' => -1.2,
        'burnout' => -1.3, 'exhausted' => -1.1, 'toxic' => -1.4, 'micromanaged' => -1.0,
        'unclear' => -0.7, 'confusing' => -0.7, 'difficult' => -0.6, 'challenging' => -0.4,
        'leave' => -0.8, 'quit' => -1.3, 'resign' => -1.3, 'looking' => -0.5,
        'underpaid' => -1.1, 'overworked' => -1.1, 'no growth' => -1.2, 'stuck' => -1.0,
    ];

    /**
     * Engagement dimensions to analyze
     */
    protected array $engagementDimensions = [
        'work_satisfaction' => ['work', 'tasks', 'projects', 'job', 'role', 'responsibilities'],
        'manager_relationship' => ['manager', 'boss', 'leader', 'supervisor', 'lead'],
        'team_dynamics' => ['team', 'colleagues', 'coworkers', 'collaboration', 'teamwork'],
        'growth_opportunity' => ['growth', 'career', 'promotion', 'learning', 'development', 'skills'],
        'compensation_benefits' => ['salary', 'pay', 'benefits', 'compensation', 'bonus'],
        'work_life_balance' => ['balance', 'flexible', 'hours', 'time', 'family', 'personal'],
        'company_culture' => ['culture', 'values', 'company', 'organization', 'environment'],
        'recognition' => ['recognition', 'appreciated', 'valued', 'acknowledged', 'feedback'],
    ];

    /**
     * Analyze sentiment for an employee
     */
    public function analyzeEmployeeSentiment(Employee $employee): array
    {
        $sentimentRecords = $this->getEmployeeSentimentData($employee);

        if ($sentimentRecords->isEmpty()) {
            return [
                'employee_id' => $employee->id,
                'has_data' => false,
                'message' => 'Insufficient sentiment data available',
            ];
        }

        $aggregatedSentiment = $this->aggregateSentiment($sentimentRecords);
        $dimensionScores = $this->analyzeDimensions($sentimentRecords);
        $trend = $this->calculateTrend($sentimentRecords);
        $warnings = $this->detectWarnings($aggregatedSentiment, $dimensionScores, $trend);

        $result = [
            'employee_id' => $employee->id,
            'has_data' => true,
            'overall_score' => $aggregatedSentiment['score'],
            'sentiment_label' => $aggregatedSentiment['label'],
            'confidence' => $aggregatedSentiment['confidence'],
            'dimension_scores' => $dimensionScores,
            'trend' => $trend,
            'warnings' => $warnings,
            'record_count' => $sentimentRecords->count(),
            'date_range' => [
                'from' => $sentimentRecords->min('recorded_date'),
                'to' => $sentimentRecords->max('recorded_date'),
            ],
        ];

        $this->storeResult($employee, $result);

        return $result;
    }

    /**
     * Analyze text and return sentiment score
     */
    public function analyzeText(string $text): array
    {
        $normalizedText = strtolower(trim($text));
        $words = str_word_count($normalizedText, 1);
        $wordCount = count($words);

        if ($wordCount === 0) {
            return ['score' => 50, 'label' => 'neutral', 'confidence' => 0];
        }

        $positiveScore = 0;
        $negativeScore = 0;
        $matchedPositive = 0;
        $matchedNegative = 0;

        // Check for positive keywords
        foreach ($this->positiveKeywords as $keyword => $weight) {
            if (str_contains($normalizedText, $keyword)) {
                $positiveScore += $weight;
                $matchedPositive++;
            }
        }

        // Check for negative keywords
        foreach ($this->negativeKeywords as $keyword => $weight) {
            if (str_contains($normalizedText, $keyword)) {
                $negativeScore += abs($weight);
                $matchedNegative++;
            }
        }

        // Normalize based on text length
        $lengthFactor = min(1.0, $wordCount / 50);
        $netScore = ($positiveScore - $negativeScore) * $lengthFactor;

        // Convert to 0-100 scale (50 = neutral)
        $normalizedScore = 50 + ($netScore * 10);
        $normalizedScore = max(0, min(100, $normalizedScore));

        // Determine label
        if ($normalizedScore >= 65) {
            $label = 'positive';
        } elseif ($normalizedScore <= 35) {
            $label = 'negative';
        } else {
            $label = 'neutral';
        }

        // Confidence based on matches
        $totalMatches = $matchedPositive + $matchedNegative;
        $confidence = min(100, $totalMatches * 15 + 20);

        return [
            'score' => round($normalizedScore, 1),
            'label' => $label,
            'confidence' => $confidence,
            'positive_indicators' => $matchedPositive,
            'negative_indicators' => $matchedNegative,
        ];
    }

    /**
     * Process survey responses and generate sentiment records
     */
    public function processSurveyResponses(EngagementSurvey $survey): array
    {
        $responses = EngagementSurveyResponse::query()
            ->where('survey_id', $survey->id)
            ->whereNotNull('response_text')
            ->get();

        $processed = 0;

        foreach ($responses as $response) {
            $sentiment = $this->analyzeText($response->response_text);

            // Store as sentiment record
            EmployeeSentimentRecord::create([
                'employee_id' => $response->employee_id,
                'source_type' => 'survey',
                'source_id' => $survey->id,
                'sentiment_score' => $sentiment['score'],
                'sentiment_label' => $sentiment['label'],
                'confidence_score' => $sentiment['confidence'],
                'raw_text' => $response->response_text,
                'dimension_scores' => $this->analyzeDimensionsForText($response->response_text),
                'recorded_date' => $response->created_at->toDateString(),
            ]);

            $processed++;
        }

        return [
            'survey_id' => $survey->id,
            'responses_processed' => $processed,
        ];
    }

    /**
     * Get department sentiment summary
     */
    public function getDepartmentSentiment(int $departmentId): array
    {
        $employees = Employee::where('department_id', $departmentId)
            ->where('employment_status', 'active')
            ->pluck('id');

        $records = EmployeeSentimentRecord::query()
            ->whereIn('employee_id', $employees)
            ->where('recorded_date', '>=', now()->subDays(90))
            ->get();

        if ($records->isEmpty()) {
            return [
                'department_id' => $departmentId,
                'has_data' => false,
            ];
        }

        $avgScore = round($records->avg('sentiment_score'), 1);

        return [
            'department_id' => $departmentId,
            'has_data' => true,
            'average_score' => $avgScore,
            'sentiment_label' => $this->scoreToLabel($avgScore),
            'employee_count' => $employees->count(),
            'record_count' => $records->count(),
            'distribution' => [
                'positive' => $records->where('sentiment_label', 'positive')->count(),
                'neutral' => $records->where('sentiment_label', 'neutral')->count(),
                'negative' => $records->where('sentiment_label', 'negative')->count(),
            ],
            'dimension_averages' => $this->calculateDimensionAverages($records),
        ];
    }

    /**
     * Get organization-wide sentiment trends
     */
    public function getOrganizationTrends(int $days = 90): array
    {
        $records = EmployeeSentimentRecord::query()
            ->where('recorded_date', '>=', now()->subDays($days))
            ->orderBy('recorded_date')
            ->get();

        // Group by week
        $weeklyData = $records->groupBy(function ($record) {
            return Carbon::parse($record->recorded_date)->startOfWeek()->format('Y-m-d');
        });

        $trends = [];
        foreach ($weeklyData as $week => $weekRecords) {
            $trends[] = [
                'week' => $week,
                'average_score' => round($weekRecords->avg('sentiment_score'), 1),
                'record_count' => $weekRecords->count(),
                'positive_ratio' => round($weekRecords->where('sentiment_label', 'positive')->count() / $weekRecords->count() * 100, 1),
            ];
        }

        // Calculate overall trend
        $firstHalf = collect($trends)->take(count($trends) / 2);
        $secondHalf = collect($trends)->skip(count($trends) / 2);

        $trendDirection = 'stable';
        if ($firstHalf->isNotEmpty() && $secondHalf->isNotEmpty()) {
            $firstAvg = $firstHalf->avg('average_score');
            $secondAvg = $secondHalf->avg('average_score');
            $diff = $secondAvg - $firstAvg;

            if ($diff > 3) {
                $trendDirection = 'improving';
            } elseif ($diff < -3) {
                $trendDirection = 'declining';
            }
        }

        return [
            'period_days' => $days,
            'total_records' => $records->count(),
            'overall_average' => round($records->avg('sentiment_score') ?? 0, 1),
            'trend_direction' => $trendDirection,
            'weekly_data' => $trends,
        ];
    }

    /**
     * Identify engagement issues requiring attention
     */
    public function identifyEngagementIssues(): Collection
    {
        $issues = collect();

        // Low sentiment employees
        $lowSentimentEmployees = EmployeeSentimentRecord::query()
            ->with('employee.department')
            ->where('recorded_date', '>=', now()->subDays(60))
            ->select('employee_id')
            ->selectRaw('AVG(sentiment_score) as avg_score')
            ->groupBy('employee_id')
            ->having('avg_score', '<', 35)
            ->get();

        foreach ($lowSentimentEmployees as $record) {
            $issues->push([
                'type' => 'low_employee_sentiment',
                'severity' => 'high',
                'employee_id' => $record->employee_id,
                'score' => round($record->avg_score, 1),
            ]);
        }

        // Declining sentiment (comparing recent vs older)
        $employees = Employee::where('employment_status', 'active')->pluck('id');

        foreach ($employees as $employeeId) {
            $recent = EmployeeSentimentRecord::query()
                ->where('employee_id', $employeeId)
                ->where('recorded_date', '>=', now()->subDays(30))
                ->avg('sentiment_score');

            $older = EmployeeSentimentRecord::query()
                ->where('employee_id', $employeeId)
                ->whereBetween('recorded_date', [now()->subDays(90), now()->subDays(30)])
                ->avg('sentiment_score');

            if ($recent !== null && $older !== null) {
                $decline = $older - $recent;
                if ($decline >= 15) {
                    $issues->push([
                        'type' => 'sentiment_decline',
                        'severity' => $decline >= 25 ? 'high' : 'medium',
                        'employee_id' => $employeeId,
                        'decline' => round($decline, 1),
                        'current_score' => round($recent, 1),
                        'previous_score' => round($older, 1),
                    ]);
                }
            }
        }

        // Create AI insights for critical issues
        foreach ($issues->where('severity', 'high') as $issue) {
            $this->createInsightForIssue($issue);
        }

        return $issues;
    }

    /**
     * Get employee sentiment data
     */
    protected function getEmployeeSentimentData(Employee $employee): Collection
    {
        return EmployeeSentimentRecord::query()
            ->where('employee_id', $employee->id)
            ->where('recorded_date', '>=', now()->subDays(180))
            ->orderBy('recorded_date')
            ->get();
    }

    /**
     * Aggregate sentiment from multiple records
     */
    protected function aggregateSentiment(Collection $records): array
    {
        // Weight recent records more heavily
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($records as $record) {
            $daysAgo = Carbon::parse($record->recorded_date)->diffInDays(now());
            $weight = max(0.5, 1 - ($daysAgo / 365));

            $weightedSum += $record->sentiment_score * $weight;
            $totalWeight += $weight;
        }

        $avgScore = $totalWeight > 0 ? $weightedSum / $totalWeight : 50;

        return [
            'score' => round($avgScore, 1),
            'label' => $this->scoreToLabel($avgScore),
            'confidence' => min(100, 40 + ($records->count() * 5)),
        ];
    }

    /**
     * Analyze sentiment by dimensions
     */
    protected function analyzeDimensions(Collection $records): array
    {
        $dimensionScores = [];

        foreach ($this->engagementDimensions as $dimension => $keywords) {
            $relevantRecords = $records->filter(function ($record) use ($keywords) {
                if (! $record->raw_text) {
                    return false;
                }
                $text = strtolower($record->raw_text);
                foreach ($keywords as $keyword) {
                    if (str_contains($text, $keyword)) {
                        return true;
                    }
                }

                return false;
            });

            if ($relevantRecords->isNotEmpty()) {
                $dimensionScores[$dimension] = round($relevantRecords->avg('sentiment_score'), 1);
            }
        }

        return $dimensionScores;
    }

    /**
     * Analyze dimensions for a single text
     */
    protected function analyzeDimensionsForText(string $text): array
    {
        $text = strtolower($text);
        $dimensions = [];

        foreach ($this->engagementDimensions as $dimension => $keywords) {
            $mentioned = false;
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    $mentioned = true;
                    break;
                }
            }
            if ($mentioned) {
                $dimensions[$dimension] = $this->analyzeText($text)['score'];
            }
        }

        return $dimensions;
    }

    /**
     * Calculate sentiment trend
     */
    protected function calculateTrend(Collection $records): array
    {
        if ($records->count() < 3) {
            return ['direction' => 'insufficient_data', 'change' => 0];
        }

        $sortedRecords = $records->sortBy('recorded_date');
        $halfPoint = ceil($sortedRecords->count() / 2);

        $olderHalf = $sortedRecords->take($halfPoint);
        $newerHalf = $sortedRecords->skip($halfPoint);

        $olderAvg = $olderHalf->avg('sentiment_score');
        $newerAvg = $newerHalf->avg('sentiment_score');
        $change = $newerAvg - $olderAvg;

        if ($change > 5) {
            $direction = 'improving';
        } elseif ($change < -5) {
            $direction = 'declining';
        } else {
            $direction = 'stable';
        }

        return [
            'direction' => $direction,
            'change' => round($change, 1),
            'older_period_avg' => round($olderAvg, 1),
            'recent_period_avg' => round($newerAvg, 1),
        ];
    }

    /**
     * Detect warning signals
     */
    protected function detectWarnings(array $sentiment, array $dimensions, array $trend): array
    {
        $warnings = [];

        if ($sentiment['score'] < 35) {
            $warnings[] = 'Overall sentiment is critically low';
        } elseif ($sentiment['score'] < 45) {
            $warnings[] = 'Overall sentiment is below healthy threshold';
        }

        if ($trend['direction'] === 'declining' && $trend['change'] < -10) {
            $warnings[] = 'Significant sentiment decline detected';
        }

        // Check for specific dimension issues
        foreach ($dimensions as $dimension => $score) {
            if ($score < 35) {
                $formattedDimension = str_replace('_', ' ', $dimension);
                $warnings[] = "Low satisfaction in: {$formattedDimension}";
            }
        }

        return $warnings;
    }

    /**
     * Convert score to label
     */
    protected function scoreToLabel(float $score): string
    {
        if ($score >= 65) {
            return 'positive';
        } elseif ($score <= 35) {
            return 'negative';
        }

        return 'neutral';
    }

    /**
     * Calculate dimension averages across records
     */
    protected function calculateDimensionAverages(Collection $records): array
    {
        $allDimensions = [];

        foreach ($records as $record) {
            if ($record->dimension_scores) {
                $dims = is_array($record->dimension_scores)
                    ? $record->dimension_scores
                    : json_decode($record->dimension_scores, true);

                if ($dims) {
                    foreach ($dims as $dim => $score) {
                        $allDimensions[$dim][] = $score;
                    }
                }
            }
        }

        $averages = [];
        foreach ($allDimensions as $dim => $scores) {
            $averages[$dim] = round(array_sum($scores) / count($scores), 1);
        }

        return $averages;
    }

    /**
     * Store sentiment analysis result
     */
    protected function storeResult(Employee $employee, array $result): void
    {
        EmployeeRiskScore::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'engagement_score' => $result['overall_score'],
                'engagement_factors' => [
                    'dimensions' => $result['dimension_scores'],
                    'trend' => $result['trend'],
                    'warnings' => $result['warnings'],
                ],
                'engagement_calculated_at' => now(),
            ]
        );
    }

    /**
     * Create AI insight for engagement issue
     */
    protected function createInsightForIssue(array $issue): void
    {
        $employee = Employee::find($issue['employee_id']);
        if (! $employee) {
            return;
        }

        $title = match ($issue['type']) {
            'low_employee_sentiment' => "Low Engagement: {$employee->full_name}",
            'sentiment_decline' => "Engagement Decline: {$employee->full_name}",
            default => "Engagement Issue: {$employee->full_name}",
        };

        $description = match ($issue['type']) {
            'low_employee_sentiment' => "Employee shows consistently low engagement sentiment (score: {$issue['score']})",
            'sentiment_decline' => "Employee engagement declined by {$issue['decline']} points (from {$issue['previous_score']} to {$issue['current_score']})",
            default => 'Engagement issue detected',
        };

        AIInsight::create([
            'insight_type' => 'engagement_warning',
            'severity' => $issue['severity'],
            'scope' => 'employee',
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'title' => $title,
            'description' => $description,
            'data_points' => $issue,
            'recommended_actions' => [
                'Schedule 1:1 conversation to understand concerns',
                'Review recent workload and assignments',
                'Consider career development discussion',
            ],
            'confidence_score' => 75,
            'insight_date' => now()->toDateString(),
        ]);
    }
}
