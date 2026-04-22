<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DEIAnalyticsService
{
    /**
     * Return gender distribution with count and percentage.
     *
     * @return array<int, array{label: string, count: int, percentage: float}>
     */
    public function getGenderDistribution(): array
    {
        $total = Employee::query()->whereNotNull('gender')->count();

        if ($total === 0) {
            return [];
        }

        return Employee::query()
            ->selectRaw('gender, COUNT(*) as count')
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->get()
            ->map(function ($row) use ($total): array {
                return [
                    'label' => Employee::GENDERS[$row->gender] ?? ucfirst((string) $row->gender),
                    'count' => (int) $row->count,
                    'percentage' => round(($row->count / $total) * 100, 2),
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Return per-department breakdown of gender and age-range counts.
     *
     * @return array<int, array{department: string, gender_breakdown: array, age_breakdown: array, total: int}>
     */
    public function getDepartmentDiversityMatrix(): array
    {
        $employees = Employee::query()
            ->with('department')
            ->whereNotNull('gender')
            ->get();

        return $employees
            ->groupBy(fn (Employee $e): int => (int) $e->department_id)
            ->map(function (Collection $group): array {
                /** @var Employee $first */
                $first = $group->first();
                $deptName = $first->department?->name ?? 'Unknown';

                $genderBreakdown = $group->groupBy('gender')
                    ->map(fn (Collection $g): int => $g->count())
                    ->mapWithKeys(fn (int $count, string $key): array => [
                        Employee::GENDERS[$key] ?? ucfirst($key) => $count,
                    ])
                    ->toArray();

                $ageBreakdown = $this->buildAgeBrackets($group);

                return [
                    'department' => $deptName,
                    'gender_breakdown' => $genderBreakdown,
                    'age_breakdown' => $ageBreakdown,
                    'total' => $group->count(),
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Return employee count grouped into age brackets.
     *
     * @return array<int, array{label: string, count: int, percentage: float}>
     */
    public function getAgeDistribution(): array
    {
        $employees = Employee::query()
            ->whereNotNull('date_of_birth')
            ->get(['date_of_birth']);

        $total = $employees->count();

        if ($total === 0) {
            return [];
        }

        $brackets = [
            'Under 25' => 0,
            '25-34' => 0,
            '35-44' => 0,
            '45-54' => 0,
            '55+' => 0,
        ];

        $now = Carbon::now();
        foreach ($employees as $emp) {
            $age = $now->diffInYears(Carbon::parse($emp->date_of_birth));

            if ($age < 25) {
                $brackets['Under 25']++;
            } elseif ($age <= 34) {
                $brackets['25-34']++;
            } elseif ($age <= 44) {
                $brackets['35-44']++;
            } elseif ($age <= 54) {
                $brackets['45-54']++;
            } else {
                $brackets['55+']++;
            }
        }

        return collect($brackets)
            ->map(fn (int $count, string $label): array => [
                'label' => $label,
                'count' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 2) : 0.0,
            ])
            ->values()
            ->toArray();
    }

    /**
     * Return monthly new-hire counts grouped by gender for the last N months.
     *
     * @return array<int, array{month: string, gender: string, count: int}>
     */
    public function getHiringTrendsByGender(int $months = 12): array
    {
        $since = Carbon::now()->subMonths($months)->startOfMonth();

        return Employee::query()
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, gender, COUNT(*) as count")
            ->whereNotNull('gender')
            ->where('created_at', '>=', $since)
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m'), gender")
            ->orderByRaw('month ASC, gender ASC')
            ->get()
            ->map(fn ($row): array => [
                'month' => $row->month,
                'gender' => Employee::GENDERS[$row->gender] ?? ucfirst((string) $row->gender),
                'count' => (int) $row->count,
            ])
            ->toArray();
    }

    /**
     * Return average salary by gender using the basic_salary column on employees.
     *
     * @return array<int, array{gender: string, avg_salary: float, employee_count: int}>
     */
    public function getPayEquityGap(): array
    {
        return Employee::query()
            ->selectRaw('gender, AVG(basic_salary) as avg_salary, COUNT(*) as employee_count')
            ->whereNotNull('gender')
            ->whereNotNull('basic_salary')
            ->groupBy('gender')
            ->get()
            ->map(fn ($row): array => [
                'gender' => Employee::GENDERS[$row->gender] ?? ucfirst((string) $row->gender),
                'avg_salary' => round((float) $row->avg_salary, 2),
                'employee_count' => (int) $row->employee_count,
            ])
            ->toArray();
    }

    /**
     * Return high-level summary statistics for the DEI dashboard.
     *
     * @return array{total_employees: int, gender_parity_index: float, departments_with_data: int, pay_gap_percentage: float}
     */
    public function getSummaryStats(): array
    {
        $totalEmployees = Employee::query()->count();

        $genderCounts = Employee::query()
            ->selectRaw('gender, COUNT(*) as count')
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->pluck('count', 'gender');

        $genderParityIndex = $this->calculateGenderParityIndex($genderCounts->toArray());

        $departmentsWithData = Employee::query()
            ->whereNotNull('department_id')
            ->whereNotNull('gender')
            ->distinct('department_id')
            ->count('department_id');

        $payEquity = $this->getPayEquityGap();
        $payGapPercentage = $this->calculatePayGapPercentage($payEquity);

        return [
            'total_employees' => $totalEmployees,
            'gender_parity_index' => $genderParityIndex,
            'departments_with_data' => $departmentsWithData,
            'pay_gap_percentage' => $payGapPercentage,
        ];
    }

    /**
     * Build age-bracket counts for a collection of employees.
     *
     * @param  Collection<int, Employee>  $employees
     * @return array<string, int>
     */
    private function buildAgeBrackets(Collection $employees): array
    {
        $brackets = ['Under 25' => 0, '25-34' => 0, '35-44' => 0, '45-54' => 0, '55+' => 0];
        $now = Carbon::now();

        foreach ($employees as $emp) {
            if (! $emp->date_of_birth) {
                continue;
            }

            $age = $now->diffInYears(Carbon::parse($emp->date_of_birth));

            if ($age < 25) {
                $brackets['Under 25']++;
            } elseif ($age <= 34) {
                $brackets['25-34']++;
            } elseif ($age <= 44) {
                $brackets['35-44']++;
            } elseif ($age <= 54) {
                $brackets['45-54']++;
            } else {
                $brackets['55+']++;
            }
        }

        return $brackets;
    }

    /**
     * Calculate a gender parity index (0–1) based on representation balance.
     * Returns 1.0 when all genders are equally represented, lower otherwise.
     *
     * @param  array<string, int>  $genderCounts
     */
    private function calculateGenderParityIndex(array $genderCounts): float
    {
        $total = array_sum($genderCounts);

        if ($total === 0 || count($genderCounts) < 2) {
            return 0.0;
        }

        $expected = $total / count($genderCounts);
        $deviationSum = 0.0;

        foreach ($genderCounts as $count) {
            $deviationSum += abs($count - $expected);
        }

        $maxDeviation = $total * (1 - 1 / count($genderCounts));

        return $maxDeviation > 0
            ? round(1 - ($deviationSum / (2 * $maxDeviation)), 4)
            : 1.0;
    }

    /**
     * Calculate pay gap percentage between the highest and lowest avg salary groups.
     *
     * @param  array<int, array{gender: string, avg_salary: float, employee_count: int}>  $payEquity
     */
    private function calculatePayGapPercentage(array $payEquity): float
    {
        if (count($payEquity) < 2) {
            return 0.0;
        }

        $salaries = array_column($payEquity, 'avg_salary');
        $max = max($salaries);
        $min = min($salaries);

        if ($max <= 0) {
            return 0.0;
        }

        return round((($max - $min) / $max) * 100, 2);
    }
}
