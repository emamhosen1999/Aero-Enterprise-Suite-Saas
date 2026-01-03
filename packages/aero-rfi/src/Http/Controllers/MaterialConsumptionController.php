<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\MaterialConsumption;
use Aero\Rfi\Models\WorkLayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MaterialConsumptionController extends Controller
{
    /**
     * Display a listing of material consumptions.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = MaterialConsumption::query()
            ->with(['dailyWork', 'workLayer'])
            ->orderBy('recorded_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('material_name', 'like', "%{$search}%")
                    ->orWhere('material_code', 'like', "%{$search}%")
                    ->orWhere('supplier_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('material_type')) {
            $query->where('material_type', $request->material_type);
        }

        if ($request->filled('quality_status')) {
            $query->where('quality_status', $request->quality_status);
        }

        if ($request->filled('date_from')) {
            $query->where('recorded_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('recorded_at', '<=', $request->date_to);
        }

        // Pagination
        $perPage = $request->get('perPage', 30);
        $materials = $query->paginate($perPage);

        // If JSON request (for API), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'items' => $materials->items(),
                'total' => $materials->total(),
                'currentPage' => $materials->currentPage(),
                'lastPage' => $materials->lastPage(),
            ]);
        }

        // Otherwise return Inertia page
        return Inertia::render('RFI/MaterialConsumptions/Index', [
            'materials' => $materials,
            'filters' => $request->only(['search', 'material_type', 'quality_status', 'date_from', 'date_to']),
            'stats' => $this->getMaterialStats(),
        ]);
    }

    /**
     * Store a newly created material consumption.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'material_name' => 'required|string|max:255',
            'material_code' => 'nullable|string|max:100',
            'material_type' => 'required|string|max:100',
            'specification' => 'nullable|string',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'unit_cost' => 'nullable|numeric|min:0',
            'supplier_name' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:100',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'quality_status' => 'required|in:pending,passed,failed,conditional',
            'quality_test_report' => 'nullable|string',
            'wastage_quantity' => 'nullable|numeric|min:0',
            'wastage_reason' => 'nullable|string',
            'recorded_at' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        $material = MaterialConsumption::create($validated);

        return response()->json([
            'message' => 'Material consumption recorded successfully',
            'data' => $material->load(['dailyWork', 'workLayer']),
        ], 201);
    }

    /**
     * Display the specified material consumption.
     */
    public function show(MaterialConsumption $materialConsumption): JsonResponse
    {
        return response()->json([
            'data' => $materialConsumption->load(['dailyWork', 'workLayer']),
        ]);
    }

    /**
     * Update the specified material consumption.
     */
    public function update(Request $request, MaterialConsumption $materialConsumption): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'sometimes|required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'material_name' => 'sometimes|required|string|max:255',
            'material_code' => 'nullable|string|max:100',
            'material_type' => 'sometimes|required|string|max:100',
            'specification' => 'nullable|string',
            'quantity' => 'sometimes|required|numeric|min:0',
            'unit' => 'sometimes|required|string|max:50',
            'unit_cost' => 'nullable|numeric|min:0',
            'supplier_name' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:100',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'quality_status' => 'sometimes|required|in:pending,passed,failed,conditional',
            'quality_test_report' => 'nullable|string',
            'wastage_quantity' => 'nullable|numeric|min:0',
            'wastage_reason' => 'nullable|string',
            'recorded_at' => 'sometimes|required|date',
            'remarks' => 'nullable|string',
        ]);

        $materialConsumption->update($validated);

        return response()->json([
            'message' => 'Material consumption updated successfully',
            'data' => $materialConsumption->fresh(['dailyWork', 'workLayer']),
        ]);
    }

    /**
     * Remove the specified material consumption.
     */
    public function destroy(MaterialConsumption $materialConsumption): JsonResponse
    {
        $materialConsumption->delete();

        return response()->json([
            'message' => 'Material consumption deleted successfully',
        ]);
    }

    /**
     * Get material consumption statistics.
     */
    public function getMaterialStats(): array
    {
        return [
            'total_records' => MaterialConsumption::count(),
            'total_cost' => MaterialConsumption::whereNotNull('unit_cost')
                ->get()
                ->sum(fn ($m) => $m->quantity * $m->unit_cost),
            'quality_passed' => MaterialConsumption::where('quality_status', 'passed')->count(),
            'quality_failed' => MaterialConsumption::where('quality_status', 'failed')->count(),
            'total_wastage_cost' => MaterialConsumption::whereNotNull('unit_cost')
                ->whereNotNull('wastage_quantity')
                ->get()
                ->sum(fn ($m) => $m->wastage_quantity * $m->unit_cost),
        ];
    }

    /**
     * Get material consumption summary by material type.
     */
    public function summaryByMaterial(Request $request): JsonResponse
    {
        $summary = MaterialConsumption::query()
            ->select(
                'material_name',
                'material_type',
                'unit',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(wastage_quantity) as total_wastage'),
                DB::raw('COUNT(*) as usage_count'),
                DB::raw('AVG(unit_cost) as avg_unit_cost')
            )
            ->groupBy('material_name', 'material_type', 'unit')
            ->orderBy('total_quantity', 'desc')
            ->get();

        return response()->json(['data' => $summary]);
    }

    /**
     * Get material consumption by chainage range.
     */
    public function summaryByChainage(Request $request): JsonResponse
    {
        $request->validate([
            'start_chainage' => 'required|numeric',
            'end_chainage' => 'required|numeric|gte:start_chainage',
        ]);

        $materials = MaterialConsumption::query()
            ->where(function ($q) use ($request) {
                $q->whereBetween('start_chainage_m', [$request->start_chainage, $request->end_chainage])
                    ->orWhereBetween('end_chainage_m', [$request->start_chainage, $request->end_chainage]);
            })
            ->with(['dailyWork', 'workLayer'])
            ->get();

        return response()->json(['data' => $materials]);
    }

    /**
     * Get wastage analysis report.
     */
    public function wastageReport(): JsonResponse
    {
        $report = MaterialConsumption::query()
            ->whereNotNull('wastage_quantity')
            ->where('wastage_quantity', '>', 0)
            ->select(
                'material_name',
                'material_type',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(wastage_quantity) as total_wastage'),
                DB::raw('(SUM(wastage_quantity) / SUM(quantity) * 100) as wastage_percentage'),
                DB::raw('COUNT(*) as occurrences')
            )
            ->groupBy('material_name', 'material_type')
            ->having('wastage_percentage', '>', 0)
            ->orderBy('wastage_percentage', 'desc')
            ->get();

        return response()->json(['data' => $report]);
    }

    /**
     * Get quality test report summary.
     */
    public function qualityReport(): JsonResponse
    {
        $report = MaterialConsumption::query()
            ->select(
                'material_name',
                'quality_status',
                DB::raw('COUNT(*) as test_count'),
                DB::raw('SUM(quantity) as total_quantity')
            )
            ->groupBy('material_name', 'quality_status')
            ->orderBy('material_name')
            ->get()
            ->groupBy('material_name');

        return response()->json(['data' => $report]);
    }
}
