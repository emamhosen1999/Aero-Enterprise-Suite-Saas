<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Http\Requests\StorePipPlanRequest;
use Aero\HRM\Http\Requests\UpdatePipPlanRequest;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\PipGoal;
use Aero\HRM\Models\PipPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceImprovementPlanController extends Controller
{
    /**
     * Display the PIP management page.
     */
    public function index(Request $request): Response
    {
        $query = PipPlan::query()
            ->with(['employee.user', 'manager', 'goals'])
            ->when($request->search, function ($q, $search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('employee.user', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            })
            ->when($request->status, function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->employee_id, function ($q, $employeeId) {
                $q->where('employee_id', $employeeId);
            })
            ->orderBy('created_at', 'desc');

        $pips = $query->paginate($request->input('per_page', 15))->withQueryString();

        $total = PipPlan::query()->count();
        $active = PipPlan::query()->where('status', 'active')->count();
        $completed = PipPlan::query()->where('status', 'completed')->count();
        $overdue = PipPlan::query()
            ->where('status', 'active')
            ->where('end_date', '<', now())
            ->count();

        $employees = Employee::query()
            ->with('user:id,name')
            ->where('status', 'active')
            ->get()
            ->map(fn (Employee $emp) => [
                'id' => $emp->id,
                'name' => $emp->user?->name ?? 'Employee #'.$emp->id,
                'employee_code' => $emp->employee_code,
            ]);

        return Inertia::render('HRM/Performance/ImprovementPlan', [
            'pips' => $pips,
            'stats' => [
                'total' => $total,
                'active' => $active,
                'completed' => $completed,
                'overdue' => $overdue,
            ],
            'employees' => $employees,
            'filters' => $request->only(['search', 'status', 'employee_id', 'per_page']),
        ]);
    }

    /**
     * Store a new PIP plan with optional goals.
     */
    public function store(StorePipPlanRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $goals = $validated['goals'] ?? [];
        unset($validated['goals']);

        $validated['created_by'] = $request->user()->id;
        $validated['status'] = $validated['status'] ?? 'draft';

        $pipPlan = PipPlan::query()->create($validated);

        foreach ($goals as $goal) {
            $pipPlan->goals()->create([
                'title' => $goal['title'],
                'description' => $goal['description'] ?? null,
                'target_date' => $goal['target_date'],
                'status' => 'pending',
            ]);
        }

        $pipPlan->load(['employee.user', 'manager', 'goals']);

        return response()->json([
            'data' => $pipPlan,
            'message' => 'Performance Improvement Plan created successfully.',
        ]);
    }

    /**
     * Return a single PIP plan with goals for modal/detail view.
     */
    public function show(PipPlan $pipPlan): JsonResponse
    {
        $pipPlan->load(['employee.user', 'manager', 'goals', 'createdBy']);

        return response()->json([
            'data' => $pipPlan,
        ]);
    }

    /**
     * Update an existing PIP plan.
     */
    public function update(UpdatePipPlanRequest $request, PipPlan $pipPlan): JsonResponse
    {
        $validated = $request->validated();
        unset($validated['goals']);

        $pipPlan->update($validated);
        $pipPlan->load(['employee.user', 'manager', 'goals']);

        return response()->json([
            'data' => $pipPlan,
            'message' => 'Performance Improvement Plan updated successfully.',
        ]);
    }

    /**
     * Change the status of a PIP plan.
     * Sets closed_at when status transitions to completed or terminated.
     */
    public function updateStatus(Request $request, PipPlan $pipPlan): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:draft,active,completed,extended,terminated'],
        ]);

        $closedStatuses = ['completed', 'terminated'];
        $closedAt = in_array($validated['status'], $closedStatuses) ? now() : null;

        $pipPlan->update([
            'status' => $validated['status'],
            'closed_at' => $closedAt,
        ]);

        return response()->json([
            'data' => $pipPlan->fresh(),
            'message' => 'Status updated to '.$validated['status'].'.',
        ]);
    }

    /**
     * Soft delete a PIP plan.
     */
    public function destroy(PipPlan $pipPlan): JsonResponse
    {
        $pipPlan->delete();

        return response()->json([
            'message' => 'Performance Improvement Plan deleted successfully.',
        ]);
    }

    /**
     * Return the goals list for a given PIP plan.
     */
    public function goals(PipPlan $pipPlan): JsonResponse
    {
        return response()->json([
            'data' => $pipPlan->goals()->orderBy('target_date')->get(),
        ]);
    }

    /**
     * Add a new goal to a PIP plan.
     */
    public function storeGoal(Request $request, PipPlan $pipPlan): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_date' => ['required', 'date'],
            'status' => ['nullable', 'string', 'in:pending,in_progress,achieved,missed'],
            'progress_notes' => ['nullable', 'string'],
        ]);

        $validated['status'] = $validated['status'] ?? 'pending';

        $goal = $pipPlan->goals()->create($validated);

        return response()->json([
            'data' => $goal,
            'message' => 'Goal added successfully.',
        ]);
    }

    /**
     * Update a goal's status or progress notes.
     */
    public function updateGoal(Request $request, PipPlan $pipPlan, PipGoal $goal): JsonResponse
    {
        abort_if($goal->pip_plan_id !== $pipPlan->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'target_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'string', 'in:pending,in_progress,achieved,missed'],
            'progress_notes' => ['nullable', 'string'],
        ]);

        $goal->update($validated);

        return response()->json([
            'data' => $goal->fresh(),
            'message' => 'Goal updated successfully.',
        ]);
    }
}
