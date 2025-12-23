<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\Core\Http\Controllers\Controller;
use Aero\HRM\Services\Performance\CompetencyMatrixService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SkillMatrixController extends Controller
{
    public function __construct(
        protected CompetencyMatrixService $competencyService
    ) {}

    /**
     * Display competency matrix dashboard.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['category', 'department_id']);
        
        return Inertia::render('Hrm/Performance/Competencies/Index', [
            'competencies' => fn () => $this->competencyService->getCompetencies($filters),
            'categories' => CompetencyMatrixService::CATEGORIES,
            'filters' => $filters,
        ]);
    }

    /**
     * Create new competency.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|in:' . implode(',', CompetencyMatrixService::CATEGORIES),
            'level_descriptions' => 'nullable|array',
        ]);
        
        $result = $this->competencyService->createCompetency($validated);
        
        if ($result['success']) {
            return back()->with('success', 'Competency created successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to create competency');
    }

    /**
     * Update competency.
     */
    public function update(Request $request, string $competencyId)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|string',
            'level_descriptions' => 'nullable|array',
        ]);
        
        $result = $this->competencyService->updateCompetency($competencyId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Competency updated successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to update competency');
    }

    /**
     * Delete competency.
     */
    public function destroy(string $competencyId)
    {
        $result = $this->competencyService->deleteCompetency($competencyId);
        
        if ($result['success']) {
            return back()->with('success', 'Competency deleted successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to delete competency');
    }

    /**
     * View role frameworks.
     */
    public function roleFrameworks(Request $request): Response
    {
        return Inertia::render('Hrm/Performance/Competencies/RoleFrameworks', [
            'frameworks' => fn () => $this->competencyService->getRoleFrameworks(),
        ]);
    }

    /**
     * Create role framework.
     */
    public function createRoleFramework(Request $request)
    {
        $validated = $request->validate([
            'role_id' => 'required|string',
            'role_name' => 'required|string',
            'competencies' => 'required|array',
            'competencies.*.competency_id' => 'required|string',
            'competencies.*.required_level' => 'required|integer|min:1|max:5',
            'competencies.*.weight' => 'nullable|numeric|min:0|max:1',
        ]);
        
        $result = $this->competencyService->createRoleFramework($validated);
        
        if ($result['success']) {
            return back()->with('success', 'Role framework created successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to create framework');
    }

    /**
     * View employee competency profile.
     */
    public function employeeProfile(Request $request, int $employeeId): Response
    {
        return Inertia::render('Hrm/Performance/Competencies/EmployeeProfile', [
            'employeeId' => $employeeId,
            'profile' => fn () => $this->competencyService->getEmployeeProfile($employeeId),
        ]);
    }

    /**
     * Assess employee competency level.
     */
    public function assessCompetency(Request $request, int $employeeId, string $competencyId)
    {
        $validated = $request->validate([
            'level' => 'required|integer|min:1|max:5',
            'notes' => 'nullable|string',
            'evidence' => 'nullable|string',
        ]);
        
        $validated['assessed_by'] = $request->user()->id;
        
        $result = $this->competencyService->assessEmployeeCompetency(
            $employeeId,
            $competencyId,
            $validated
        );
        
        if ($result['success']) {
            return back()->with('success', 'Competency assessed');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to assess competency');
    }

    /**
     * Perform gap analysis for employee.
     */
    public function gapAnalysis(Request $request, int $employeeId): Response
    {
        $targetRoleId = $request->get('target_role_id');
        
        return Inertia::render('Hrm/Performance/Competencies/GapAnalysis', [
            'employeeId' => $employeeId,
            'targetRoleId' => $targetRoleId,
            'gapAnalysis' => fn () => $this->competencyService->analyzeGaps($employeeId, $targetRoleId),
            'developmentPlan' => fn () => $targetRoleId 
                ? $this->competencyService->generateDevelopmentPlan($employeeId, $targetRoleId)
                : null,
        ]);
    }

    /**
     * Add skill endorsement.
     */
    public function endorse(Request $request, int $employeeId, string $competencyId)
    {
        $validated = $request->validate([
            'comment' => 'nullable|string',
        ]);
        
        $result = $this->competencyService->endorseSkill(
            $employeeId,
            $competencyId,
            $request->user()->id,
            $validated['comment'] ?? null
        );
        
        if ($result['success']) {
            return back()->with('success', 'Endorsement added');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to add endorsement');
    }

    /**
     * View team skills matrix.
     */
    public function teamMatrix(Request $request): Response
    {
        $departmentId = $request->get('department_id');
        $teamId = $request->get('team_id');
        
        return Inertia::render('Hrm/Performance/Competencies/TeamMatrix', [
            'matrix' => fn () => $this->competencyService->getTeamSkillMatrix($departmentId, $teamId),
            'departmentId' => $departmentId,
            'teamId' => $teamId,
        ]);
    }

    /**
     * Get competency analytics.
     */
    public function analytics(Request $request): Response
    {
        $filters = $request->only(['department_id', 'category']);
        
        return Inertia::render('Hrm/Performance/Competencies/Analytics', [
            'analytics' => fn () => $this->competencyService->getCompetencyAnalytics($filters),
            'filters' => $filters,
        ]);
    }
}
