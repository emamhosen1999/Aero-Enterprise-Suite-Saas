<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\SuccessionCandidate;
use Aero\HRM\Models\SuccessionPlan;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SuccessionReadinessService
{
    /**
     * Readiness level thresholds.
     */
    public const READY_NOW = 'ready_now';

    public const READY_1_YEAR = 'ready_1_year';

    public const READY_2_YEARS = 'ready_2_years';

    public const NOT_READY = 'not_ready';

    /**
     * Create a succession plan for a position.
     */
    public function createPlan(array $data): SuccessionPlan
    {
        return DB::transaction(function () use ($data) {
            $plan = SuccessionPlan::create([
                'position_title' => $data['position_title'],
                'department_id' => $data['department_id'],
                'current_holder_id' => $data['current_holder_id'] ?? null,
                'criticality' => $data['criticality'] ?? 'high',
                'target_date' => $data['target_date'] ?? null,
                'status' => 'active',
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            Log::info('Succession plan created', [
                'plan_id' => $plan->id,
                'position' => $data['position_title'],
            ]);

            return $plan;
        });
    }

    /**
     * Add a candidate to a succession plan with readiness assessment.
     */
    public function addCandidate(SuccessionPlan $plan, Employee $employee, array $assessment = []): SuccessionCandidate
    {
        return DB::transaction(function () use ($plan, $employee, $assessment) {
            $readinessScore = $assessment['readiness_score'] ?? $this->calculateReadinessScore($employee, $plan);

            $candidate = SuccessionCandidate::create([
                'succession_plan_id' => $plan->id,
                'employee_id' => $employee->id,
                'readiness_level' => $this->getReadinessLevel($readinessScore),
                'readiness_score' => $readinessScore,
                'strengths' => $assessment['strengths'] ?? null,
                'development_gaps' => $assessment['development_gaps'] ?? null,
                'development_plan' => $assessment['development_plan'] ?? null,
                'priority' => $assessment['priority'] ?? 'medium',
                'assessed_at' => now(),
                'assessed_by' => auth()->id(),
            ]);

            Log::info('Succession candidate added', [
                'plan_id' => $plan->id,
                'employee_id' => $employee->id,
                'readiness' => $candidate->readiness_level,
            ]);

            return $candidate;
        });
    }

    /**
     * Calculate readiness score for an employee against a plan position.
     */
    public function calculateReadinessScore(Employee $employee, SuccessionPlan $plan): float
    {
        $score = 0;
        $maxScore = 100;

        $tenureYears = $employee->joining_date
            ? now()->diffInYears($employee->joining_date)
            : 0;
        $score += min($tenureYears * 5, 20);

        $latestReview = $employee->performanceReviews?->sortByDesc('review_period_end')->first();
        if ($latestReview) {
            $score += min(($latestReview->overall_score ?? 0) * 0.3, 30);
        }

        $completedTrainings = $employee->trainingEnrollments?->where('status', 'completed')->count() ?? 0;
        $score += min($completedTrainings * 3, 15);

        $skillsCount = $employee->skills?->count() ?? 0;
        $score += min($skillsCount * 2, 15);

        $leadershipExperience = $employee->subordinates?->count() ?? 0;
        $score += min($leadershipExperience * 5, 20);

        return min(round($score, 1), $maxScore);
    }

    /**
     * Get bench strength analysis for critical positions.
     */
    public function getBenchStrength(?int $departmentId = null): array
    {
        $query = SuccessionPlan::where('status', 'active')
            ->with(['candidates.employee', 'currentHolder']);

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $plans = $query->get();

        $analysis = [];
        foreach ($plans as $plan) {
            $candidates = $plan->candidates;
            $readyNow = $candidates->where('readiness_level', self::READY_NOW)->count();
            $ready1Year = $candidates->where('readiness_level', self::READY_1_YEAR)->count();

            $analysis[] = [
                'plan_id' => $plan->id,
                'position' => $plan->position_title,
                'department_id' => $plan->department_id,
                'criticality' => $plan->criticality,
                'total_candidates' => $candidates->count(),
                'ready_now' => $readyNow,
                'ready_1_year' => $ready1Year,
                'bench_strength' => $this->assessBenchStrength($readyNow, $ready1Year),
                'risk_level' => $this->assessRisk($plan, $readyNow),
            ];
        }

        $totalPlans = count($analysis);
        $atRisk = collect($analysis)->where('risk_level', 'high')->count();

        return [
            'total_plans' => $totalPlans,
            'positions_at_risk' => $atRisk,
            'avg_bench_depth' => $totalPlans > 0
                ? round(collect($analysis)->avg('total_candidates'), 1)
                : 0,
            'coverage_rate' => $totalPlans > 0
                ? round((collect($analysis)->where('ready_now', '>', 0)->count() / $totalPlans) * 100, 1)
                : 0,
            'plans' => $analysis,
        ];
    }

    /**
     * Get development gap analysis for a candidate.
     */
    public function getDevelopmentGaps(SuccessionCandidate $candidate): array
    {
        $employee = $candidate->employee;
        $plan = $candidate->successionPlan;

        $currentSkills = $employee->skills?->pluck('name')->toArray() ?? [];
        $requiredSkills = is_array($plan->required_skills) ? $plan->required_skills : [];

        $skillGaps = array_diff($requiredSkills, $currentSkills);
        $matchedSkills = array_intersect($requiredSkills, $currentSkills);

        return [
            'candidate_id' => $candidate->id,
            'employee_id' => $employee->id,
            'position' => $plan->position_title,
            'readiness_score' => $candidate->readiness_score,
            'skill_match_rate' => count($requiredSkills) > 0
                ? round((count($matchedSkills) / count($requiredSkills)) * 100, 1)
                : 100,
            'matched_skills' => array_values($matchedSkills),
            'skill_gaps' => array_values($skillGaps),
            'development_areas' => $candidate->development_gaps,
            'recommended_actions' => $this->generateDevelopmentRecommendations($skillGaps, $candidate),
        ];
    }

    /**
     * Update readiness assessment for all candidates in a plan.
     */
    public function reassessAllCandidates(SuccessionPlan $plan): Collection
    {
        return DB::transaction(function () use ($plan) {
            $candidates = $plan->candidates()->with('employee')->get();

            foreach ($candidates as $candidate) {
                $newScore = $this->calculateReadinessScore($candidate->employee, $plan);
                $candidate->update([
                    'readiness_score' => $newScore,
                    'readiness_level' => $this->getReadinessLevel($newScore),
                    'assessed_at' => now(),
                ]);
            }

            Log::info('Succession plan candidates reassessed', [
                'plan_id' => $plan->id,
                'candidates_count' => $candidates->count(),
            ]);

            return $candidates->fresh();
        });
    }

    private function getReadinessLevel(float $score): string
    {
        if ($score >= 80) {
            return self::READY_NOW;
        }
        if ($score >= 60) {
            return self::READY_1_YEAR;
        }
        if ($score >= 40) {
            return self::READY_2_YEARS;
        }

        return self::NOT_READY;
    }

    private function assessBenchStrength(int $readyNow, int $ready1Year): string
    {
        if ($readyNow >= 2) {
            return 'strong';
        }
        if ($readyNow >= 1 || $ready1Year >= 2) {
            return 'adequate';
        }
        if ($ready1Year >= 1) {
            return 'weak';
        }

        return 'critical';
    }

    private function assessRisk(SuccessionPlan $plan, int $readyNow): string
    {
        if ($plan->criticality === 'critical' && $readyNow === 0) {
            return 'high';
        }
        if ($plan->criticality === 'high' && $readyNow === 0) {
            return 'high';
        }
        if ($readyNow === 0) {
            return 'medium';
        }

        return 'low';
    }

    private function generateDevelopmentRecommendations(array $skillGaps, SuccessionCandidate $candidate): array
    {
        $recommendations = [];

        foreach (array_slice($skillGaps, 0, 5) as $skill) {
            $recommendations[] = [
                'skill' => $skill,
                'type' => 'training',
                'description' => "Enroll in {$skill} training program",
                'priority' => 'high',
            ];
        }

        if ($candidate->readiness_score < 60) {
            $recommendations[] = [
                'skill' => 'leadership',
                'type' => 'mentoring',
                'description' => 'Assign executive mentor for leadership development',
                'priority' => 'high',
            ];
        }

        return $recommendations;
    }
}
