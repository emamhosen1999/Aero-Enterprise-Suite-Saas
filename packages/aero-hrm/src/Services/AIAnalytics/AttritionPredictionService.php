<?php

namespace Aero\HRM\Services\AIAnalytics;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeRiskScore;
use Aero\HRM\Models\AttritionPrediction;
use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\PerformanceReview;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Attrition Prediction Service
 * 
 * AI-driven employee attrition risk prediction using multi-factor analysis.
 * Uses statistical models and pattern recognition to predict flight risk.
 * 
 * Key Factors Analyzed:
 * - Tenure patterns (honeymoon period, cliff periods)
 * - Compensation relative to market/peers
 * - Performance trajectory
 * - Engagement indicators
 * - Manager relationship quality
 * - Workload and burnout indicators
 * - Career progression velocity
 * - External market conditions
 */
class AttritionPredictionService
{
    /**
     * Feature weights for attrition prediction model
     * These can be tuned based on historical data
     */
    protected array $featureWeights = [
        'tenure_risk' => 0.15,
        'compensation_gap' => 0.12,
        'performance_trend' => 0.12,
        'engagement_score' => 0.15,
        'manager_rating' => 0.10,
        'workload_stress' => 0.10,
        'promotion_velocity' => 0.08,
        'leave_pattern' => 0.08,
        'absence_anomaly' => 0.05,
        'market_demand' => 0.05,
    ];

    /**
     * Calculate attrition risk for a single employee
     */
    public function predictAttritionRisk(Employee $employee): array
    {
        $features = $this->extractFeatures($employee);
        $riskScore = $this->calculateRiskScore($features);
        $riskLevel = $this->classifyRiskLevel($riskScore);
        
        return [
            'employee_id' => $employee->id,
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'features' => $features,
            'top_factors' => $this->getTopRiskFactors($features),
            'recommended_actions' => $this->generateRecommendations($features, $riskLevel),
        ];
    }

    /**
     * Batch predict attrition risk for all employees
     */
    public function predictForAllEmployees(): Collection
    {
        $employees = Employee::query()
            ->where('employment_status', 'active')
            ->with(['department', 'designation', 'manager'])
            ->get();

        return $employees->map(function (Employee $employee) {
            $prediction = $this->predictAttritionRisk($employee);
            $this->storePrediction($employee, $prediction);
            return $prediction;
        });
    }

    /**
     * Get high-risk employees
     */
    public function getHighRiskEmployees(int $limit = 20): Collection
    {
        return EmployeeRiskScore::query()
            ->with('employee.department', 'employee.designation')
            ->whereIn('flight_risk_level', ['high', 'critical'])
            ->orderByDesc('attrition_risk_score')
            ->limit($limit)
            ->get();
    }

    /**
     * Extract all features for prediction
     */
    protected function extractFeatures(Employee $employee): array
    {
        return [
            'tenure_risk' => $this->calculateTenureRisk($employee),
            'compensation_gap' => $this->calculateCompensationGap($employee),
            'performance_trend' => $this->calculatePerformanceTrend($employee),
            'engagement_score' => $this->calculateEngagementScore($employee),
            'manager_rating' => $this->calculateManagerRating($employee),
            'workload_stress' => $this->calculateWorkloadStress($employee),
            'promotion_velocity' => $this->calculatePromotionVelocity($employee),
            'leave_pattern' => $this->analyzeLeavePattern($employee),
            'absence_anomaly' => $this->detectAbsenceAnomaly($employee),
            'market_demand' => $this->estimateMarketDemand($employee),
        ];
    }

    /**
     * Calculate tenure-based risk
     * High risk at: 1-2 years (post-honeymoon), 5 years (career plateau)
     */
    protected function calculateTenureRisk(Employee $employee): float
    {
        $tenureMonths = $employee->joining_date 
            ? Carbon::parse($employee->joining_date)->diffInMonths(now())
            : 0;

        // Tenure risk curve: peaks at 12-24 months and around 60 months
        if ($tenureMonths < 6) {
            return 20; // New employees, still settling
        } elseif ($tenureMonths < 12) {
            return 40; // First year, evaluating
        } elseif ($tenureMonths < 24) {
            return 70; // 1-2 years, highest risk
        } elseif ($tenureMonths < 36) {
            return 50; // 2-3 years, stabilizing
        } elseif ($tenureMonths < 60) {
            return 30; // 3-5 years, committed
        } elseif ($tenureMonths < 84) {
            return 55; // 5-7 years, potential plateau
        } else {
            return 25; // 7+ years, institutionalized
        }
    }

    /**
     * Calculate compensation gap relative to role average
     */
    protected function calculateCompensationGap(Employee $employee): float
    {
        $salary = $employee->salaryStructure?->basic_salary ?? 0;
        
        if ($salary <= 0) {
            return 50; // Unknown compensation, neutral risk
        }

        // Get average salary for same designation
        $avgSalary = Employee::query()
            ->where('designation_id', $employee->designation_id)
            ->where('employment_status', 'active')
            ->whereHas('salaryStructure')
            ->with('salaryStructure')
            ->get()
            ->avg(fn ($e) => $e->salaryStructure?->basic_salary ?? 0);

        if ($avgSalary <= 0) {
            return 50;
        }

        $gapPercentage = (($avgSalary - $salary) / $avgSalary) * 100;

        // Higher risk if underpaid
        if ($gapPercentage > 20) {
            return 90; // Significantly underpaid
        } elseif ($gapPercentage > 10) {
            return 70; // Moderately underpaid
        } elseif ($gapPercentage > 0) {
            return 50; // Slightly underpaid
        } elseif ($gapPercentage > -10) {
            return 30; // At or above average
        } else {
            return 15; // Well compensated
        }
    }

    /**
     * Calculate performance trend (declining = higher risk)
     */
    protected function calculatePerformanceTrend(Employee $employee): float
    {
        $reviews = PerformanceReview::query()
            ->where('employee_id', $employee->id)
            ->orderByDesc('review_period')
            ->limit(3)
            ->pluck('overall_rating')
            ->toArray();

        if (count($reviews) < 2) {
            return 50; // Not enough data
        }

        // Calculate trend direction
        $latest = $reviews[0] ?? 0;
        $previous = $reviews[1] ?? 0;

        if ($latest < $previous * 0.9) {
            return 80; // Declining performance
        } elseif ($latest < $previous) {
            return 60; // Slight decline
        } elseif ($latest > $previous * 1.1) {
            return 30; // Improving, but may seek growth elsewhere
        } else {
            return 40; // Stable
        }
    }

    /**
     * Calculate engagement score from various sources
     */
    protected function calculateEngagementScore(Employee $employee): float
    {
        // Get recent sentiment data
        $recentSentiment = DB::table('employee_sentiment_records')
            ->where('employee_id', $employee->id)
            ->where('recorded_date', '>=', now()->subMonths(6))
            ->avg('overall_sentiment');

        if ($recentSentiment !== null) {
            // Convert sentiment (-1 to +1) to risk (0 to 100)
            // Negative sentiment = higher risk
            return 50 - ($recentSentiment * 50);
        }

        return 50; // Neutral if no data
    }

    /**
     * Calculate manager relationship quality
     */
    protected function calculateManagerRating(Employee $employee): float
    {
        // Look at manager satisfaction in sentiment records
        $managerSatisfaction = DB::table('employee_sentiment_records')
            ->where('employee_id', $employee->id)
            ->where('recorded_date', '>=', now()->subMonths(6))
            ->whereNotNull('manager_satisfaction')
            ->avg('manager_satisfaction');

        if ($managerSatisfaction !== null) {
            return 50 - ($managerSatisfaction * 50);
        }

        // Check if manager has high turnover on their team
        if ($employee->manager_id) {
            $teamTurnover = Employee::query()
                ->where('manager_id', $employee->manager_id)
                ->where('employment_status', 'terminated')
                ->where('updated_at', '>=', now()->subYear())
                ->count();

            if ($teamTurnover > 3) {
                return 75; // Manager may be a factor
            }
        }

        return 50;
    }

    /**
     * Calculate workload stress indicator
     */
    protected function calculateWorkloadStress(Employee $employee): float
    {
        $metrics = DB::table('employee_workload_metrics')
            ->where('employee_id', $employee->id)
            ->where('metric_date', '>=', now()->subDays(30))
            ->first([
                DB::raw('AVG(utilization_rate) as avg_utilization'),
                DB::raw('AVG(overtime_ratio) as avg_overtime'),
                DB::raw('SUM(consecutive_overtime_flag) as overtime_days'),
            ]);

        if (!$metrics) {
            return 50;
        }

        $stress = 0;
        
        // High utilization = stress
        if ($metrics->avg_utilization > 100) {
            $stress += min(40, ($metrics->avg_utilization - 100) * 2);
        }

        // High overtime = stress
        if ($metrics->avg_overtime > 20) {
            $stress += min(30, $metrics->avg_overtime);
        }

        // Consecutive overtime days
        if ($metrics->overtime_days > 5) {
            $stress += min(30, $metrics->overtime_days * 3);
        }

        return min(100, $stress);
    }

    /**
     * Calculate promotion velocity
     */
    protected function calculatePromotionVelocity(Employee $employee): float
    {
        $tenureYears = $employee->joining_date 
            ? Carbon::parse($employee->joining_date)->diffInYears(now())
            : 0;

        if ($tenureYears < 2) {
            return 50; // Too early to judge
        }

        // Check job history for promotions
        // This is a simplified check - ideally would track actual promotions
        $gradeLevel = $employee->grade?->level ?? 1;
        
        $expectedGrowth = $tenureYears / 3; // Expect growth every 3 years
        $actualGrowth = $gradeLevel - 1;

        if ($actualGrowth < $expectedGrowth * 0.5) {
            return 80; // Stagnant, high risk
        } elseif ($actualGrowth < $expectedGrowth) {
            return 60; // Below expected
        } else {
            return 30; // On track or ahead
        }
    }

    /**
     * Analyze leave patterns for warning signs
     */
    protected function analyzeLeavePattern(Employee $employee): float
    {
        // Look for patterns like: frequent short leaves, Monday/Friday leaves
        $leaves = Leave::query()
            ->where('employee_id', $employee->id)
            ->where('start_date', '>=', now()->subMonths(6))
            ->get();

        if ($leaves->isEmpty()) {
            return 50;
        }

        $risk = 0;

        // Check for interview leave pattern (scattered single days)
        $singleDayLeaves = $leaves->filter(fn ($l) => 
            Carbon::parse($l->start_date)->isSameDay(Carbon::parse($l->end_date))
        )->count();

        if ($singleDayLeaves > 5) {
            $risk += 30; // Possible interview activity
        }

        // Check for Monday/Friday pattern
        $mondayFridayLeaves = $leaves->filter(function ($l) {
            $day = Carbon::parse($l->start_date)->dayOfWeek;
            return $day === 1 || $day === 5;
        })->count();

        if ($mondayFridayLeaves / max(1, $leaves->count()) > 0.5) {
            $risk += 20; // Long weekend pattern
        }

        return min(100, $risk);
    }

    /**
     * Detect unusual absence patterns
     */
    protected function detectAbsenceAnomaly(Employee $employee): float
    {
        // Compare recent absences to historical baseline
        $recentAbsences = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subMonth())
            ->where('status', 'absent')
            ->count();

        $historicalAvg = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subYear())
            ->where('attendance_date', '<', now()->subMonth())
            ->where('status', 'absent')
            ->count() / 11; // Average per month over 11 months

        if ($historicalAvg <= 0) {
            return $recentAbsences > 3 ? 60 : 30;
        }

        $deviation = ($recentAbsences - $historicalAvg) / max(1, $historicalAvg);

        if ($deviation > 1) {
            return min(100, 50 + ($deviation * 25));
        }

        return 30;
    }

    /**
     * Estimate market demand for employee's skills
     */
    protected function estimateMarketDemand(Employee $employee): float
    {
        // High-demand roles have higher attrition risk
        $highDemandRoles = [
            'software engineer', 'developer', 'data scientist', 
            'product manager', 'designer', 'devops'
        ];

        $designation = strtolower($employee->designation?->name ?? '');

        foreach ($highDemandRoles as $role) {
            if (str_contains($designation, $role)) {
                return 70; // High demand = higher risk
            }
        }

        return 40;
    }

    /**
     * Calculate weighted risk score
     */
    protected function calculateRiskScore(array $features): float
    {
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($this->featureWeights as $feature => $weight) {
            if (isset($features[$feature])) {
                $weightedSum += $features[$feature] * $weight;
                $totalWeight += $weight;
            }
        }

        return $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : 50;
    }

    /**
     * Classify risk level
     */
    protected function classifyRiskLevel(float $score): string
    {
        if ($score >= 80) {
            return 'critical';
        } elseif ($score >= 60) {
            return 'high';
        } elseif ($score >= 40) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Get top contributing risk factors
     */
    protected function getTopRiskFactors(array $features): array
    {
        arsort($features);
        
        return array_slice($features, 0, 3, true);
    }

    /**
     * Generate recommendations based on risk factors
     */
    protected function generateRecommendations(array $features, string $riskLevel): array
    {
        $recommendations = [];

        if ($features['compensation_gap'] >= 70) {
            $recommendations[] = 'Review compensation against market rates';
        }

        if ($features['promotion_velocity'] >= 70) {
            $recommendations[] = 'Discuss career growth opportunities';
        }

        if ($features['workload_stress'] >= 70) {
            $recommendations[] = 'Evaluate workload and consider redistribution';
        }

        if ($features['manager_rating'] >= 70) {
            $recommendations[] = 'Consider manager-employee relationship coaching';
        }

        if ($features['engagement_score'] >= 70) {
            $recommendations[] = 'Schedule engagement check-in meeting';
        }

        if ($riskLevel === 'critical') {
            array_unshift($recommendations, 'URGENT: Schedule retention conversation immediately');
        }

        return $recommendations;
    }

    /**
     * Store prediction results
     */
    protected function storePrediction(Employee $employee, array $prediction): void
    {
        // Update or create risk score record
        EmployeeRiskScore::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'attrition_risk_score' => $prediction['risk_score'],
                'attrition_risk_factors' => $prediction['features'],
                'attrition_calculated_at' => now(),
                'flight_risk_level' => $prediction['risk_level'],
                'recommended_actions' => implode("\n", $prediction['recommended_actions']),
            ]
        );

        // Store prediction history
        AttritionPrediction::create([
            'employee_id' => $employee->id,
            'predicted_probability' => $prediction['risk_score'] / 100,
            'prediction_horizon_days' => 90,
            'feature_importance' => $prediction['features'],
            'model_version' => 'v1.0',
            'predicted_at' => now(),
        ]);

        // Create insight if high risk
        if (in_array($prediction['risk_level'], ['high', 'critical'])) {
            AIInsight::create([
                'insight_type' => 'attrition_alert',
                'severity' => $prediction['risk_level'] === 'critical' ? 'critical' : 'high',
                'scope' => 'employee',
                'employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'title' => "High Attrition Risk: {$employee->full_name}",
                'description' => "Employee has a {$prediction['risk_score']}% attrition risk score.",
                'data_points' => $prediction['features'],
                'recommended_actions' => $prediction['recommended_actions'],
                'confidence_score' => 85,
                'insight_date' => now()->toDateString(),
                'valid_until' => now()->addDays(30)->toDateString(),
            ]);
        }
    }
}
