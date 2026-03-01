<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\SiteInstruction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SiteInstructionController extends Controller
{
    /**
     * Display a listing of site instructions.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = SiteInstruction::query()
            ->with(['rfi', 'workLayer'])
            ->orderBy('issued_date', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('instruction_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('issued_by', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Pagination
        $perPage = $request->get('perPage', 30);
        $instructions = $query->paginate($perPage);

        // If JSON request (for API), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'items' => $instructions->items(),
                'total' => $instructions->total(),
                'currentPage' => $instructions->currentPage(),
                'lastPage' => $instructions->lastPage(),
            ]);
        }

        // Otherwise return Inertia page
        return Inertia::render('RFI/SiteInstructions/Index', [
            'instructions' => $instructions,
            'filters' => $request->only(['search', 'status', 'priority', 'category']),
            'stats' => $this->getInstructionStats(),
        ]);
    }

    /**
     * Store a newly created site instruction.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'instruction_number' => 'required|string|max:100|unique:site_instructions',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'issued_by' => 'required|string|max:255',
            'issued_date' => 'required|date',
            'target_completion_date' => 'nullable|date|after_or_equal:issued_date',
            'priority' => 'required|in:urgent,high,medium,low',
            'category' => 'required|in:safety,quality,schedule,design_change,material,equipment,other',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'cost_impact' => 'nullable|numeric|min:0',
            'time_impact_days' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string',
        ]);

        $instruction = SiteInstruction::create([
            ...$validated,
            'status' => 'issued',
        ]);

        return response()->json([
            'message' => 'Site instruction created successfully',
            'data' => $instruction->load(['rfi', 'workLayer']),
        ], 201);
    }

    /**
     * Display the specified site instruction.
     */
    public function show(SiteInstruction $siteInstruction): JsonResponse
    {
        return response()->json([
            'data' => $siteInstruction->load(['rfi', 'workLayer']),
        ]);
    }

    /**
     * Update the specified site instruction.
     */
    public function update(Request $request, SiteInstruction $siteInstruction): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'issued_by' => 'sometimes|required|string|max:255',
            'target_completion_date' => 'nullable|date',
            'priority' => 'sometimes|required|in:urgent,high,medium,low',
            'category' => 'sometimes|required|in:safety,quality,schedule,design_change,material,equipment,other',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'cost_impact' => 'nullable|numeric|min:0',
            'time_impact_days' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string',
        ]);

        $siteInstruction->update($validated);

        return response()->json([
            'message' => 'Site instruction updated successfully',
            'data' => $siteInstruction->fresh(['rfi', 'workLayer']),
        ]);
    }

    /**
     * Remove the specified site instruction.
     */
    public function destroy(SiteInstruction $siteInstruction): JsonResponse
    {
        $siteInstruction->delete();

        return response()->json([
            'message' => 'Site instruction deleted successfully',
        ]);
    }

    /**
     * Update instruction status.
     */
    public function updateStatus(Request $request, SiteInstruction $siteInstruction): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:issued,acknowledged,in_progress,completed,cancelled',
            'remarks' => 'nullable|string',
        ]);

        $updateData = ['status' => $validated['status']];

        // Auto-set completion date when completed
        if ($validated['status'] === 'completed' && ! $siteInstruction->actual_completion_date) {
            $updateData['actual_completion_date'] = now();
        }

        if (isset($validated['remarks'])) {
            $updateData['remarks'] = $validated['remarks'];
        }

        $siteInstruction->update($updateData);

        return response()->json([
            'message' => 'Instruction status updated successfully',
            'data' => $siteInstruction->fresh(),
        ]);
    }

    /**
     * Add contractor response.
     */
    public function addResponse(Request $request, SiteInstruction $siteInstruction): JsonResponse
    {
        $validated = $request->validate([
            'contractor_response' => 'required|string',
        ]);

        $siteInstruction->update([
            'contractor_response' => $validated['contractor_response'],
            'response_date' => now(),
            'status' => $siteInstruction->status === 'issued' ? 'acknowledged' : $siteInstruction->status,
        ]);

        return response()->json([
            'message' => 'Response submitted successfully',
            'data' => $siteInstruction->fresh(),
        ]);
    }

    /**
     * Get instruction statistics.
     */
    public function getInstructionStats(): array
    {
        return [
            'total_instructions' => SiteInstruction::count(),
            'issued' => SiteInstruction::where('status', 'issued')->count(),
            'in_progress' => SiteInstruction::where('status', 'in_progress')->count(),
            'completed' => SiteInstruction::where('status', 'completed')->count(),
            'overdue' => SiteInstruction::whereNotNull('target_completion_date')
                ->where('target_completion_date', '<', now())
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),
            'response_pending' => SiteInstruction::whereIn('status', ['issued', 'acknowledged'])
                ->whereNull('response_date')
                ->count(),
        ];
    }

    /**
     * Get overdue instructions.
     */
    public function overdueInstructions(): JsonResponse
    {
        $overdue = SiteInstruction::query()
            ->where('status', '!=', 'completed')
            ->where('status', '!=', 'cancelled')
            ->whereNotNull('target_completion_date')
            ->where('target_completion_date', '<', now())
            ->with(['rfi', 'workLayer'])
            ->orderBy('target_completion_date')
            ->get();

        return response()->json(['data' => $overdue]);
    }

    /**
     * Get instructions by chainage range.
     */
    public function byChainage(Request $request): JsonResponse
    {
        $request->validate([
            'start_chainage' => 'required|numeric',
            'end_chainage' => 'required|numeric|gte:start_chainage',
        ]);

        $instructions = SiteInstruction::query()
            ->where(function ($q) use ($request) {
                $q->whereBetween('start_chainage_m', [$request->start_chainage, $request->end_chainage])
                    ->orWhereBetween('end_chainage_m', [$request->start_chainage, $request->end_chainage]);
            })
            ->with(['rfi', 'workLayer'])
            ->orderBy('issued_date', 'desc')
            ->get();

        return response()->json(['data' => $instructions]);
    }

    /**
     * Get impact analysis report.
     */
    public function impactAnalysis(): JsonResponse
    {
        $analysis = [
            'total_cost_impact' => SiteInstruction::sum('cost_impact'),
            'total_time_impact_days' => SiteInstruction::sum('time_impact_days'),
            'by_category' => SiteInstruction::query()
                ->select(
                    'category',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(cost_impact) as total_cost'),
                    DB::raw('SUM(time_impact_days) as total_time_impact')
                )
                ->groupBy('category')
                ->orderBy('total_cost', 'desc')
                ->get(),
            'by_priority' => SiteInstruction::query()
                ->select(
                    'priority',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('AVG(time_impact_days) as avg_time_impact')
                )
                ->groupBy('priority')
                ->get(),
        ];

        return response()->json(['data' => $analysis]);
    }

    /**
     * Get completion performance report.
     */
    public function completionReport(): JsonResponse
    {
        $report = SiteInstruction::query()
            ->where('status', 'completed')
            ->whereNotNull('target_completion_date')
            ->whereNotNull('actual_completion_date')
            ->select(
                'category',
                'priority',
                DB::raw('COUNT(*) as completed_count'),
                DB::raw('SUM(CASE WHEN actual_completion_date <= target_completion_date THEN 1 ELSE 0 END) as on_time_count'),
                DB::raw('AVG(DATEDIFF(actual_completion_date, target_completion_date)) as avg_delay_days')
            )
            ->groupBy('category', 'priority')
            ->get();

        return response()->json(['data' => $report]);
    }
}
