<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Http\Requests\StoreSuccessionPlanRequest;
use Aero\HRM\Http\Requests\UpdateSuccessionPlanRequest;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\SuccessionCandidate;
use Aero\HRM\Models\SuccessionPlan;
use Aero\HRM\Services\SuccessionReadinessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SuccessionPlanningController extends Controller
{
    public function __construct(private SuccessionReadinessService $successionService) {}

    /**
     * Display succession planning dashboard.
     */
    public function index(Request $request): Response
    {
        $stats = $this->getStats();

        return Inertia::render('HRM/SuccessionPlanning/Index', [
            'title' => 'Succession Planning',
            'stats' => $stats,
            'designations' => Designation::select('id', 'title as name')->get(),
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    /**
     * Get paginated succession plans.
     */
    public function paginate(Request $request): JsonResponse
    {
        $query = SuccessionPlan::query()
            ->with(['designation', 'department', 'currentHolder', 'candidates.employee']);

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('designation', fn ($d) => $d->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('department', fn ($d) => $d->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $perPage = $request->input('perPage', 15);
        $plans = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'plans' => $plans->items(),
            'pagination' => [
                'currentPage' => $plans->currentPage(),
                'lastPage' => $plans->lastPage(),
                'perPage' => $plans->perPage(),
                'total' => $plans->total(),
            ],
        ]);
    }

    /**
     * Get statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->getStats());
    }

    private function getStats(): array
    {
        return [
            'total' => SuccessionPlan::count(),
            'active' => SuccessionPlan::where('status', 'active')->count(),
            'critical_positions' => SuccessionPlan::where('priority', 'critical')->count(),
            'high_risk' => SuccessionPlan::where('risk_level', 'high')->count(),
            'ready_now_candidates' => SuccessionCandidate::where('readiness_level', 'ready_now')->count(),
            'no_successor' => SuccessionPlan::whereDoesntHave('candidates')->count(),
        ];
    }

    /**
     * Store a new succession plan.
     */
    public function store(StoreSuccessionPlanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $validated['created_by'] = auth()->id();

        $plan = SuccessionPlan::create($validated);

        return response()->json([
            'message' => 'Succession plan created successfully',
            'plan' => $plan->load(['designation', 'department', 'currentHolder']),
        ]);
    }

    /**
     * Show succession plan details.
     */
    public function show(int $id): Response
    {
        $plan = SuccessionPlan::with([
            'designation',
            'department',
            'currentHolder',
            'candidates.employee.department',
            'candidates.employee.designation',
            'candidates.mentor',
        ])->findOrFail($id);

        return Inertia::render('HRM/SuccessionPlanning/Show', [
            'title' => $plan->title,
            'plan' => $plan,
        ]);
    }

    /**
     * Update succession plan.
     */
    public function update(UpdateSuccessionPlanRequest $request, int $id): JsonResponse
    {
        $plan = SuccessionPlan::findOrFail($id);

        $validated = $request->validated();

        $plan->update($validated);

        return response()->json([
            'message' => 'Succession plan updated successfully',
            'plan' => $plan->fresh(['designation', 'department', 'currentHolder', 'candidates']),
        ]);
    }

    /**
     * Delete succession plan.
     */
    public function destroy(int $id): JsonResponse
    {
        $plan = SuccessionPlan::findOrFail($id);
        $plan->delete();

        return response()->json([
            'message' => 'Succession plan deleted successfully',
        ]);
    }

    /**
     * Add candidate to succession plan.
     */
    public function addCandidate(Request $request, int $planId): JsonResponse
    {
        $plan = SuccessionPlan::findOrFail($planId);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'readiness_level' => 'required|in:ready_now,ready_1_year,ready_2_years,ready_3_plus,not_ready',
            'development_priority' => 'required|in:high,medium,low',
            'strengths' => 'nullable|array',
            'development_areas' => 'nullable|array',
            'development_plan' => 'nullable|array',
            'mentor_id' => 'nullable|exists:employees,id',
            'assessment_notes' => 'nullable|string',
        ]);

        $validated['succession_plan_id'] = $planId;
        $validated['nominated_by'] = auth()->id();
        $validated['assessment_date'] = now();

        $candidate = SuccessionCandidate::create($validated);

        return response()->json([
            'message' => 'Candidate added successfully',
            'candidate' => $candidate->load(['employee.department', 'employee.designation', 'mentor']),
        ]);
    }

    /**
     * Update candidate.
     */
    public function updateCandidate(Request $request, int $planId, int $candidateId): JsonResponse
    {
        $candidate = SuccessionCandidate::where('succession_plan_id', $planId)
            ->findOrFail($candidateId);

        $validated = $request->validate([
            'readiness_level' => 'required|in:ready_now,ready_1_year,ready_2_years,ready_3_plus,not_ready',
            'development_priority' => 'required|in:high,medium,low',
            'strengths' => 'nullable|array',
            'development_areas' => 'nullable|array',
            'development_plan' => 'nullable|array',
            'mentor_id' => 'nullable|exists:employees,id',
            'assessment_score' => 'nullable|numeric|min:0|max:100',
            'assessment_notes' => 'nullable|string',
            'status' => 'nullable|in:active,in_development,on_hold,promoted,removed',
        ]);

        $validated['assessment_date'] = now();
        $candidate->update($validated);

        return response()->json([
            'message' => 'Candidate updated successfully',
            'candidate' => $candidate->fresh(['employee.department', 'employee.designation', 'mentor']),
        ]);
    }

    /**
     * Remove candidate from succession plan.
     */
    public function removeCandidate(int $planId, int $candidateId): JsonResponse
    {
        $candidate = SuccessionCandidate::where('succession_plan_id', $planId)
            ->findOrFail($candidateId);

        $candidate->delete();

        return response()->json([
            'message' => 'Candidate removed successfully',
        ]);
    }

    /**
     * Get potential candidates for a position.
     */
    public function getPotentialCandidates(Request $request, int $planId): JsonResponse
    {
        $plan = SuccessionPlan::findOrFail($planId);
        $existingIds = $plan->candidates()->pluck('employee_id');

        $query = Employee::where('employment_status', 'active')
            ->whereNotIn('id', $existingIds)
            ->with(['department', 'designation']);

        // Filter by same department if specified
        if ($request->boolean('same_department') && $plan->department_id) {
            $query->where('department_id', $plan->department_id);
        }

        $candidates = $query->limit(50)->get();

        return response()->json([
            'candidates' => $candidates,
        ]);
    }

    /**
     * Get succession pipeline report.
     */
    public function pipelineReport(): JsonResponse
    {
        $plans = SuccessionPlan::with(['candidates.employee', 'designation', 'department'])
            ->where('status', 'active')
            ->get();

        $pipeline = [
            'critical' => $plans->where('priority', 'critical')->values(),
            'high' => $plans->where('priority', 'high')->values(),
            'medium' => $plans->where('priority', 'medium')->values(),
            'low' => $plans->where('priority', 'low')->values(),
        ];

        $readinessDistribution = [
            'ready_now' => SuccessionCandidate::where('readiness_level', 'ready_now')->count(),
            'ready_1_year' => SuccessionCandidate::where('readiness_level', 'ready_1_year')->count(),
            'ready_2_years' => SuccessionCandidate::where('readiness_level', 'ready_2_years')->count(),
            'ready_3_plus' => SuccessionCandidate::where('readiness_level', 'ready_3_plus')->count(),
            'not_ready' => SuccessionCandidate::where('readiness_level', 'not_ready')->count(),
        ];

        return response()->json([
            'pipeline' => $pipeline,
            'readinessDistribution' => $readinessDistribution,
            'atRiskPositions' => $plans->filter(fn ($p) => $p->candidates->isEmpty())->values(),
        ]);
    }
}
