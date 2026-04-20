<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\CompensationAdjustment;
use Aero\HRM\Models\CompensationReview;
use Aero\HRM\Models\Employee;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompensationBenchmarkService
{
    /**
     * Run pay equity analysis across a set of employees.
     *
     * @return array{gaps: array, overall_equity_score: float, recommendations: array}
     */
    public function analyzePayEquity(Collection $employees, string $groupBy = 'gender'): array
    {
        $grouped = $employees->groupBy(fn ($e) => $e->{$groupBy} ?? 'unknown');

        $stats = $grouped->map(function (Collection $group, $key) {
            $salaries = $group->pluck('current_salary')->filter()->values();

            return [
                'group' => $key,
                'count' => $salaries->count(),
                'avg_salary' => $salaries->count() > 0 ? round($salaries->avg(), 2) : 0,
                'median_salary' => $this->median($salaries->toArray()),
                'min_salary' => $salaries->min() ?? 0,
                'max_salary' => $salaries->max() ?? 0,
            ];
        });

        $gaps = [];
        $groups = $stats->keys()->toArray();
        for ($i = 0; $i < count($groups) - 1; $i++) {
            for ($j = $i + 1; $j < count($groups); $j++) {
                $a = $stats[$groups[$i]];
                $b = $stats[$groups[$j]];
                $baseAvg = max($a['avg_salary'], $b['avg_salary']);

                if ($baseAvg > 0) {
                    $gapPct = round((abs($a['avg_salary'] - $b['avg_salary']) / $baseAvg) * 100, 2);
                    $gaps[] = [
                        'group_a' => $groups[$i],
                        'group_b' => $groups[$j],
                        'gap_percentage' => $gapPct,
                        'higher_group' => $a['avg_salary'] > $b['avg_salary'] ? $groups[$i] : $groups[$j],
                        'significant' => $gapPct > 5,
                    ];
                }
            }
        }

        $overallEquity = $this->calculateEquityScore($gaps);

        return [
            'group_by' => $groupBy,
            'statistics' => $stats->values()->toArray(),
            'gaps' => $gaps,
            'overall_equity_score' => $overallEquity,
            'recommendations' => $this->generateEquityRecommendations($gaps),
        ];
    }

    /**
     * Compare employee compensation against market rates.
     */
    public function benchmarkAgainstMarket(Employee $employee, ?float $marketRate = null): array
    {
        $currentSalary = $employee->current_salary ?? 0;
        $marketRate = $marketRate ?? $this->estimateMarketRate($employee);

        if ($marketRate <= 0) {
            return [
                'employee_id' => $employee->id,
                'current_salary' => $currentSalary,
                'market_rate' => null,
                'compa_ratio' => null,
                'status' => 'no_market_data',
            ];
        }

        $compaRatio = round(($currentSalary / $marketRate) * 100, 1);

        return [
            'employee_id' => $employee->id,
            'current_salary' => $currentSalary,
            'market_rate' => $marketRate,
            'compa_ratio' => $compaRatio,
            'difference' => round($currentSalary - $marketRate, 2),
            'status' => $this->getCompaStatus($compaRatio),
            'recommendation' => $this->getCompensationRecommendation($compaRatio, $employee),
        ];
    }

    /**
     * Allocate a compensation budget across employees based on performance.
     *
     * @param  Collection<Employee>  $employees
     * @return array{allocations: array, total_allocated: float, remaining_budget: float}
     */
    public function allocateBudget(Collection $employees, float $totalBudget, string $strategy = 'merit'): array
    {
        $allocations = [];
        $totalAllocated = 0;

        if ($strategy === 'merit') {
            $allocations = $this->meritBasedAllocation($employees, $totalBudget);
        } elseif ($strategy === 'equity') {
            $allocations = $this->equityBasedAllocation($employees, $totalBudget);
        } else {
            $allocations = $this->evenAllocation($employees, $totalBudget);
        }

        $totalAllocated = collect($allocations)->sum('amount');

        return [
            'strategy' => $strategy,
            'total_budget' => $totalBudget,
            'total_allocated' => round($totalAllocated, 2),
            'remaining_budget' => round($totalBudget - $totalAllocated, 2),
            'allocations' => $allocations,
            'employee_count' => count($allocations),
        ];
    }

    /**
     * Create a compensation review cycle.
     */
    public function createReviewCycle(array $data): CompensationReview
    {
        return DB::transaction(function () use ($data) {
            $review = CompensationReview::create([
                'title' => $data['title'],
                'review_period' => $data['review_period'] ?? now()->format('Y'),
                'budget' => $data['budget'],
                'status' => 'draft',
                'effective_date' => $data['effective_date'],
                'created_by' => auth()->id(),
            ]);

            Log::info('Compensation review cycle created', [
                'review_id' => $review->id,
                'budget' => $data['budget'],
            ]);

            return $review;
        });
    }

    /**
     * Apply compensation adjustment to an employee.
     */
    public function applyAdjustment(Employee $employee, array $adjustmentData): CompensationAdjustment
    {
        return DB::transaction(function () use ($employee, $adjustmentData) {
            $previousSalary = $employee->current_salary ?? 0;
            $newSalary = $adjustmentData['new_salary'] ?? ($previousSalary + ($adjustmentData['amount'] ?? 0));

            $adjustment = CompensationAdjustment::create([
                'employee_id' => $employee->id,
                'review_id' => $adjustmentData['review_id'] ?? null,
                'type' => $adjustmentData['type'] ?? 'merit_increase',
                'previous_salary' => $previousSalary,
                'new_salary' => $newSalary,
                'amount' => $newSalary - $previousSalary,
                'percentage' => $previousSalary > 0
                    ? round((($newSalary - $previousSalary) / $previousSalary) * 100, 2)
                    : 0,
                'effective_date' => $adjustmentData['effective_date'] ?? now(),
                'reason' => $adjustmentData['reason'] ?? null,
                'approved_by' => $adjustmentData['approved_by'] ?? auth()->id(),
            ]);

            $employee->update(['current_salary' => $newSalary]);

            Log::info('Compensation adjustment applied', [
                'employee_id' => $employee->id,
                'previous' => $previousSalary,
                'new' => $newSalary,
            ]);

            return $adjustment;
        });
    }

    private function meritBasedAllocation(Collection $employees, float $budget): array
    {
        $allocations = [];
        $totalWeight = 0;

        $employeeWeights = $employees->map(function ($employee) {
            $latestReview = $employee->performanceReviews?->sortByDesc('review_period_end')->first();
            $score = $latestReview?->overall_score ?? 50;

            return [
                'employee' => $employee,
                'weight' => max($score / 100, 0.1),
            ];
        });

        $totalWeight = $employeeWeights->sum('weight');

        foreach ($employeeWeights as $item) {
            $share = $totalWeight > 0 ? ($item['weight'] / $totalWeight) * $budget : 0;
            $allocations[] = [
                'employee_id' => $item['employee']->id,
                'amount' => round($share, 2),
                'percentage_of_salary' => $item['employee']->current_salary > 0
                    ? round(($share / $item['employee']->current_salary) * 100, 2)
                    : 0,
                'basis' => 'merit',
                'weight' => $item['weight'],
            ];
        }

        return $allocations;
    }

    private function equityBasedAllocation(Collection $employees, float $budget): array
    {
        $allocations = [];

        foreach ($employees as $employee) {
            $marketRate = $this->estimateMarketRate($employee);
            $gap = max($marketRate - ($employee->current_salary ?? 0), 0);
            $allocations[] = [
                'employee_id' => $employee->id,
                'gap_to_market' => $gap,
                'employee' => $employee,
            ];
        }

        $totalGap = collect($allocations)->sum('gap_to_market');

        return collect($allocations)->map(function ($item) use ($totalGap, $budget) {
            $share = $totalGap > 0 ? ($item['gap_to_market'] / $totalGap) * $budget : 0;

            return [
                'employee_id' => $item['employee_id'],
                'amount' => round(min($share, $item['gap_to_market']), 2),
                'percentage_of_salary' => $item['employee']->current_salary > 0
                    ? round(($share / $item['employee']->current_salary) * 100, 2)
                    : 0,
                'basis' => 'equity',
                'gap_to_market' => $item['gap_to_market'],
            ];
        })->toArray();
    }

    private function evenAllocation(Collection $employees, float $budget): array
    {
        $perEmployee = $employees->count() > 0 ? $budget / $employees->count() : 0;

        return $employees->map(fn ($e) => [
            'employee_id' => $e->id,
            'amount' => round($perEmployee, 2),
            'percentage_of_salary' => $e->current_salary > 0
                ? round(($perEmployee / $e->current_salary) * 100, 2)
                : 0,
            'basis' => 'even',
        ])->toArray();
    }

    private function estimateMarketRate(Employee $employee): float
    {
        $designationAvg = Employee::where('designation_id', $employee->designation_id)
            ->where('id', '!=', $employee->id)
            ->whereNotNull('current_salary')
            ->avg('current_salary');

        return $designationAvg ?? 0;
    }

    private function getCompaStatus(float $compaRatio): string
    {
        if ($compaRatio >= 120) {
            return 'overpaid';
        }
        if ($compaRatio >= 90) {
            return 'competitive';
        }
        if ($compaRatio >= 80) {
            return 'below_market';
        }

        return 'significantly_below';
    }

    private function getCompensationRecommendation(float $compaRatio, Employee $employee): string
    {
        if ($compaRatio >= 120) {
            return 'Hold — compensation exceeds market rate. Consider variable pay or promotion-linked increase.';
        }
        if ($compaRatio >= 90) {
            return 'Standard merit increase — compensation is competitive.';
        }
        if ($compaRatio >= 80) {
            return 'Priority adjustment recommended — employee below market rate.';
        }

        return 'Urgent correction needed — significant below-market compensation risks retention.';
    }

    private function calculateEquityScore(array $gaps): float
    {
        if (empty($gaps)) {
            return 100;
        }

        $significantGaps = collect($gaps)->where('significant', true)->count();
        $totalPairs = count($gaps);

        return round((($totalPairs - $significantGaps) / $totalPairs) * 100, 1);
    }

    private function median(array $values): float
    {
        sort($values);
        $count = count($values);
        if ($count === 0) {
            return 0;
        }
        $middle = (int) floor($count / 2);

        return $count % 2 === 0
            ? ($values[$middle - 1] + $values[$middle]) / 2
            : $values[$middle];
    }
}
