<?php

namespace Aero\HRM\Services\AIAnalytics;

use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeRiskScore;
use Aero\HRM\Models\EmployeeWorkloadMetric;
use Aero\HRM\Models\Leave;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Burnout Risk Modeling Service
 *
 * Predicts employee burnout risk using multi-dimensional analysis:
 * - Workload intensity and duration
 * - Overtime patterns
 * - Leave utilization
 * - Working hours distribution
 * - Recovery time between intense periods
 * - Team and organizational context
 *
 * Uses evidence-based burnout indicators from research.
 */
class BurnoutRiskService
{
    /**
     * Burnout risk factor weights
     */
    protected array $riskWeights = [
        'workload_intensity' => 0.20,
        'overtime_pattern' => 0.18,
        'leave_deprivation' => 0.15,
        'recovery_deficit' => 0.12,
        'work_life_imbalance' => 0.12,
        'sustained_pressure' => 0.10,
        'role_ambiguity' => 0.08,
        'support_deficit' => 0.05,
    ];

    /**
     * Calculate burnout risk for an employee
     */
    public function calculateBurnoutRisk(Employee $employee): array
    {
        $factors = $this->extractBurnoutFactors($employee);
        $riskScore = $this->calculateWeightedScore($factors);
        $riskLevel = $this->classifyRiskLevel($riskScore);
        $recommendations = $this->generateRecommendations($factors, $riskLevel);

        return [
            'employee_id' => $employee->id,
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'factors' => $factors,
            'recommendations' => $recommendations,
            'warning_signs' => $this->identifyWarningSigns($factors),
        ];
    }

    /**
     * Calculate burnout risk for all employees
     */
    public function calculateForAllEmployees(): Collection
    {
        $employees = Employee::where('employment_status', 'active')
            ->with(['department', 'designation'])
            ->get();

        return $employees->map(function (Employee $employee) {
            $result = $this->calculateBurnoutRisk($employee);
            $this->storeResult($employee, $result);

            return $result;
        });
    }

    /**
     * Get high burnout risk employees
     */
    public function getHighRiskEmployees(int $limit = 20): Collection
    {
        return EmployeeRiskScore::query()
            ->with('employee.department', 'employee.designation')
            ->where('burnout_risk_score', '>=', 60)
            ->orderByDesc('burnout_risk_score')
            ->limit($limit)
            ->get();
    }

    /**
     * Get team burnout risk summary
     */
    public function getTeamRiskSummary(int $managerId): array
    {
        $teamMembers = Employee::where('manager_id', $managerId)
            ->where('employment_status', 'active')
            ->with('riskScore')
            ->get();

        $riskScores = $teamMembers
            ->map(fn ($e) => $e->riskScore?->burnout_risk_score ?? 0)
            ->filter(fn ($s) => $s > 0);

        return [
            'team_size' => $teamMembers->count(),
            'average_risk' => round($riskScores->avg() ?? 0, 1),
            'max_risk' => round($riskScores->max() ?? 0, 1),
            'high_risk_count' => $riskScores->filter(fn ($s) => $s >= 60)->count(),
            'critical_risk_count' => $riskScores->filter(fn ($s) => $s >= 80)->count(),
        ];
    }

    /**
     * Extract burnout risk factors
     */
    protected function extractBurnoutFactors(Employee $employee): array
    {
        return [
            'workload_intensity' => $this->calculateWorkloadIntensity($employee),
            'overtime_pattern' => $this->calculateOvertimePattern($employee),
            'leave_deprivation' => $this->calculateLeaveDeprivation($employee),
            'recovery_deficit' => $this->calculateRecoveryDeficit($employee),
            'work_life_imbalance' => $this->calculateWorkLifeImbalance($employee),
            'sustained_pressure' => $this->calculateSustainedPressure($employee),
            'role_ambiguity' => $this->calculateRoleAmbiguity($employee),
            'support_deficit' => $this->calculateSupportDeficit($employee),
        ];
    }

    /**
     * Calculate workload intensity (0-100)
     */
    protected function calculateWorkloadIntensity(Employee $employee): float
    {
        $metrics = EmployeeWorkloadMetric::query()
            ->where('employee_id', $employee->id)
            ->where('metric_date', '>=', now()->subDays(30))
            ->get();

        if ($metrics->isEmpty()) {
            return 40; // Neutral if no data
        }

        $avgUtilization = $metrics->avg('utilization_rate');
        $avgOverdue = $metrics->avg('tasks_overdue');
        $avgMeetingHours = $metrics->avg('meeting_hours');

        // High utilization = risk
        $utilizationRisk = min(40, max(0, ($avgUtilization - 80) * 2));

        // Overdue tasks = stress
        $overdueRisk = min(30, $avgOverdue * 10);

        // Excessive meetings = fragmented time
        $meetingRisk = min(30, max(0, ($avgMeetingHours - 15) * 3));

        return min(100, $utilizationRisk + $overdueRisk + $meetingRisk);
    }

    /**
     * Calculate overtime pattern risk (0-100)
     */
    protected function calculateOvertimePattern(Employee $employee): float
    {
        $overtimeData = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subDays(60))
            ->whereNotNull('overtime_hours')
            ->selectRaw('WEEK(attendance_date) as week, SUM(overtime_hours) as hours, COUNT(*) as days')
            ->groupBy('week')
            ->get();

        if ($overtimeData->isEmpty()) {
            return 20;
        }

        $weeklyHours = $overtimeData->pluck('hours');
        $avgWeeklyOT = $weeklyHours->avg();
        $maxWeeklyOT = $weeklyHours->max();
        $consecutiveWeeks = $overtimeData->filter(fn ($w) => $w->hours >= 10)->count();

        $risk = 0;

        // Average weekly overtime
        if ($avgWeeklyOT >= 20) {
            $risk += 40;
        } elseif ($avgWeeklyOT >= 10) {
            $risk += 25;
        } elseif ($avgWeeklyOT >= 5) {
            $risk += 10;
        }

        // Peak overtime weeks
        if ($maxWeeklyOT >= 30) {
            $risk += 25;
        } elseif ($maxWeeklyOT >= 20) {
            $risk += 15;
        }

        // Consecutive high-OT weeks
        if ($consecutiveWeeks >= 4) {
            $risk += 35;
        } elseif ($consecutiveWeeks >= 2) {
            $risk += 20;
        }

        return min(100, $risk);
    }

    /**
     * Calculate leave deprivation (0-100)
     */
    protected function calculateLeaveDeprivation(Employee $employee): float
    {
        // Days since last leave
        $lastLeave = Leave::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', now())
            ->orderByDesc('end_date')
            ->first();

        $daysSinceLeave = $lastLeave
            ? Carbon::parse($lastLeave->end_date)->diffInDays(now())
            : 365;

        // Leave balance check
        $leaveBalance = DB::table('leave_balances')
            ->where('employee_id', $employee->id)
            ->where('leave_type', 'annual')
            ->sum('balance');

        $accruedButUnused = $leaveBalance;

        $risk = 0;

        // Time since last leave
        if ($daysSinceLeave >= 180) {
            $risk += 50;
        } elseif ($daysSinceLeave >= 90) {
            $risk += 30;
        } elseif ($daysSinceLeave >= 60) {
            $risk += 15;
        }

        // Accumulated leave (not taking time off)
        if ($accruedButUnused >= 20) {
            $risk += 50;
        } elseif ($accruedButUnused >= 15) {
            $risk += 30;
        } elseif ($accruedButUnused >= 10) {
            $risk += 15;
        }

        return min(100, $risk);
    }

    /**
     * Calculate recovery deficit (0-100)
     */
    protected function calculateRecoveryDeficit(Employee $employee): float
    {
        // Check weekend work
        $weekendWork = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subDays(30))
            ->whereRaw('DAYOFWEEK(attendance_date) IN (1, 7)')
            ->count();

        // Check late nights
        $lateNights = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subDays(30))
            ->whereNotNull('check_out')
            ->whereRaw('TIME(check_out) > "20:00:00"')
            ->count();

        $risk = 0;

        // Weekend work
        if ($weekendWork >= 6) {
            $risk += 50;
        } elseif ($weekendWork >= 4) {
            $risk += 35;
        } elseif ($weekendWork >= 2) {
            $risk += 20;
        }

        // Late nights
        if ($lateNights >= 10) {
            $risk += 50;
        } elseif ($lateNights >= 5) {
            $risk += 30;
        } elseif ($lateNights >= 2) {
            $risk += 15;
        }

        return min(100, $risk);
    }

    /**
     * Calculate work-life imbalance (0-100)
     */
    protected function calculateWorkLifeImbalance(Employee $employee): float
    {
        // Average working hours
        $avgHours = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subDays(30))
            ->whereNotNull('total_hours')
            ->avg('total_hours');

        if (! $avgHours) {
            return 30;
        }

        // Standard 8-hour day, anything above 10 is concerning
        if ($avgHours >= 12) {
            return 90;
        } elseif ($avgHours >= 10) {
            return 70;
        } elseif ($avgHours >= 9) {
            return 40;
        }

        return 20;
    }

    /**
     * Calculate sustained pressure duration (0-100)
     */
    protected function calculateSustainedPressure(Employee $employee): float
    {
        // Check how long high-intensity period has lasted
        $metrics = EmployeeWorkloadMetric::query()
            ->where('employee_id', $employee->id)
            ->where('metric_date', '>=', now()->subDays(90))
            ->orderBy('metric_date')
            ->get();

        if ($metrics->isEmpty()) {
            return 30;
        }

        // Count consecutive high-pressure days
        $consecutiveHighPressure = 0;
        $maxConsecutive = 0;

        foreach ($metrics as $metric) {
            if ($metric->utilization_rate >= 100 || $metric->overtime_hours > 2) {
                $consecutiveHighPressure++;
                $maxConsecutive = max($maxConsecutive, $consecutiveHighPressure);
            } else {
                $consecutiveHighPressure = 0;
            }
        }

        // Weeks of sustained pressure
        $weeksUnderPressure = ceil($maxConsecutive / 5);

        if ($weeksUnderPressure >= 8) {
            return 95;
        } elseif ($weeksUnderPressure >= 4) {
            return 75;
        } elseif ($weeksUnderPressure >= 2) {
            return 50;
        }

        return 25;
    }

    /**
     * Calculate role ambiguity (0-100)
     * Based on organizational signals
     */
    protected function calculateRoleAmbiguity(Employee $employee): float
    {
        $risk = 0;

        // Recent org changes
        $recentDesignationChange = $employee->designation_change_date
            ? Carbon::parse($employee->designation_change_date)->diffInDays(now()) < 90
            : false;

        if ($recentDesignationChange) {
            $risk += 30;
        }

        // Recent manager change
        $recentManagerChange = $employee->manager_change_date
            ? Carbon::parse($employee->manager_change_date)->diffInDays(now()) < 90
            : false;

        if ($recentManagerChange) {
            $risk += 25;
        }

        // No clear reporting structure
        if (! $employee->manager_id) {
            $risk += 20;
        }

        // Department size (very small teams may have unclear boundaries)
        $deptSize = Employee::where('department_id', $employee->department_id)
            ->where('employment_status', 'active')
            ->count();

        if ($deptSize < 3) {
            $risk += 15;
        }

        return min(100, $risk);
    }

    /**
     * Calculate support deficit (0-100)
     */
    protected function calculateSupportDeficit(Employee $employee): float
    {
        $risk = 0;

        // Manager span of control
        if ($employee->manager_id) {
            $managerDirectReports = Employee::where('manager_id', $employee->manager_id)
                ->where('employment_status', 'active')
                ->count();

            // Very large teams = less support per person
            if ($managerDirectReports >= 15) {
                $risk += 40;
            } elseif ($managerDirectReports >= 10) {
                $risk += 25;
            }
        } else {
            $risk += 50; // No manager assigned
        }

        // Check for recent 1:1s or check-ins (simulated)
        $lastCheckIn = DB::table('employee_sentiment_records')
            ->where('employee_id', $employee->id)
            ->where('source_type', 'one_on_one')
            ->orderByDesc('recorded_date')
            ->first();

        if (! $lastCheckIn) {
            $risk += 30;
        } elseif (Carbon::parse($lastCheckIn->recorded_date)->diffInDays(now()) > 30) {
            $risk += 20;
        }

        return min(100, $risk);
    }

    /**
     * Calculate weighted risk score
     */
    protected function calculateWeightedScore(array $factors): float
    {
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($this->riskWeights as $factor => $weight) {
            if (isset($factors[$factor])) {
                $weightedSum += $factors[$factor] * $weight;
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
            return 'moderate';
        }

        return 'low';
    }

    /**
     * Identify specific warning signs
     */
    protected function identifyWarningSigns(array $factors): array
    {
        $warnings = [];

        if ($factors['workload_intensity'] >= 70) {
            $warnings[] = 'Workload intensity critically high';
        }

        if ($factors['overtime_pattern'] >= 70) {
            $warnings[] = 'Sustained overtime pattern detected';
        }

        if ($factors['leave_deprivation'] >= 70) {
            $warnings[] = 'Insufficient rest and recovery time';
        }

        if ($factors['recovery_deficit'] >= 60) {
            $warnings[] = 'Weekend work or late nights affecting recovery';
        }

        if ($factors['sustained_pressure'] >= 70) {
            $warnings[] = 'Extended high-pressure period without relief';
        }

        return $warnings;
    }

    /**
     * Generate recommendations
     */
    protected function generateRecommendations(array $factors, string $riskLevel): array
    {
        $recommendations = [];

        if ($riskLevel === 'critical') {
            $recommendations[] = 'URGENT: Schedule immediate wellness check-in';
            $recommendations[] = 'Consider temporary workload reduction';
        }

        if ($factors['overtime_pattern'] >= 60) {
            $recommendations[] = 'Review and redistribute work assignments';
            $recommendations[] = 'Establish overtime boundaries';
        }

        if ($factors['leave_deprivation'] >= 60) {
            $recommendations[] = 'Encourage use of available leave balance';
            $recommendations[] = 'Schedule mandatory break periods';
        }

        if ($factors['recovery_deficit'] >= 60) {
            $recommendations[] = 'Implement weekend disconnect policy';
            $recommendations[] = 'Set boundaries on after-hours work';
        }

        if ($factors['support_deficit'] >= 60) {
            $recommendations[] = 'Increase frequency of 1:1 meetings';
            $recommendations[] = 'Assign peer support or mentor';
        }

        if ($factors['role_ambiguity'] >= 50) {
            $recommendations[] = 'Clarify role expectations and priorities';
        }

        return $recommendations;
    }

    /**
     * Store burnout risk results
     */
    protected function storeResult(Employee $employee, array $result): void
    {
        EmployeeRiskScore::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'burnout_risk_score' => $result['risk_score'],
                'burnout_risk_factors' => $result['factors'],
                'burnout_calculated_at' => now(),
            ]
        );

        // Create insight for high risk
        if (in_array($result['risk_level'], ['high', 'critical'])) {
            AIInsight::create([
                'insight_type' => 'burnout_warning',
                'severity' => $result['risk_level'] === 'critical' ? 'critical' : 'high',
                'scope' => 'employee',
                'employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'title' => "Burnout Risk: {$employee->full_name}",
                'description' => implode('. ', $result['warning_signs']),
                'data_points' => $result['factors'],
                'recommended_actions' => $result['recommendations'],
                'confidence_score' => 80,
                'insight_date' => now()->toDateString(),
            ]);
        }
    }
}
