<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\Core\Http\Controllers\Controller;
use Aero\HRM\Services\Performance\GoalSettingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoalController extends Controller
{
    public function __construct(
        protected GoalSettingService $goalService
    ) {}

    /**
     * Display goals dashboard.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'type', 'period', 'search']);
        $userId = $request->user()->id;
        
        return Inertia::render('Hrm/Performance/Goals/Index', [
            'goals' => fn () => $this->goalService->getGoalsForUser($userId, $filters),
            'filters' => $filters,
            'goalTypes' => GoalSettingService::TYPES,
            'statuses' => GoalSettingService::STATUSES,
        ]);
    }

    /**
     * Show create goal form.
     */
    public function create(): Response
    {
        return Inertia::render('Hrm/Performance/Goals/Create', [
            'goalTypes' => GoalSettingService::TYPES,
            'measurementTypes' => GoalSettingService::MEASUREMENT_TYPES,
        ]);
    }

    /**
     * Store new goal.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:' . implode(',', GoalSettingService::TYPES),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'priority' => 'nullable|string',
            'key_results' => 'nullable|array',
            'key_results.*.title' => 'required|string',
            'key_results.*.target_value' => 'required|numeric',
            'key_results.*.measurement_type' => 'required|string',
        ]);
        
        $validated['owner_id'] = $request->user()->id;
        $validated['created_by'] = $request->user()->id;
        
        $result = $this->goalService->createGoal($validated);
        
        if ($result['success']) {
            return redirect()->route('hrm.performance.goals.show', $result['goal']['id'])
                ->with('success', 'Goal created successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to create goal');
    }

    /**
     * Show goal details.
     */
    public function show(string $goalId): Response
    {
        $goal = $this->goalService->getGoal($goalId);
        
        return Inertia::render('Hrm/Performance/Goals/Show', [
            'goal' => $goal,
            'checkIns' => fn () => $this->goalService->getCheckIns($goalId),
        ]);
    }

    /**
     * Update goal.
     */
    public function update(Request $request, string $goalId)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|string',
            'progress' => 'sometimes|numeric|min:0|max:100',
        ]);
        
        $result = $this->goalService->updateGoal($goalId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Goal updated successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to update goal');
    }

    /**
     * Delete goal.
     */
    public function destroy(string $goalId)
    {
        $result = $this->goalService->deleteGoal($goalId);
        
        if ($result['success']) {
            return redirect()->route('hrm.performance.goals.index')
                ->with('success', 'Goal deleted successfully');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to delete goal');
    }

    /**
     * Add check-in for a goal.
     */
    public function checkIn(Request $request, string $goalId)
    {
        $validated = $request->validate([
            'note' => 'required|string',
            'progress_update' => 'nullable|numeric|min:0|max:100',
            'key_result_updates' => 'nullable|array',
        ]);
        
        $validated['user_id'] = $request->user()->id;
        
        $result = $this->goalService->addCheckIn($goalId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Check-in recorded');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to record check-in');
    }

    /**
     * Update key result progress.
     */
    public function updateKeyResult(Request $request, string $goalId, string $keyResultId)
    {
        $validated = $request->validate([
            'current_value' => 'required|numeric',
            'note' => 'nullable|string',
        ]);
        
        $result = $this->goalService->updateKeyResult($goalId, $keyResultId, $validated);
        
        if ($result['success']) {
            return back()->with('success', 'Key result updated');
        }
        
        return back()->with('error', $result['error'] ?? 'Failed to update key result');
    }

    /**
     * Get team goals for managers.
     */
    public function teamGoals(Request $request): Response
    {
        $teamId = $request->get('team_id');
        $filters = $request->only(['status', 'period']);
        
        return Inertia::render('Hrm/Performance/Goals/Team', [
            'goals' => fn () => $this->goalService->getTeamGoals($teamId, $filters),
            'filters' => $filters,
        ]);
    }

    /**
     * Get goal analytics.
     */
    public function analytics(Request $request): Response
    {
        $userId = $request->user()->id;
        
        return Inertia::render('Hrm/Performance/Goals/Analytics', [
            'analytics' => fn () => $this->goalService->getGoalAnalytics($userId),
        ]);
    }
}
