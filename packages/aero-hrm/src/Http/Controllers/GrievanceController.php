<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Grievance;
use Aero\HRM\Models\GrievanceCategory;
use Aero\HRM\Models\GrievanceNote;
use Aero\HRM\Http\Requests\StoreGrievanceRequest;
use Aero\HRM\Http\Requests\UpdateGrievanceRequest;
use Aero\HRM\Services\GrievanceResolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class GrievanceController extends Controller
{
    public function __construct(private GrievanceResolutionService $grievanceService) {}
    /**
     * Display grievance management page.
     */
    public function index(Request $request): Response
    {
        $stats = $this->getStats();
        $categories = GrievanceCategory::active()->get();

        return Inertia::render('HRM/Grievances/Index', [
            'title' => 'Employee Grievances',
            'stats' => $stats,
            'categories' => $categories,
            'departments' => Department::select('id', 'name')->get(),
        ]);
    }

    /**
     * Get paginated grievances.
     */
    public function paginate(Request $request): JsonResponse
    {
        $query = Grievance::query()
            ->with(['employee', 'category', 'assignedTo', 'againstEmployee', 'againstDepartment']);

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('grievance_number', 'like', "%{$search}%")
                    ->orWhereHas('employee', fn ($e) => $e->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $perPage = $request->input('perPage', 15);
        $grievances = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'grievances' => $grievances->items(),
            'pagination' => [
                'currentPage' => $grievances->currentPage(),
                'lastPage' => $grievances->lastPage(),
                'perPage' => $grievances->perPage(),
                'total' => $grievances->total(),
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
            'total' => Grievance::count(),
            'open' => Grievance::open()->count(),
            'critical' => Grievance::where('severity', 'critical')->open()->count(),
            'high_severity' => Grievance::highSeverity()->open()->count(),
            'resolved_this_month' => Grievance::where('status', 'resolved')
                ->where('resolution_date', '>=', now()->startOfMonth())->count(),
            'avg_resolution_days' => round(Grievance::where('status', 'resolved')
                ->whereNotNull('resolution_date')
                ->selectRaw('AVG(DATEDIFF(resolution_date, created_at)) as avg_days')
                ->value('avg_days') ?? 0, 1),
        ];
    }

    /**
     * Store a new grievance.
     */
    public function store(StoreGrievanceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $grievance = $this->grievanceService->fileGrievance($validated);

        return response()->json([
            'message' => 'Grievance submitted successfully',
            'grievance' => $grievance->load(['employee', 'category']),
        ]);
    }

    /**
     * Show grievance details.
     */
    public function show(int $id): Response
    {
        $grievance = Grievance::with([
            'employee.department',
            'category',
            'assignedTo',
            'resolvedBy',
            'againstEmployee',
            'againstDepartment',
            'notes.user',
        ])->findOrFail($id);

        return Inertia::render('HRM/Grievances/Show', [
            'title' => "Grievance #{$grievance->grievance_number}",
            'grievance' => $grievance,
        ]);
    }

    /**
     * Update grievance.
     */
    public function update(UpdateGrievanceRequest $request, int $id): JsonResponse
    {
        $grievance = Grievance::findOrFail($id);

        $validated = $request->validated();

        $grievance->update($validated);

        return response()->json([
            'message' => 'Grievance updated successfully',
            'grievance' => $grievance->fresh(['employee', 'category']),
        ]);
    }

    /**
     * Assign grievance to HR personnel.
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        $grievance = Grievance::findOrFail($id);

        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $grievance = $this->grievanceService->assignInvestigator(
            $grievance,
            $validated['assigned_to'],
            'Grievance assigned for review'
        );

        return response()->json([
            'message' => 'Grievance assigned successfully',
            'grievance' => $grievance->load(['assignedTo']),
        ]);
    }

    /**
     * Start investigation.
     */
    public function startInvestigation(Request $request, int $id): JsonResponse
    {
        $grievance = Grievance::findOrFail($id);

        $grievance = $this->grievanceService->assignInvestigator(
            $grievance,
            $grievance->assigned_to ?? auth()->id(),
            'Investigation started'
        );

        return response()->json([
            'message' => 'Investigation started',
            'grievance' => $grievance,
        ]);
    }

    /**
     * Resolve grievance.
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $grievance = Grievance::findOrFail($id);

        $validated = $request->validate([
            'resolution' => 'required|string',
        ]);

        $grievance = $this->grievanceService->resolve(
            $grievance,
            $validated['resolution'],
            auth()->id()
        );

        return response()->json([
            'message' => 'Grievance resolved',
            'grievance' => $grievance->load(['resolvedBy']),
        ]);
    }

    /**
     * Close grievance.
     */
    public function close(Request $request, int $id): JsonResponse
    {
        $grievance = Grievance::findOrFail($id);

        $validated = $request->validate([
            'employee_satisfaction' => 'nullable|integer|min:1|max:5',
        ]);

        $grievance->update([
            'status' => 'closed',
            'employee_satisfaction' => $validated['employee_satisfaction'] ?? null,
        ]);

        return response()->json([
            'message' => 'Grievance closed',
            'grievance' => $grievance->fresh(),
        ]);
    }

    /**
     * Add note to grievance.
     */
    public function addNote(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'note_type' => 'required|in:update,investigation,resolution,escalation,communication',
            'is_internal' => 'boolean',
        ]);

        $validated['grievance_id'] = $id;
        $validated['user_id'] = auth()->id();

        $note = GrievanceNote::create($validated);

        return response()->json([
            'message' => 'Note added successfully',
            'note' => $note->load('user'),
        ]);
    }

    /**
     * Get grievance categories.
     */
    public function categories(): JsonResponse
    {
        $categories = GrievanceCategory::active()->get();

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Store grievance category.
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:grievance_categories,code',
            'description' => 'nullable|string',
            'requires_investigation' => 'boolean',
            'default_priority' => 'required|in:low,medium,high,critical',
            'escalation_days' => 'required|integer|min:1|max:90',
        ]);

        $category = GrievanceCategory::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category,
        ]);
    }

    /**
     * Delete grievance.
     */
    public function destroy(int $id): JsonResponse
    {
        $grievance = Grievance::findOrFail($id);
        $grievance->delete();

        return response()->json([
            'message' => 'Grievance deleted successfully',
        ]);
    }
}
