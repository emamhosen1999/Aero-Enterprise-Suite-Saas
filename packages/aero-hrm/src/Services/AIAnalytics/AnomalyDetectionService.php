<?php

namespace Aero\HRM\Services\AIAnalytics;

use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\BehavioralAnomaly;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Behavioral Anomaly Detection Service
 *
 * Detects unusual patterns in employee behavior that may indicate:
 * - Disengagement
 * - Personal issues
 * - Job searching
 * - Performance problems
 * - Burnout warning signs
 *
 * Uses statistical deviation analysis and pattern matching.
 */
class AnomalyDetectionService
{
    /**
     * Thresholds for anomaly detection (standard deviations)
     */
    protected array $thresholds = [
        'attendance_time' => 2.0,
        'absence_frequency' => 2.5,
        'overtime_pattern' => 2.0,
        'leave_frequency' => 2.5,
        'late_arrivals' => 2.0,
        'early_departures' => 2.0,
    ];

    /**
     * Minimum data points required for analysis
     */
    protected int $minimumDataPoints = 20;

    /**
     * Detect anomalies for a single employee
     */
    public function detectAnomalies(Employee $employee): array
    {
        $anomalies = [];

        // Check each anomaly type
        $anomalies = array_merge($anomalies, $this->detectAttendancePatternChange($employee));
        $anomalies = array_merge($anomalies, $this->detectAbsenceFrequencyChange($employee));
        $anomalies = array_merge($anomalies, $this->detectOvertimeSpike($employee));
        $anomalies = array_merge($anomalies, $this->detectLeavePatternChange($employee));
        $anomalies = array_merge($anomalies, $this->detectProductivityVariance($employee));

        // Store detected anomalies
        foreach ($anomalies as $anomaly) {
            $this->storeAnomaly($employee, $anomaly);
        }

        return $anomalies;
    }

    /**
     * Batch detect anomalies for all active employees
     */
    public function detectForAllEmployees(): Collection
    {
        $employees = Employee::where('status', 'active')->get();
        $allAnomalies = collect();

        foreach ($employees as $employee) {
            $anomalies = $this->detectAnomalies($employee);
            if (! empty($anomalies)) {
                $allAnomalies->push([
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'anomalies' => $anomalies,
                ]);
            }
        }

        return $allAnomalies;
    }

    /**
     * Get recent unresolved anomalies
     */
    public function getRecentAnomalies(int $days = 30, ?string $type = null): Collection
    {
        $query = BehavioralAnomaly::query()
            ->with('employee.department')
            ->where('anomaly_date', '>=', now()->subDays($days))
            ->whereNotIn('status', ['resolved', 'false_positive'])
            ->orderByDesc('anomaly_score');

        if ($type) {
            $query->where('anomaly_type', $type);
        }

        return $query->get();
    }

    /**
     * Detect changes in attendance timing patterns
     */
    protected function detectAttendancePatternChange(Employee $employee): array
    {
        $anomalies = [];

        // Get historical check-in times
        $historicalData = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subMonths(6))
            ->where('attendance_date', '<', now()->subDays(14))
            ->whereNotNull('check_in')
            ->get();

        if ($historicalData->count() < $this->minimumDataPoints) {
            return [];
        }

        // Calculate historical baseline
        $historicalMinutes = $historicalData->map(function ($a) {
            $time = Carbon::parse($a->check_in);

            return $time->hour * 60 + $time->minute;
        });

        $baseline = [
            'mean' => $historicalMinutes->avg(),
            'std' => $this->standardDeviation($historicalMinutes->toArray()),
        ];

        // Check recent data
        $recentData = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subDays(14))
            ->whereNotNull('check_in')
            ->get();

        foreach ($recentData as $attendance) {
            $time = Carbon::parse($attendance->check_in);
            $minutes = $time->hour * 60 + $time->minute;

            $deviation = abs($minutes - $baseline['mean']) / max(1, $baseline['std']);

            if ($deviation > $this->thresholds['attendance_time']) {
                $anomalies[] = [
                    'type' => 'attendance_pattern',
                    'score' => min(100, $deviation * 25),
                    'baseline_value' => $baseline['mean'],
                    'actual_value' => $minutes,
                    'deviation_percentage' => ($deviation / $this->thresholds['attendance_time']) * 100,
                    'date' => $attendance->attendance_date,
                    'description' => sprintf(
                        'Unusual check-in time: %s (typically around %s)',
                        $time->format('H:i'),
                        Carbon::createFromTime(
                            intval($baseline['mean'] / 60),
                            intval($baseline['mean'] % 60)
                        )->format('H:i')
                    ),
                ];
            }
        }

        return $anomalies;
    }

    /**
     * Detect sudden increase in absence frequency
     */
    protected function detectAbsenceFrequencyChange(Employee $employee): array
    {
        $anomalies = [];

        // Get monthly absence counts for last 6 months
        $monthlyAbsences = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'absent')
            ->where('attendance_date', '>=', now()->subMonths(6))
            ->selectRaw("DATE_FORMAT(attendance_date, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        if (count($monthlyAbsences) < 3) {
            return [];
        }

        $values = array_values($monthlyAbsences);
        $recentMonth = array_pop($values);

        $baseline = [
            'mean' => array_sum($values) / count($values),
            'std' => $this->standardDeviation($values),
        ];

        if ($baseline['std'] == 0) {
            $baseline['std'] = 1;
        }

        $deviation = ($recentMonth - $baseline['mean']) / $baseline['std'];

        if ($deviation > $this->thresholds['absence_frequency']) {
            $anomalies[] = [
                'type' => 'absence_frequency',
                'score' => min(100, $deviation * 30),
                'baseline_value' => $baseline['mean'],
                'actual_value' => $recentMonth,
                'deviation_percentage' => (($recentMonth - $baseline['mean']) / max(1, $baseline['mean'])) * 100,
                'date' => now()->toDateString(),
                'description' => sprintf(
                    'Absence frequency increased: %d absences this month vs %.1f average',
                    $recentMonth,
                    $baseline['mean']
                ),
            ];
        }

        return $anomalies;
    }

    /**
     * Detect unusual overtime patterns
     */
    protected function detectOvertimeSpike(Employee $employee): array
    {
        $anomalies = [];

        // Get weekly overtime hours
        $overtimeData = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', '>=', now()->subMonths(3))
            ->whereNotNull('overtime_hours')
            ->selectRaw('YEARWEEK(attendance_date) as week, SUM(overtime_hours) as hours')
            ->groupBy('week')
            ->orderBy('week')
            ->pluck('hours', 'week')
            ->toArray();

        if (count($overtimeData) < 6) {
            return [];
        }

        $values = array_values($overtimeData);
        $recentWeeks = array_slice($values, -2);
        $historicalWeeks = array_slice($values, 0, -2);

        $baseline = [
            'mean' => array_sum($historicalWeeks) / count($historicalWeeks),
            'std' => $this->standardDeviation($historicalWeeks),
        ];

        $recentAvg = array_sum($recentWeeks) / count($recentWeeks);

        if ($baseline['std'] == 0) {
            $baseline['std'] = 1;
        }

        $deviation = ($recentAvg - $baseline['mean']) / $baseline['std'];

        if ($deviation > $this->thresholds['overtime_pattern']) {
            $anomalies[] = [
                'type' => 'overtime_spike',
                'score' => min(100, $deviation * 25),
                'baseline_value' => $baseline['mean'],
                'actual_value' => $recentAvg,
                'deviation_percentage' => (($recentAvg - $baseline['mean']) / max(1, $baseline['mean'])) * 100,
                'date' => now()->toDateString(),
                'description' => sprintf(
                    'Overtime spike detected: %.1f hours/week vs %.1f average',
                    $recentAvg,
                    $baseline['mean']
                ),
            ];
        }

        return $anomalies;
    }

    /**
     * Detect unusual leave patterns (interview signals)
     */
    protected function detectLeavePatternChange(Employee $employee): array
    {
        $anomalies = [];

        // Count single-day leaves in recent period
        $recentSingleDayLeaves = Leave::query()
            ->where('employee_id', $employee->id)
            ->where('start_date', '>=', now()->subDays(30))
            ->whereRaw('DATEDIFF(end_date, start_date) = 0')
            ->count();

        $historicalRate = Leave::query()
            ->where('employee_id', $employee->id)
            ->where('start_date', '>=', now()->subMonths(6))
            ->where('start_date', '<', now()->subDays(30))
            ->whereRaw('DATEDIFF(end_date, start_date) = 0')
            ->count() / 5; // Average per month

        if ($historicalRate > 0 && $recentSingleDayLeaves > $historicalRate * 2) {
            $anomalies[] = [
                'type' => 'leave_pattern',
                'score' => min(100, ($recentSingleDayLeaves / max(1, $historicalRate)) * 30),
                'baseline_value' => $historicalRate,
                'actual_value' => $recentSingleDayLeaves,
                'deviation_percentage' => (($recentSingleDayLeaves - $historicalRate) / max(1, $historicalRate)) * 100,
                'date' => now()->toDateString(),
                'description' => sprintf(
                    'Unusual leave pattern: %d single-day leaves this month vs %.1f average',
                    $recentSingleDayLeaves,
                    $historicalRate
                ),
                'context_data' => [
                    'warning' => 'Pattern may indicate interview activity',
                ],
            ];
        }

        return $anomalies;
    }

    /**
     * Detect productivity variance
     */
    protected function detectProductivityVariance(Employee $employee): array
    {
        $anomalies = [];

        // This would integrate with task/project management data
        // For now, we'll use workload metrics if available
        $metrics = DB::table('employee_workload_metrics')
            ->where('employee_id', $employee->id)
            ->where('metric_date', '>=', now()->subMonths(3))
            ->orderBy('metric_date')
            ->pluck('task_completion_rate', 'metric_date')
            ->toArray();

        if (count($metrics) < 10) {
            return [];
        }

        $values = array_values($metrics);
        $recentValues = array_slice($values, -7);
        $historicalValues = array_slice($values, 0, -7);

        $baseline = [
            'mean' => array_sum($historicalValues) / count($historicalValues),
            'std' => $this->standardDeviation($historicalValues),
        ];

        $recentAvg = array_sum($recentValues) / count($recentValues);

        if ($baseline['std'] == 0) {
            $baseline['std'] = 10; // Default variance
        }

        $deviation = ($baseline['mean'] - $recentAvg) / $baseline['std']; // Inverted: decline is anomaly

        if ($deviation > 2.0 && $recentAvg < $baseline['mean'] * 0.8) {
            $anomalies[] = [
                'type' => 'productivity_variance',
                'score' => min(100, $deviation * 25),
                'baseline_value' => $baseline['mean'],
                'actual_value' => $recentAvg,
                'deviation_percentage' => (($baseline['mean'] - $recentAvg) / max(1, $baseline['mean'])) * 100,
                'date' => now()->toDateString(),
                'description' => sprintf(
                    'Productivity decline: %.1f%% completion rate vs %.1f%% baseline',
                    $recentAvg,
                    $baseline['mean']
                ),
            ];
        }

        return $anomalies;
    }

    /**
     * Calculate standard deviation
     */
    protected function standardDeviation(array $values): float
    {
        $count = count($values);
        if ($count < 2) {
            return 0;
        }

        $mean = array_sum($values) / $count;
        $variance = array_sum(array_map(fn ($x) => pow($x - $mean, 2), $values)) / ($count - 1);

        return sqrt($variance);
    }

    /**
     * Store detected anomaly
     */
    protected function storeAnomaly(Employee $employee, array $anomaly): void
    {
        // Check if similar anomaly exists recently
        $existing = BehavioralAnomaly::query()
            ->where('employee_id', $employee->id)
            ->where('anomaly_type', $anomaly['type'])
            ->where('anomaly_date', $anomaly['date'])
            ->first();

        if ($existing) {
            // Update existing
            $existing->update([
                'anomaly_score' => $anomaly['score'],
                'baseline_value' => $anomaly['baseline_value'],
                'actual_value' => $anomaly['actual_value'],
                'deviation_percentage' => $anomaly['deviation_percentage'],
                'description' => $anomaly['description'],
                'context_data' => $anomaly['context_data'] ?? null,
            ]);
        } else {
            // Create new
            BehavioralAnomaly::create([
                'employee_id' => $employee->id,
                'anomaly_type' => $anomaly['type'],
                'anomaly_score' => $anomaly['score'],
                'baseline_value' => $anomaly['baseline_value'],
                'actual_value' => $anomaly['actual_value'],
                'deviation_percentage' => $anomaly['deviation_percentage'],
                'description' => $anomaly['description'],
                'context_data' => $anomaly['context_data'] ?? null,
                'status' => 'detected',
                'anomaly_date' => $anomaly['date'],
            ]);

            // Create insight if severe
            if ($anomaly['score'] >= 70) {
                AIInsight::create([
                    'insight_type' => 'anomaly_detected',
                    'severity' => $anomaly['score'] >= 85 ? 'high' : 'medium',
                    'scope' => 'employee',
                    'employee_id' => $employee->id,
                    'department_id' => $employee->department_id,
                    'title' => "Behavioral Anomaly: {$employee->full_name}",
                    'description' => $anomaly['description'],
                    'data_points' => $anomaly,
                    'recommended_actions' => ['Review employee situation', 'Schedule check-in meeting'],
                    'confidence_score' => min(95, $anomaly['score']),
                    'insight_date' => now()->toDateString(),
                ]);
            }
        }
    }
}
