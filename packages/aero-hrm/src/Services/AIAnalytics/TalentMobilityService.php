<?php

namespace Aero\HRM\Services\AIAnalytics;

use Aero\HRM\Models\AIInsight;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Skill;
use Aero\HRM\Models\TalentMobilityRecommendation;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Talent Mobility Recommendation Service
 *
 * AI-driven internal talent mobility analysis that:
 * - Identifies promotion-ready employees
 * - Recommends lateral moves for skill development
 * - Matches employees to open positions
 * - Suggests mentorship pairings
 * - Identifies high-potential leadership candidates
 *
 * Uses skill matching, performance trends, and organizational needs.
 */
class TalentMobilityService
{
    /**
     * Generate mobility recommendations for an employee
     */
    public function generateRecommendations(Employee $employee): array
    {
        $recommendations = [];

        // Check for promotion readiness
        $promotionRec = $this->checkPromotionReadiness($employee);
        if ($promotionRec) {
            $recommendations[] = $promotionRec;
        }

        // Check for lateral move opportunities
        $lateralRecs = $this->findLateralMoveOpportunities($employee);
        $recommendations = array_merge($recommendations, $lateralRecs);

        // Check for mentorship opportunities
        $mentorshipRec = $this->checkMentorshipOpportunity($employee);
        if ($mentorshipRec) {
            $recommendations[] = $mentorshipRec;
        }

        // Check for leadership track
        $leadershipRec = $this->checkLeadershipPotential($employee);
        if ($leadershipRec) {
            $recommendations[] = $leadershipRec;
        }

        // Check if retention action needed
        $retentionRec = $this->checkRetentionNeed($employee);
        if ($retentionRec) {
            $recommendations[] = $retentionRec;
        }

        // Store recommendations
        foreach ($recommendations as $rec) {
            $this->storeRecommendation($employee, $rec);
        }

        return $recommendations;
    }

    /**
     * Generate recommendations for all active employees
     */
    public function generateForAllEmployees(): Collection
    {
        $employees = Employee::query()
            ->where('employment_status', 'active')
            ->with(['department', 'designation', 'skills', 'performanceReviews'])
            ->get();

        return $employees->map(function (Employee $employee) {
            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->full_name,
                'recommendations' => $this->generateRecommendations($employee),
            ];
        })->filter(fn ($item) => ! empty($item['recommendations']));
    }

    /**
     * Find best internal candidates for a position
     */
    public function findCandidatesForPosition(Designation $designation, ?Department $department = null): Collection
    {
        // Get required skills for the position
        $requiredSkills = $this->getRequiredSkillsForDesignation($designation);

        // Find employees with matching skills
        $candidates = Employee::query()
            ->where('employment_status', 'active')
            ->where('designation_id', '!=', $designation->id)
            ->with(['skills', 'performanceReviews', 'department', 'designation'])
            ->get()
            ->map(function (Employee $employee) use ($requiredSkills) {
                $matchScore = $this->calculateSkillMatchScore($employee, $requiredSkills);
                $skillGaps = $this->identifySkillGaps($employee, $requiredSkills);

                return [
                    'employee' => $employee,
                    'match_score' => $matchScore,
                    'skill_gaps' => $skillGaps,
                    'readiness_months' => $this->estimateReadinessTime($matchScore, count($skillGaps)),
                ];
            })
            ->filter(fn ($c) => $c['match_score'] >= 50)
            ->sortByDesc('match_score')
            ->take(10);

        return $candidates;
    }

    /**
     * Get promotion pipeline for a department
     */
    public function getPromotionPipeline(?int $departmentId = null): Collection
    {
        $query = TalentMobilityRecommendation::query()
            ->with(['employee.department', 'employee.designation', 'targetDesignation'])
            ->where('recommendation_type', 'promotion')
            ->where('status', 'active');

        if ($departmentId) {
            $query->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
        }

        return $query->orderByDesc('match_score')->get();
    }

    /**
     * Check if employee is ready for promotion
     */
    protected function checkPromotionReadiness(Employee $employee): ?array
    {
        $score = 0;
        $factors = [];

        // Check tenure in current role
        $roleMonths = $employee->designation_change_date
            ? Carbon::parse($employee->designation_change_date)->diffInMonths(now())
            : ($employee->joining_date
                ? Carbon::parse($employee->joining_date)->diffInMonths(now())
                : 0);

        if ($roleMonths >= 18) {
            $score += 20;
            $factors[] = 'Sufficient time in current role';
        }

        // Check performance trend
        $performanceScore = $this->getPerformanceScore($employee);
        if ($performanceScore >= 4) {
            $score += 30;
            $factors[] = 'Strong performance ratings';
        } elseif ($performanceScore >= 3.5) {
            $score += 20;
            $factors[] = 'Good performance ratings';
        }

        // Check skill development
        $skillProgress = $this->getSkillProgressScore($employee);
        if ($skillProgress >= 80) {
            $score += 25;
            $factors[] = 'Excellent skill development';
        } elseif ($skillProgress >= 60) {
            $score += 15;
            $factors[] = 'Good skill development';
        }

        // Check if taking on additional responsibilities
        $additionalResponsibilities = $this->hasAdditionalResponsibilities($employee);
        if ($additionalResponsibilities) {
            $score += 25;
            $factors[] = 'Demonstrated leadership/additional responsibilities';
        }

        if ($score >= 65) {
            // Find next level designation
            $nextLevel = $this->findNextLevelDesignation($employee->designation);

            return [
                'type' => 'promotion',
                'match_score' => $score,
                'target_designation_id' => $nextLevel?->id,
                'target_role_name' => $nextLevel?->name ?? 'Senior '.$employee->designation?->name,
                'matching_skills' => $factors,
                'skill_gaps' => $this->identifySkillGapsForPromotion($employee, $nextLevel),
                'rationale' => 'Employee demonstrates readiness for promotion based on performance, tenure, and skill development.',
                'estimated_readiness_months' => $score >= 80 ? 0 : 3,
            ];
        }

        return null;
    }

    /**
     * Find lateral move opportunities
     */
    protected function findLateralMoveOpportunities(Employee $employee): array
    {
        $opportunities = [];

        // Get employee's transferable skills
        $employeeSkills = $employee->skills->pluck('name')->toArray();

        // Find related designations at same level
        $currentGradeLevel = $employee->designation?->grade_level ?? $employee->grade?->level ?? 1;

        $relatedDesignations = Designation::query()
            ->where('id', '!=', $employee->designation_id)
            ->where(function ($q) use ($currentGradeLevel) {
                $q->where('grade_level', $currentGradeLevel)
                    ->orWhere('grade_level', $currentGradeLevel + 1);
            })
            ->get();

        foreach ($relatedDesignations as $designation) {
            $requiredSkills = $this->getRequiredSkillsForDesignation($designation);
            $matchScore = $this->calculateSkillMatchScore($employee, $requiredSkills);

            if ($matchScore >= 60 && $matchScore < 90) { // Good fit but needs some growth
                $opportunities[] = [
                    'type' => 'lateral_move',
                    'match_score' => $matchScore,
                    'target_designation_id' => $designation->id,
                    'target_role_name' => $designation->name,
                    'target_department_id' => $designation->department_id,
                    'matching_skills' => $this->getMatchingSkills($employee, $requiredSkills),
                    'skill_gaps' => $this->identifySkillGaps($employee, $requiredSkills),
                    'rationale' => "Could broaden experience through transition to {$designation->name}",
                    'estimated_readiness_months' => $this->estimateReadinessTime($matchScore, 2),
                ];
            }
        }

        // Sort by match score and take top 3
        usort($opportunities, fn ($a, $b) => $b['match_score'] <=> $a['match_score']);

        return array_slice($opportunities, 0, 3);
    }

    /**
     * Check mentorship opportunities
     */
    protected function checkMentorshipOpportunity(Employee $employee): ?array
    {
        $tenureYears = $employee->joining_date
            ? Carbon::parse($employee->joining_date)->diffInYears(now())
            : 0;

        $performanceScore = $this->getPerformanceScore($employee);

        // Senior employees with good performance should mentor
        if ($tenureYears >= 5 && $performanceScore >= 3.5) {
            // Find potential mentees
            $menteeCount = Employee::query()
                ->where('department_id', $employee->department_id)
                ->where('id', '!=', $employee->id)
                ->where('joining_date', '>=', now()->subYear())
                ->count();

            if ($menteeCount > 0) {
                return [
                    'type' => 'mentorship',
                    'match_score' => 75 + ($performanceScore * 5),
                    'matching_skills' => ['Experience', 'Performance track record'],
                    'skill_gaps' => [],
                    'rationale' => "Senior employee ({$tenureYears} years) with strong performance could mentor {$menteeCount} newer team members.",
                    'estimated_readiness_months' => 0,
                    'development_path' => ['Complete mentorship training', 'Pair with new hire'],
                ];
            }
        }

        // Junior employees who would benefit from mentorship
        if ($tenureYears < 2 && $performanceScore < 3) {
            return [
                'type' => 'mentorship',
                'match_score' => 70,
                'matching_skills' => [],
                'skill_gaps' => ['Experience', 'Skill development'],
                'rationale' => 'Employee would benefit from structured mentorship program.',
                'estimated_readiness_months' => 0,
                'development_path' => ['Pair with senior mentor', 'Regular check-ins'],
            ];
        }

        return null;
    }

    /**
     * Check for leadership potential
     */
    protected function checkLeadershipPotential(Employee $employee): ?array
    {
        $score = 0;
        $indicators = [];

        // Check performance consistency
        $performanceScore = $this->getPerformanceScore($employee);
        if ($performanceScore >= 4) {
            $score += 30;
            $indicators[] = 'Consistently high performance';
        }

        // Check skill breadth
        $skillCount = $employee->skills?->count() ?? 0;
        if ($skillCount >= 8) {
            $score += 20;
            $indicators[] = 'Broad skill set';
        }

        // Check cross-functional experience (simulated)
        $projectCount = DB::table('project_team_members')
            ->where('employee_id', $employee->id)
            ->distinct('project_id')
            ->count('project_id');

        if ($projectCount >= 5) {
            $score += 20;
            $indicators[] = 'Cross-functional project experience';
        }

        // Check tenure
        $tenureYears = $employee->joining_date
            ? Carbon::parse($employee->joining_date)->diffInYears(now())
            : 0;

        if ($tenureYears >= 3 && $tenureYears <= 8) {
            $score += 15;
            $indicators[] = 'Optimal tenure for growth';
        }

        // Already managing people?
        $directReports = Employee::where('manager_id', $employee->id)->count();
        if ($directReports == 0 && $score >= 60) {
            $score += 15;
            $indicators[] = 'Ready for first management role';
        }

        if ($score >= 70) {
            return [
                'type' => 'leadership_track',
                'match_score' => $score,
                'matching_skills' => $indicators,
                'skill_gaps' => $directReports == 0
                    ? ['People management', 'Leadership training']
                    : [],
                'rationale' => 'High-potential candidate for leadership development track.',
                'estimated_readiness_months' => $directReports == 0 ? 6 : 0,
                'development_path' => [
                    'Complete leadership training',
                    'Lead cross-functional project',
                    'Shadow current manager',
                ],
            ];
        }

        return null;
    }

    /**
     * Check if retention action needed
     */
    protected function checkRetentionNeed(Employee $employee): ?array
    {
        // Get risk score if available
        $riskScore = DB::table('employee_risk_scores')
            ->where('employee_id', $employee->id)
            ->first();

        if ($riskScore && $riskScore->attrition_risk_score >= 60) {
            return [
                'type' => 'retention_action',
                'match_score' => $riskScore->attrition_risk_score,
                'matching_skills' => [],
                'skill_gaps' => [],
                'rationale' => "High attrition risk ({$riskScore->attrition_risk_score}%). Immediate retention action recommended.",
                'estimated_readiness_months' => 0,
                'development_path' => [
                    'Schedule retention conversation',
                    'Review compensation',
                    'Discuss career aspirations',
                    'Address identified concerns',
                ],
            ];
        }

        return null;
    }

    /**
     * Get performance score (average of recent reviews)
     */
    protected function getPerformanceScore(Employee $employee): float
    {
        return $employee->performanceReviews()
            ->orderByDesc('review_period')
            ->limit(3)
            ->avg('overall_rating') ?? 3.0;
    }

    /**
     * Get skill progress score
     */
    protected function getSkillProgressScore(Employee $employee): float
    {
        // Compare current skills to 6 months ago
        $currentSkillCount = $employee->skills?->count() ?? 0;

        // This would ideally track historical skill data
        // For now, use a simplified calculation
        return min(100, $currentSkillCount * 10);
    }

    /**
     * Check if employee has additional responsibilities
     */
    protected function hasAdditionalResponsibilities(Employee $employee): bool
    {
        // Check for team lead or project lead assignments
        $directReports = Employee::where('manager_id', $employee->id)->count();

        if ($directReports > 0) {
            return true;
        }

        // Check project leadership (simulated)
        $leadProjects = DB::table('project_team_members')
            ->where('employee_id', $employee->id)
            ->where('role', 'lead')
            ->count();

        return $leadProjects > 0;
    }

    /**
     * Find next level designation
     */
    protected function findNextLevelDesignation(?Designation $current): ?Designation
    {
        if (! $current) {
            return null;
        }

        // Look for parent or higher level in same department
        if ($current->parent_id) {
            return Designation::find($current->parent_id);
        }

        // Find similar designation with higher grade
        return Designation::query()
            ->where('department_id', $current->department_id)
            ->where('grade_level', '>', $current->grade_level ?? 0)
            ->orderBy('grade_level')
            ->first();
    }

    /**
     * Get required skills for a designation
     */
    protected function getRequiredSkillsForDesignation(Designation $designation): array
    {
        // This would ideally come from a skills requirement matrix
        // For now, return common skills based on designation name
        $name = strtolower($designation->name);

        $skillSets = [
            'manager' => ['Leadership', 'Communication', 'Strategic Planning', 'Team Management'],
            'engineer' => ['Programming', 'Problem Solving', 'Technical Design', 'Code Review'],
            'analyst' => ['Data Analysis', 'Excel', 'SQL', 'Reporting'],
            'designer' => ['UI/UX', 'Figma', 'Adobe Creative', 'Prototyping'],
        ];

        foreach ($skillSets as $keyword => $skills) {
            if (str_contains($name, $keyword)) {
                return $skills;
            }
        }

        return ['Communication', 'Teamwork', 'Problem Solving'];
    }

    /**
     * Calculate skill match score
     */
    protected function calculateSkillMatchScore(Employee $employee, array $requiredSkills): float
    {
        if (empty($requiredSkills)) {
            return 50;
        }

        $employeeSkills = $employee->skills?->pluck('name')->map(fn ($s) => strtolower($s))->toArray() ?? [];
        $requiredLower = array_map('strtolower', $requiredSkills);

        $matchCount = count(array_intersect($employeeSkills, $requiredLower));

        return ($matchCount / count($requiredSkills)) * 100;
    }

    /**
     * Get matching skills
     */
    protected function getMatchingSkills(Employee $employee, array $requiredSkills): array
    {
        $employeeSkills = $employee->skills?->pluck('name')->map(fn ($s) => strtolower($s))->toArray() ?? [];
        $requiredLower = array_map('strtolower', $requiredSkills);

        return array_values(array_intersect($employeeSkills, $requiredLower));
    }

    /**
     * Identify skill gaps
     */
    protected function identifySkillGaps(Employee $employee, array $requiredSkills): array
    {
        $employeeSkills = $employee->skills?->pluck('name')->map(fn ($s) => strtolower($s))->toArray() ?? [];
        $requiredLower = array_map('strtolower', $requiredSkills);

        return array_values(array_diff($requiredLower, $employeeSkills));
    }

    /**
     * Identify skill gaps for promotion
     */
    protected function identifySkillGapsForPromotion(Employee $employee, ?Designation $nextLevel): array
    {
        if (! $nextLevel) {
            return ['Leadership skills', 'Strategic thinking'];
        }

        return $this->identifySkillGaps($employee, $this->getRequiredSkillsForDesignation($nextLevel));
    }

    /**
     * Estimate readiness time in months
     */
    protected function estimateReadinessTime(float $matchScore, int $gapCount): int
    {
        if ($matchScore >= 90) {
            return 0;
        } elseif ($matchScore >= 80) {
            return 1;
        } elseif ($matchScore >= 70) {
            return 3;
        } elseif ($matchScore >= 60) {
            return 6;
        }

        return 6 + ($gapCount * 2);
    }

    /**
     * Store recommendation
     */
    protected function storeRecommendation(Employee $employee, array $recommendation): void
    {
        // Check for existing active recommendation of same type
        $existing = TalentMobilityRecommendation::query()
            ->where('employee_id', $employee->id)
            ->where('recommendation_type', $recommendation['type'])
            ->where('status', 'active')
            ->first();

        $data = [
            'recommendation_type' => $recommendation['type'],
            'target_designation_id' => $recommendation['target_designation_id'] ?? null,
            'target_department_id' => $recommendation['target_department_id'] ?? null,
            'target_role_name' => $recommendation['target_role_name'] ?? null,
            'match_score' => $recommendation['match_score'],
            'matching_skills' => $recommendation['matching_skills'],
            'skill_gaps' => $recommendation['skill_gaps'],
            'development_path' => $recommendation['development_path'] ?? null,
            'rationale' => $recommendation['rationale'],
            'estimated_readiness_months' => $recommendation['estimated_readiness_months'] ?? null,
            'valid_until' => now()->addMonths(6),
        ];

        if ($existing) {
            $existing->update($data);
        } else {
            TalentMobilityRecommendation::create(array_merge($data, [
                'employee_id' => $employee->id,
                'status' => 'active',
            ]));

            // Create insight for high-priority recommendations
            if ($recommendation['match_score'] >= 80) {
                AIInsight::create([
                    'insight_type' => 'mobility_opportunity',
                    'severity' => 'info',
                    'scope' => 'employee',
                    'employee_id' => $employee->id,
                    'department_id' => $employee->department_id,
                    'title' => ucfirst(str_replace('_', ' ', $recommendation['type'])).": {$employee->full_name}",
                    'description' => $recommendation['rationale'],
                    'recommended_actions' => $recommendation['development_path'] ?? [],
                    'confidence_score' => $recommendation['match_score'],
                    'insight_date' => now()->toDateString(),
                ]);
            }
        }
    }
}
