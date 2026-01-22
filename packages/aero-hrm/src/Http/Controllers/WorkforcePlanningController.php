<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\WorkforcePlan;
use Aero\HRM\Models\WorkforcePlanPosition;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Workforce Planning Controller
 *
 * Manages strategic workforce planning and headcount forecasting.
 */
class WorkforcePlanningController extends Controller
{
    /**
     * Display workforce planning dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('HRM/WorkforcePlanning/Index', [
            'title' => 'Workforce Planning',
        ]);
    }

    /**
     * Get paginated workforce plans.
     */
    public function paginate(Request $request)
    {
        $perPage = $request->input('perPage', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $year = $request->input('year', '');

        $query = WorkforcePlan::query()
            ->with(['department', 'createdBy', 'approvedBy'])
            ->withCount('positions');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($year) {
            $query->where('plan_year', $year);
        }

        return response()->json([
            'items' => $query->orderByDesc('created_at')->paginate($perPage),
        ]);
    }

    /**
     * Get workforce planning statistics.
     */
    public function stats()
    {
        $currentYear = now()->year;

        $totalPlans = WorkforcePlan::where('plan_year', $currentYear)->count();
        $activePlans = WorkforcePlan::where('status', 'active')->where('plan_year', $currentYear)->count();

        $currentHeadcount = Employee::where('employment_status', 'active')->count();

        $plannedHeadcount = WorkforcePlan::where('status', 'active')
            ->where('plan_year', $currentYear)
            ->sum('planned_headcount');

        $totalBudget = WorkforcePlan::where('status', 'active')
            ->where('plan_year', $currentYear)
            ->sum('budget_amount');

        $openPositions = WorkforcePlanPosition::whereHas('workforcePlan', fn ($q) => $q->where('status', 'active'))
            ->where('status', 'open')
            ->sum(\DB::raw('planned_count - current_count'));

        return response()->json([
            'total_plans' => $totalPlans,
            'active_plans' => $activePlans,
            'current_headcount' => $currentHeadcount,
            'planned_headcount' => $plannedHeadcount,
            'headcount_gap' => $plannedHeadcount - $currentHeadcount,
            'total_budget' => $totalBudget,
            'open_positions' => max(0, $openPositions),
        ]);
    }

    /**
     * Create a new workforce plan.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'plan_year' => 'required|integer|min:2020|max:2050',
            'plan_type' => 'required|in:annual,quarterly,strategic',
            'department_id' => 'nullable|exists:departments,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'budget_amount' => 'nullable|numeric|min:0',
            'assumptions' => 'nullable|array',
            'risks' => 'nullable|array',
        ]);

        // Calculate current headcount
        $query = Employee::where('employment_status', 'active');
        if ($validated['department_id']) {
            $query->where('department_id', $validated['department_id']);
        }
        $validated['current_headcount'] = $query->count();
        $validated['planned_headcount'] = $validated['current_headcount'];
        $validated['status'] = 'draft';
        $validated['created_by'] = auth()->id();

        $plan = WorkforcePlan::create($validated);

        return response()->json([
            'message' => 'Workforce plan created successfully',
            'data' => $plan->load('department'),
        ]);
    }

    /**
     * Show a specific workforce plan.
     */
    public function show(int $id)
    {
        $plan = WorkforcePlan::with([
            'department',
            'positions.designation',
            'positions.department',
            'positions.linkedJob',
            'createdBy',
            'approvedBy',
        ])->findOrFail($id);

        return response()->json(['data' => $plan]);
    }

    /**
     * Update a workforce plan.
     */
    public function update(Request $request, int $id)
    {
        $plan = WorkforcePlan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'plan_year' => 'required|integer|min:2020|max:2050',
            'plan_type' => 'required|in:annual,quarterly,strategic',
            'department_id' => 'nullable|exists:departments,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'planned_headcount' => 'nullable|integer|min:0',
            'budget_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:draft,active,approved,completed,cancelled',
            'assumptions' => 'nullable|array',
            'risks' => 'nullable|array',
        ]);

        $plan->update($validated);

        return response()->json([
            'message' => 'Workforce plan updated successfully',
            'data' => $plan->fresh('department'),
        ]);
    }

    /**
     * Delete a workforce plan.
     */
    public function destroy(int $id)
    {
        $plan = WorkforcePlan::findOrFail($id);
        $plan->delete();

        return response()->json(['message' => 'Workforce plan deleted successfully']);
    }

    /**
     * Approve a workforce plan.
     */
    public function approve(int $id)
    {
        $plan = WorkforcePlan::findOrFail($id);

        $plan->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Workforce plan approved successfully',
            'data' => $plan->fresh('approvedBy'),
        ]);
    }

    /**
     * Get positions for a workforce plan.
     */
    public function positions(int $id)
    {
        $positions = WorkforcePlanPosition::where('workforce_plan_id', $id)
            ->with(['designation', 'department', 'linkedJob'])
            ->get();

        return response()->json(['data' => $positions]);
    }

    /**
     * Add a position to a workforce plan.
     */
    public function addPosition(Request $request, int $id)
    {
        $plan = WorkforcePlan::findOrFail($id);

        $validated = $request->validate([
            'designation_id' => 'required|exists:designations,id',
            'department_id' => 'nullable|exists:departments,id',
            'position_type' => 'required|in:new,replacement,expansion,temporary',
            'current_count' => 'required|integer|min:0',
            'planned_count' => 'required|integer|min:0',
            'hiring_priority' => 'required|in:low,medium,high,critical',
            'required_by_date' => 'nullable|date',
            'estimated_salary' => 'nullable|numeric|min:0',
            'skills_required' => 'nullable|array',
            'justification' => 'nullable|string',
        ]);

        $validated['workforce_plan_id'] = $plan->id;
        $validated['status'] = 'open';

        $position = WorkforcePlanPosition::create($validated);

        // Update planned headcount
        $this->recalculatePlannedHeadcount($plan);

        return response()->json([
            'message' => 'Position added successfully',
            'data' => $position->load(['designation', 'department']),
        ]);
    }

    /**
     * Update a position.
     */
    public function updatePosition(Request $request, int $id, int $positionId)
    {
        $position = WorkforcePlanPosition::where('workforce_plan_id', $id)
            ->findOrFail($positionId);

        $validated = $request->validate([
            'designation_id' => 'required|exists:designations,id',
            'department_id' => 'nullable|exists:departments,id',
            'position_type' => 'required|in:new,replacement,expansion,temporary',
            'current_count' => 'required|integer|min:0',
            'planned_count' => 'required|integer|min:0',
            'hiring_priority' => 'required|in:low,medium,high,critical',
            'required_by_date' => 'nullable|date',
            'estimated_salary' => 'nullable|numeric|min:0',
            'skills_required' => 'nullable|array',
            'justification' => 'nullable|string',
            'status' => 'nullable|in:open,in_progress,filled,cancelled',
        ]);

        $position->update($validated);

        // Update planned headcount
        $this->recalculatePlannedHeadcount($position->workforcePlan);

        return response()->json([
            'message' => 'Position updated successfully',
            'data' => $position->fresh(['designation', 'department']),
        ]);
    }

    /**
     * Delete a position.
     */
    public function deletePosition(int $id, int $positionId)
    {
        $position = WorkforcePlanPosition::where('workforce_plan_id', $id)
            ->findOrFail($positionId);

        $plan = $position->workforcePlan;
        $position->delete();

        // Update planned headcount
        $this->recalculatePlannedHeadcount($plan);

        return response()->json(['message' => 'Position deleted successfully']);
    }

    /**
     * Recalculate planned headcount for a plan.
     */
    private function recalculatePlannedHeadcount(WorkforcePlan $plan): void
    {
        $plannedCount = $plan->positions()->sum('planned_count');
        $plan->update(['planned_headcount' => $plannedCount]);
    }

    /**
     * Get headcount forecast.
     */
    public function forecast(Request $request)
    {
        $departmentId = $request->input('department_id');
        $months = $request->input('months', 12);

        $currentHeadcount = Employee::where('employment_status', 'active')
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->count();

        // Get planned hires by month
        $plannedHires = WorkforcePlanPosition::whereHas('workforcePlan', function ($q) use ($departmentId) {
            $q->where('status', 'active');
            if ($departmentId) {
                $q->where('department_id', $departmentId);
            }
        })
            ->whereNotNull('required_by_date')
            ->selectRaw('DATE_FORMAT(required_by_date, "%Y-%m") as month, SUM(planned_count - current_count) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        // Build forecast
        $forecast = [];
        $runningHeadcount = $currentHeadcount;

        for ($i = 0; $i < $months; $i++) {
            $month = now()->addMonths($i)->format('Y-m');
            $hires = $plannedHires[$month]->count ?? 0;
            $runningHeadcount += $hires;

            $forecast[] = [
                'month' => $month,
                'headcount' => $runningHeadcount,
                'planned_hires' => $hires,
            ];
        }

        return response()->json([
            'current_headcount' => $currentHeadcount,
            'forecast' => $forecast,
        ]);
    }
}
