<?php

namespace Aero\HRM\Services\Performance;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Competency Matrix Service
 *
 * Manages skills, competencies, and proficiency tracking
 * for employee development and career planning.
 */
class CompetencyMatrixService
{
    /**
     * Competency categories.
     */
    public const CATEGORY_TECHNICAL = 'technical';
    public const CATEGORY_LEADERSHIP = 'leadership';
    public const CATEGORY_BEHAVIORAL = 'behavioral';
    public const CATEGORY_FUNCTIONAL = 'functional';
    public const CATEGORY_INDUSTRY = 'industry';

    /**
     * Proficiency levels.
     */
    public const LEVEL_NOVICE = 1;
    public const LEVEL_BEGINNER = 2;
    public const LEVEL_INTERMEDIATE = 3;
    public const LEVEL_ADVANCED = 4;
    public const LEVEL_EXPERT = 5;

    /**
     * Proficiency level labels.
     */
    protected array $levelLabels = [
        1 => 'Novice',
        2 => 'Beginner',
        3 => 'Intermediate',
        4 => 'Advanced',
        5 => 'Expert',
    ];

    /**
     * Level descriptions.
     */
    protected array $levelDescriptions = [
        1 => 'Basic awareness, requires supervision',
        2 => 'Working knowledge, occasional guidance needed',
        3 => 'Practical application, works independently',
        4 => 'Deep expertise, can guide others',
        5 => 'Strategic mastery, industry recognition',
    ];

    /**
     * Create a competency.
     */
    public function createCompetency(array $data): array
    {
        $competencyId = Str::uuid()->toString();

        $competency = [
            'id' => $competencyId,
            'name' => $data['name'],
            'code' => $data['code'] ?? Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? self::CATEGORY_TECHNICAL,
            'is_core' => $data['is_core'] ?? false,
            'levels' => $this->buildLevelDefinitions($data['levels'] ?? []),
            'behavioral_indicators' => $data['behavioral_indicators'] ?? [],
            'applicable_roles' => $data['applicable_roles'] ?? [],
            'applicable_departments' => $data['applicable_departments'] ?? [],
            'related_competencies' => $data['related_competencies'] ?? [],
            'assessment_methods' => $data['assessment_methods'] ?? ['self', 'manager', 'test'],
            'weight' => $data['weight'] ?? 1.0,
            'is_active' => true,
            'created_at' => now()->toIso8601String(),
            'metadata' => $data['metadata'] ?? [],
        ];

        Log::info('Competency created', [
            'competency_id' => $competencyId,
            'name' => $data['name'],
            'category' => $competency['category'],
        ]);

        return ['success' => true, 'competency' => $competency];
    }

    /**
     * Create a competency framework for a role.
     */
    public function createRoleFramework(string $roleId, array $data): array
    {
        $frameworkId = Str::uuid()->toString();

        $framework = [
            'id' => $frameworkId,
            'role_id' => $roleId,
            'role_name' => $data['role_name'],
            'department_id' => $data['department_id'] ?? null,
            'level' => $data['level'] ?? null, // junior, mid, senior, lead
            'required_competencies' => $this->processFrameworkCompetencies($data['competencies'] ?? []),
            'nice_to_have_competencies' => $data['nice_to_have'] ?? [],
            'career_path' => $data['career_path'] ?? [],
            'version' => 1,
            'effective_date' => $data['effective_date'] ?? now()->toDateString(),
            'created_at' => now()->toIso8601String(),
        ];

        Log::info('Role framework created', [
            'framework_id' => $frameworkId,
            'role_id' => $roleId,
        ]);

        return ['success' => true, 'framework' => $framework];
    }

    /**
     * Assess employee competency.
     */
    public function assessCompetency(int $employeeId, string $competencyId, array $data): array
    {
        $assessmentId = Str::uuid()->toString();

        $assessment = [
            'id' => $assessmentId,
            'employee_id' => $employeeId,
            'competency_id' => $competencyId,
            'assessor_id' => $data['assessor_id'] ?? null,
            'assessor_type' => $data['assessor_type'] ?? 'manager', // self, manager, peer, external
            'current_level' => $data['current_level'],
            'target_level' => $data['target_level'] ?? null,
            'evidence' => $data['evidence'] ?? [],
            'observations' => $data['observations'] ?? null,
            'development_suggestions' => $data['development_suggestions'] ?? [],
            'assessed_at' => now()->toIso8601String(),
            'next_assessment_date' => $data['next_assessment_date'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ];

        Log::info('Competency assessed', [
            'assessment_id' => $assessmentId,
            'employee_id' => $employeeId,
            'competency_id' => $competencyId,
            'level' => $data['current_level'],
        ]);

        return ['success' => true, 'assessment' => $assessment];
    }

    /**
     * Get employee skill profile.
     */
    public function getEmployeeProfile(int $employeeId): array
    {
        // In production, query from database
        return [
            'employee_id' => $employeeId,
            'competencies' => [],
            'skills' => [],
            'certifications' => [],
            'gap_analysis' => [],
            'development_recommendations' => [],
            'overall_proficiency_score' => 0,
            'last_updated' => null,
        ];
    }

    /**
     * Perform gap analysis.
     */
    public function performGapAnalysis(int $employeeId, string $targetRoleId): array
    {
        // Get current competencies and target framework
        $currentProfile = $this->getEmployeeProfile($employeeId);

        return [
            'employee_id' => $employeeId,
            'target_role_id' => $targetRoleId,
            'gaps' => [],
            'strengths' => [],
            'readiness_score' => 0,
            'estimated_development_time' => null,
            'recommended_actions' => [],
            'learning_resources' => [],
        ];
    }

    /**
     * Create development plan from gaps.
     */
    public function createDevelopmentPlan(int $employeeId, array $gaps, array $options = []): array
    {
        $planId = Str::uuid()->toString();

        $developmentItems = array_map(function ($gap) {
            return [
                'id' => Str::uuid()->toString(),
                'competency_id' => $gap['competency_id'],
                'competency_name' => $gap['competency_name'],
                'current_level' => $gap['current_level'],
                'target_level' => $gap['target_level'],
                'priority' => $gap['priority'] ?? 'medium',
                'actions' => $this->suggestDevelopmentActions($gap),
                'resources' => $this->suggestLearningResources($gap),
                'timeline' => $gap['timeline'] ?? '3 months',
                'status' => 'not_started',
                'progress' => 0,
            ];
        }, $gaps);

        $plan = [
            'id' => $planId,
            'employee_id' => $employeeId,
            'type' => $options['type'] ?? 'skill_development',
            'title' => $options['title'] ?? 'Individual Development Plan',
            'period' => [
                'start_date' => $options['start_date'] ?? now()->toDateString(),
                'end_date' => $options['end_date'] ?? now()->addMonths(6)->toDateString(),
            ],
            'items' => $developmentItems,
            'mentor_id' => $options['mentor_id'] ?? null,
            'check_in_frequency' => $options['check_in_frequency'] ?? 'monthly',
            'status' => 'active',
            'created_at' => now()->toIso8601String(),
        ];

        Log::info('Development plan created', [
            'plan_id' => $planId,
            'employee_id' => $employeeId,
            'items_count' => count($developmentItems),
        ]);

        return ['success' => true, 'plan' => $plan];
    }

    /**
     * Track skill endorsement.
     */
    public function endorseSkill(int $employeeId, string $competencyId, int $endorserId): array
    {
        $endorsement = [
            'id' => Str::uuid()->toString(),
            'employee_id' => $employeeId,
            'competency_id' => $competencyId,
            'endorser_id' => $endorserId,
            'endorsed_at' => now()->toIso8601String(),
        ];

        Log::info('Skill endorsed', [
            'employee_id' => $employeeId,
            'competency_id' => $competencyId,
            'endorser_id' => $endorserId,
        ]);

        return ['success' => true, 'endorsement' => $endorsement];
    }

    /**
     * Get competency analytics.
     */
    public function getAnalytics(array $filters = []): array
    {
        return [
            'organization_overview' => [
                'total_competencies' => 0,
                'average_proficiency' => 0,
                'skill_coverage' => 0,
            ],
            'by_department' => [],
            'by_category' => [],
            'skill_gaps' => [],
            'trending_skills' => [],
            'certification_stats' => [],
        ];
    }

    /**
     * Find employees by skill.
     */
    public function findBySkill(string $competencyId, int $minLevel = 1): array
    {
        return [
            'competency_id' => $competencyId,
            'min_level' => $minLevel,
            'employees' => [],
            'total_count' => 0,
        ];
    }

    /**
     * Generate skill matrix for team.
     */
    public function generateTeamMatrix(int $teamId, array $competencyIds = []): array
    {
        return [
            'team_id' => $teamId,
            'competencies' => [],
            'members' => [],
            'matrix' => [], // employee_id => competency_id => level
            'team_averages' => [],
            'coverage_analysis' => [],
        ];
    }

    /**
     * Build level definitions.
     */
    protected function buildLevelDefinitions(array $customLevels): array
    {
        $levels = [];

        for ($i = 1; $i <= 5; $i++) {
            $levels[$i] = [
                'level' => $i,
                'name' => $customLevels[$i]['name'] ?? $this->levelLabels[$i],
                'description' => $customLevels[$i]['description'] ?? $this->levelDescriptions[$i],
                'indicators' => $customLevels[$i]['indicators'] ?? [],
            ];
        }

        return $levels;
    }

    /**
     * Process framework competencies.
     */
    protected function processFrameworkCompetencies(array $competencies): array
    {
        return array_map(function ($comp) {
            return [
                'competency_id' => $comp['competency_id'] ?? $comp['id'],
                'required_level' => $comp['required_level'] ?? 3,
                'weight' => $comp['weight'] ?? 1.0,
                'is_critical' => $comp['is_critical'] ?? false,
            ];
        }, $competencies);
    }

    /**
     * Suggest development actions for a gap.
     */
    protected function suggestDevelopmentActions(array $gap): array
    {
        $levelDiff = ($gap['target_level'] ?? 3) - ($gap['current_level'] ?? 1);

        $actions = [];

        if ($levelDiff >= 1) {
            $actions[] = [
                'type' => 'training',
                'description' => 'Complete foundational training course',
            ];
        }

        if ($levelDiff >= 2) {
            $actions[] = [
                'type' => 'mentoring',
                'description' => 'Work with a mentor on practical application',
            ];
            $actions[] = [
                'type' => 'project',
                'description' => 'Take on stretch project to apply skills',
            ];
        }

        if ($levelDiff >= 3) {
            $actions[] = [
                'type' => 'certification',
                'description' => 'Pursue professional certification',
            ];
        }

        return $actions;
    }

    /**
     * Suggest learning resources for a gap.
     */
    protected function suggestLearningResources(array $gap): array
    {
        return [
            [
                'type' => 'course',
                'name' => 'Online course recommendation',
                'provider' => 'Internal LMS',
            ],
            [
                'type' => 'book',
                'name' => 'Recommended reading',
            ],
            [
                'type' => 'workshop',
                'name' => 'Hands-on workshop',
            ],
        ];
    }
}
