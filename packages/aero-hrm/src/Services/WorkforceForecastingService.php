<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\WorkforcePlan;
use Aero\HRM\Models\WorkforcePlanPosition;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WorkforceForecastingService
{
    /**
     * Create a workforce planning scenario.
     */
    public function createPlan(array $data): WorkforcePlan
    {
        return DB::transaction(function () use ($data) {
            $plan = WorkforcePlan::create([
                'title' => $data['title'],
                'department_id' => $data['department_id'] ?? null,
                'planning_period_start' => $data['period_start'],
                'planning_period_end' => $data['period_end'],
                'scenario_type' => $data['scenario_type'] ?? 'baseline',
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            if (! empty($data['positions'])) {
                foreach ($data['positions'] as $position) {
                    WorkforcePlanPosition::create(array_merge($position, [
                        'workforce_plan_id' => $plan->id,
                    ]));
                }
            }

            Log::info('Workforce plan created', [
                'plan_id' => $plan->id,
                'scenario' => $data['scenario_type'] ?? 'baseline',
            ]);

            return $plan->load('positions');
        });
    }

    /**
     * Forecast headcount needs based on historical attrition and growth.
     */
    public function forecastHeadcount(int $departmentId, int $monthsAhead = 12): array
    {
        $currentHeadcount = Employee::where('department_id', $departmentId)
            ->where('status', 'active')
            ->count();

        $historicalAttrition = $this->calculateHistoricalAttrition($departmentId, 12);
        $monthlyAttritionRate = $historicalAttrition / 12;

        $forecast = [];
        $projected = $currentHeadcount;

        for ($month = 1; $month <= $monthsAhead; $month++) {
            $attrition = (int) round($projected * $monthlyAttritionRate);
            $projected = max($projected - $attrition, 0);

            $forecast[] = [
                'month' => $month,
                'date' => now()->addMonths($month)->format('Y-m'),
                'projected_headcount' => $projected,
                'estimated_attrition' => $attrition,
                'cumulative_attrition' => $currentHeadcount - $projected,
            ];
        }

        return [
            'department_id' => $departmentId,
            'current_headcount' => $currentHeadcount,
            'annual_attrition_rate' => round($historicalAttrition * 100, 1),
            'monthly_attrition_rate' => round($monthlyAttritionRate * 100, 2),
            'projected_end_headcount' => $projected,
            'estimated_hires_needed' => $currentHeadcount - $projected,
            'forecast' => $forecast,
        ];
    }

    /**
     * Run scenario comparison (baseline vs growth vs reduction).
     */
    public function compareScenarios(int $departmentId, array $scenarios): array
    {
        $currentHeadcount = Employee::where('department_id', $departmentId)
            ->where('status', 'active')
            ->count();

        $results = [];

        foreach ($scenarios as $scenario) {
            $growthRate = $scenario['growth_rate'] ?? 0;
            $attritionRate = $scenario['attrition_rate'] ?? $this->calculateHistoricalAttrition($departmentId, 12);
            $months = $scenario['months'] ?? 12;

            $projected = $currentHeadcount;
            for ($m = 1; $m <= $months; $m++) {
                $projected = $projected * (1 + ($growthRate / 12)) * (1 - ($attritionRate / 12));
            }

            $hiresNeeded = max((int) round($projected - $currentHeadcount + ($currentHeadcount * $attritionRate)), 0);
            $costImpact = $hiresNeeded * ($scenario['avg_cost_per_hire'] ?? 5000);

            $results[] = [
                'name' => $scenario['name'],
                'growth_rate' => $growthRate,
                'attrition_rate' => $attritionRate,
                'projected_headcount' => (int) round($projected),
                'net_change' => (int) round($projected - $currentHeadcount),
                'hires_needed' => $hiresNeeded,
                'estimated_cost' => $costImpact,
            ];
        }

        return [
            'department_id' => $departmentId,
            'current_headcount' => $currentHeadcount,
            'scenarios' => $results,
        ];
    }

    /**
     * Analyze workforce composition and identify gaps.
     */
    public function analyzeComposition(?int $departmentId = null): array
    {
        $query = Employee::where('status', 'active');
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $employees = $query->with(['department', 'designation'])->get();

        $byDepartment = $employees->groupBy('department_id')->map->count();
        $byDesignation = $employees->groupBy('designation_id')->map->count();

        $tenureDistribution = $employees->groupBy(function ($e) {
            $years = $e->joining_date ? now()->diffInYears($e->joining_date) : 0;
            if ($years < 1) {
                return '< 1 year';
            }
            if ($years < 3) {
                return '1-3 years';
            }
            if ($years < 5) {
                return '3-5 years';
            }
            if ($years < 10) {
                return '5-10 years';
            }

            return '10+ years';
        })->map->count();

        $avgTenure = $employees->avg(function ($e) {
            return $e->joining_date ? now()->diffInYears($e->joining_date) : 0;
        });

        return [
            'total_employees' => $employees->count(),
            'by_department' => $byDepartment->toArray(),
            'by_designation' => $byDesignation->toArray(),
            'tenure_distribution' => $tenureDistribution->toArray(),
            'avg_tenure_years' => round($avgTenure, 1),
            'retirement_risk' => $this->calculateRetirementRisk($employees),
        ];
    }

    /**
     * Predict attrition risk by department.
     */
    public function predictAttritionByDepartment(): array
    {
        $departments = Employee::where('status', 'active')
            ->select('department_id')
            ->distinct()
            ->pluck('department_id');

        $predictions = [];

        foreach ($departments as $deptId) {
            $rate = $this->calculateHistoricalAttrition($deptId, 12);
            $headcount = Employee::where('department_id', $deptId)->where('status', 'active')->count();

            $predictions[] = [
                'department_id' => $deptId,
                'headcount' => $headcount,
                'attrition_rate' => round($rate * 100, 1),
                'predicted_departures_12m' => (int) round($headcount * $rate),
                'risk_level' => $rate > 0.2 ? 'high' : ($rate > 0.1 ? 'medium' : 'low'),
            ];
        }

        usort($predictions, fn ($a, $b) => $b['attrition_rate'] <=> $a['attrition_rate']);

        return $predictions;
    }

    private function calculateHistoricalAttrition(int $departmentId, int $months): float
    {
        $startDate = now()->subMonths($months);

        $departedCount = Employee::where('department_id', $departmentId)
            ->where('status', 'inactive')
            ->where('updated_at', '>=', $startDate)
            ->count();

        $avgHeadcount = Employee::where('department_id', $departmentId)
            ->where(function ($q) use ($startDate) {
                $q->where('status', 'active')
                    ->orWhere('updated_at', '>=', $startDate);
            })
            ->count();

        return $avgHeadcount > 0 ? $departedCount / $avgHeadcount : 0;
    }

    private function calculateRetirementRisk(Collection $employees): array
    {
        $nearRetirement = $employees->filter(function ($e) {
            if (! $e->date_of_birth) {
                return false;
            }
            $age = now()->diffInYears($e->date_of_birth);

            return $age >= 58;
        });

        return [
            'count' => $nearRetirement->count(),
            'percentage' => $employees->count() > 0
                ? round(($nearRetirement->count() / $employees->count()) * 100, 1)
                : 0,
            'by_department' => $nearRetirement->groupBy('department_id')->map->count()->toArray(),
        ];
    }
}
