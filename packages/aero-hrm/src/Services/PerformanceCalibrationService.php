<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\PerformanceReview;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PerformanceCalibrationService
{
    /**
     * 9-box grid placement categories.
     */
    public const NINE_BOX = [
        'high_potential_high_performance' => ['label' => 'Star', 'box' => [3, 3]],
        'high_potential_medium_performance' => ['label' => 'Growth Employee', 'box' => [3, 2]],
        'high_potential_low_performance' => ['label' => 'Enigma', 'box' => [3, 1]],
        'medium_potential_high_performance' => ['label' => 'High Performer', 'box' => [2, 3]],
        'medium_potential_medium_performance' => ['label' => 'Core Employee', 'box' => [2, 2]],
        'medium_potential_low_performance' => ['label' => 'Dilemma', 'box' => [2, 1]],
        'low_potential_high_performance' => ['label' => 'Solid Performer', 'box' => [1, 3]],
        'low_potential_medium_performance' => ['label' => 'Average Performer', 'box' => [1, 2]],
        'low_potential_low_performance' => ['label' => 'Under Performer', 'box' => [1, 1]],
    ];

    /**
     * Run bell curve calibration across a set of reviews.
     *
     * @param  Collection<PerformanceReview>  $reviews
     * @return array{distribution: array, adjustments: array, curve_fit: float}
     */
    public function calibrateBellCurve(Collection $reviews, array $targetDistribution = []): array
    {
        $targetDistribution = $targetDistribution ?: [
            'exceptional' => 10,
            'exceeds' => 20,
            'meets' => 40,
            'below' => 20,
            'unsatisfactory' => 10,
        ];

        $currentDistribution = $reviews->groupBy('rating_category')
            ->map(fn (Collection $group) => round(($group->count() / max($reviews->count(), 1)) * 100, 1));

        $adjustments = [];
        foreach ($targetDistribution as $category => $targetPct) {
            $currentPct = $currentDistribution->get($category, 0);
            $diff = $currentPct - $targetPct;

            if (abs($diff) > 5) {
                $adjustments[] = [
                    'category' => $category,
                    'current_pct' => $currentPct,
                    'target_pct' => $targetPct,
                    'difference' => round($diff, 1),
                    'action' => $diff > 0 ? 'reduce' : 'increase',
                    'affected_count' => (int) abs(round(($diff / 100) * $reviews->count())),
                ];
            }
        }

        $curveFit = $this->calculateCurveFitScore($currentDistribution->toArray(), $targetDistribution);

        return [
            'total_reviews' => $reviews->count(),
            'current_distribution' => $currentDistribution->toArray(),
            'target_distribution' => $targetDistribution,
            'adjustments' => $adjustments,
            'curve_fit_score' => $curveFit,
            'is_compliant' => $curveFit >= 80,
        ];
    }

    /**
     * Place an employee on the 9-box grid based on performance and potential scores.
     */
    public function placeOnNineBox(Employee $employee, float $performanceScore, float $potentialScore): array
    {
        $performanceLevel = $this->getLevel($performanceScore);
        $potentialLevel = $this->getLevel($potentialScore);

        $key = "{$potentialLevel}_potential_{$performanceLevel}_performance";
        $placement = self::NINE_BOX[$key] ?? self::NINE_BOX['medium_potential_medium_performance'];

        return [
            'employee_id' => $employee->id,
            'performance_score' => $performanceScore,
            'potential_score' => $potentialScore,
            'performance_level' => $performanceLevel,
            'potential_level' => $potentialLevel,
            'grid_position' => $placement['box'],
            'label' => $placement['label'],
            'key' => $key,
        ];
    }

    /**
     * Generate 9-box grid for a department or team.
     *
     * @param  Collection<Employee>  $employees
     * @return array{grid: array, summary: array}
     */
    public function generateNineBoxGrid(Collection $employees): array
    {
        $grid = [];
        $summary = array_fill_keys(array_keys(self::NINE_BOX), 0);

        foreach ($employees as $employee) {
            $latestReview = $employee->performanceReviews()
                ->latest('review_period_end')
                ->first();

            if (! $latestReview) {
                continue;
            }

            $performanceScore = $latestReview->overall_score ?? 50;
            $potentialScore = $latestReview->potential_score ?? 50;

            $placement = $this->placeOnNineBox($employee, $performanceScore, $potentialScore);
            $grid[] = $placement;
            $summary[$placement['key']] = ($summary[$placement['key']] ?? 0) + 1;
        }

        return [
            'grid' => $grid,
            'summary' => $summary,
            'total_placed' => count($grid),
            'high_potentials' => collect($grid)->filter(fn ($p) => $p['potential_level'] === 'high')->count(),
            'at_risk' => collect($grid)->filter(fn ($p) => $p['label'] === 'Under Performer')->count(),
        ];
    }

    /**
     * Apply forced ranking within a department.
     *
     * @param  Collection<PerformanceReview>  $reviews
     */
    public function applyForcedRanking(Collection $reviews): Collection
    {
        return $reviews->sortByDesc('overall_score')
            ->values()
            ->map(function ($review, $index) use ($reviews) {
                $percentile = round((($reviews->count() - $index) / $reviews->count()) * 100, 1);

                return [
                    'review_id' => $review->id,
                    'employee_id' => $review->employee_id,
                    'score' => $review->overall_score,
                    'rank' => $index + 1,
                    'percentile' => $percentile,
                    'category' => $this->getCategoryFromPercentile($percentile),
                ];
            });
    }

    /**
     * Compare performance scores across departments for calibration.
     */
    public function crossDepartmentCalibration(string $reviewPeriod): array
    {
        $reviews = PerformanceReview::where('review_period_end', $reviewPeriod)
            ->whereNotNull('overall_score')
            ->with('employee.department')
            ->get();

        $byDepartment = $reviews->groupBy(fn ($r) => $r->employee?->department_id);

        $departmentStats = $byDepartment->map(function (Collection $deptReviews, $deptId) {
            return [
                'department_id' => $deptId,
                'count' => $deptReviews->count(),
                'avg_score' => round($deptReviews->avg('overall_score'), 2),
                'median_score' => $this->median($deptReviews->pluck('overall_score')->toArray()),
                'std_deviation' => $this->standardDeviation($deptReviews->pluck('overall_score')->toArray()),
                'min_score' => $deptReviews->min('overall_score'),
                'max_score' => $deptReviews->max('overall_score'),
            ];
        });

        $overallAvg = $reviews->avg('overall_score');

        return [
            'review_period' => $reviewPeriod,
            'total_reviews' => $reviews->count(),
            'overall_average' => round($overallAvg, 2),
            'department_stats' => $departmentStats->values()->toArray(),
            'lenient_departments' => $departmentStats->filter(fn ($s) => $s['avg_score'] > $overallAvg + 10)->keys()->toArray(),
            'strict_departments' => $departmentStats->filter(fn ($s) => $s['avg_score'] < $overallAvg - 10)->keys()->toArray(),
        ];
    }

    private function getLevel(float $score): string
    {
        if ($score >= 70) {
            return 'high';
        }
        if ($score >= 40) {
            return 'medium';
        }

        return 'low';
    }

    private function getCategoryFromPercentile(float $percentile): string
    {
        if ($percentile >= 90) {
            return 'exceptional';
        }
        if ($percentile >= 70) {
            return 'exceeds';
        }
        if ($percentile >= 30) {
            return 'meets';
        }
        if ($percentile >= 10) {
            return 'below';
        }

        return 'unsatisfactory';
    }

    private function calculateCurveFitScore(array $current, array $target): float
    {
        $totalDeviation = 0;
        foreach ($target as $category => $targetPct) {
            $currentPct = $current[$category] ?? 0;
            $totalDeviation += abs($currentPct - $targetPct);
        }

        return max(0, round(100 - $totalDeviation, 1));
    }

    private function median(array $values): float
    {
        sort($values);
        $count = count($values);

        if ($count === 0) {
            return 0;
        }

        $middle = (int) floor($count / 2);

        if ($count % 2 === 0) {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        }

        return $values[$middle];
    }

    private function standardDeviation(array $values): float
    {
        $count = count($values);
        if ($count < 2) {
            return 0;
        }

        $mean = array_sum($values) / $count;
        $squaredDiffs = array_map(fn ($v) => ($v - $mean) ** 2, $values);

        return round(sqrt(array_sum($squaredDiffs) / ($count - 1)), 2);
    }
}
