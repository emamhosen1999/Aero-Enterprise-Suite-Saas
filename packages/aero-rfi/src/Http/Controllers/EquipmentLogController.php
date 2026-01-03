<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\EquipmentLog;
use Aero\Rfi\Models\WorkLayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentLogController extends Controller
{
    /**
     * Display a listing of equipment logs.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = EquipmentLog::query()
            ->with(['dailyWork', 'workLayer'])
            ->orderBy('log_date', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('equipment_name', 'like', "%{$search}%")
                    ->orWhere('equipment_id', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('equipment_type')) {
            $query->where('equipment_type', $request->equipment_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->where('log_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('log_date', '<=', $request->date_to);
        }

        // Pagination
        $perPage = $request->get('perPage', 30);
        $logs = $query->paginate($perPage);

        // If JSON request (for API), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'items' => $logs->items(),
                'total' => $logs->total(),
                'currentPage' => $logs->currentPage(),
                'lastPage' => $logs->lastPage(),
            ]);
        }

        // Otherwise return Inertia page
        return Inertia::render('RFI/EquipmentLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'equipment_type', 'status', 'date_from', 'date_to']),
            'stats' => $this->getEquipmentStats(),
        ]);
    }

    /**
     * Store a newly created equipment log.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'equipment_name' => 'required|string|max:255',
            'equipment_id' => 'nullable|string|max:100',
            'equipment_type' => 'required|string|max:100',
            'operator_name' => 'nullable|string|max:255',
            'working_hours' => 'required|numeric|min:0',
            'idle_hours' => 'nullable|numeric|min:0',
            'breakdown_hours' => 'nullable|numeric|min:0',
            'fuel_consumed_liters' => 'nullable|numeric|min:0',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'odometer_start' => 'nullable|numeric',
            'odometer_end' => 'nullable|numeric',
            'status' => 'required|in:operational,maintenance,breakdown,idle',
            'maintenance_due_date' => 'nullable|date',
            'breakdown_details' => 'nullable|string',
            'log_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        $log = EquipmentLog::create($validated);

        return response()->json([
            'message' => 'Equipment log created successfully',
            'data' => $log->load(['dailyWork', 'workLayer']),
        ], 201);
    }

    /**
     * Display the specified equipment log.
     */
    public function show(EquipmentLog $equipmentLog): JsonResponse
    {
        return response()->json([
            'data' => $equipmentLog->load(['dailyWork', 'workLayer']),
        ]);
    }

    /**
     * Update the specified equipment log.
     */
    public function update(Request $request, EquipmentLog $equipmentLog): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'sometimes|required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'equipment_name' => 'sometimes|required|string|max:255',
            'equipment_id' => 'nullable|string|max:100',
            'equipment_type' => 'sometimes|required|string|max:100',
            'operator_name' => 'nullable|string|max:255',
            'working_hours' => 'sometimes|required|numeric|min:0',
            'idle_hours' => 'nullable|numeric|min:0',
            'breakdown_hours' => 'nullable|numeric|min:0',
            'fuel_consumed_liters' => 'nullable|numeric|min:0',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'odometer_start' => 'nullable|numeric',
            'odometer_end' => 'nullable|numeric',
            'status' => 'sometimes|required|in:operational,maintenance,breakdown,idle',
            'maintenance_due_date' => 'nullable|date',
            'breakdown_details' => 'nullable|string',
            'log_date' => 'sometimes|required|date',
            'remarks' => 'nullable|string',
        ]);

        $equipmentLog->update($validated);

        return response()->json([
            'message' => 'Equipment log updated successfully',
            'data' => $equipmentLog->fresh(['dailyWork', 'workLayer']),
        ]);
    }

    /**
     * Remove the specified equipment log.
     */
    public function destroy(EquipmentLog $equipmentLog): JsonResponse
    {
        $equipmentLog->delete();

        return response()->json([
            'message' => 'Equipment log deleted successfully',
        ]);
    }

    /**
     * Get equipment statistics.
     */
    public function getEquipmentStats(): array
    {
        $logs = EquipmentLog::all();

        return [
            'total_logs' => $logs->count(),
            'total_working_hours' => $logs->sum('working_hours'),
            'total_idle_hours' => $logs->sum('idle_hours'),
            'total_breakdown_hours' => $logs->sum('breakdown_hours'),
            'total_fuel_consumed' => $logs->sum('fuel_consumed_liters'),
            'avg_utilization' => $logs->where('working_hours', '>', 0)->avg('utilization_percentage') ?? 0,
        ];
    }

    /**
     * Get equipment utilization report.
     */
    public function utilizationReport(Request $request): JsonResponse
    {
        $report = EquipmentLog::query()
            ->select(
                'equipment_name',
                'equipment_type',
                DB::raw('SUM(working_hours) as total_working_hours'),
                DB::raw('SUM(idle_hours) as total_idle_hours'),
                DB::raw('SUM(breakdown_hours) as total_breakdown_hours'),
                DB::raw('SUM(working_hours + idle_hours + breakdown_hours) as total_hours'),
                DB::raw('(SUM(working_hours) / SUM(working_hours + idle_hours + breakdown_hours) * 100) as utilization_percentage'),
                DB::raw('COUNT(*) as log_count')
            )
            ->groupBy('equipment_name', 'equipment_type')
            ->orderBy('utilization_percentage', 'desc')
            ->get();

        return response()->json(['data' => $report]);
    }

    /**
     * Get fuel consumption analysis.
     */
    public function fuelAnalysis(Request $request): JsonResponse
    {
        $analysis = EquipmentLog::query()
            ->whereNotNull('fuel_consumed_liters')
            ->where('fuel_consumed_liters', '>', 0)
            ->select(
                'equipment_name',
                'equipment_type',
                DB::raw('SUM(fuel_consumed_liters) as total_fuel'),
                DB::raw('SUM(working_hours) as total_hours'),
                DB::raw('SUM(fuel_consumed_liters) / SUM(working_hours) as fuel_per_hour'),
                DB::raw('COUNT(*) as operations')
            )
            ->groupBy('equipment_name', 'equipment_type')
            ->orderBy('total_fuel', 'desc')
            ->get();

        return response()->json(['data' => $analysis]);
    }

    /**
     * Get equipment maintenance alerts.
     */
    public function maintenanceAlerts(): JsonResponse
    {
        $alerts = EquipmentLog::query()
            ->whereNotNull('maintenance_due_date')
            ->where('maintenance_due_date', '<=', now()->addDays(30))
            ->where('status', '!=', 'maintenance')
            ->select('equipment_name', 'equipment_id', 'maintenance_due_date', 'status')
            ->distinct()
            ->orderBy('maintenance_due_date')
            ->get();

        return response()->json(['data' => $alerts]);
    }

    /**
     * Get breakdown analysis report.
     */
    public function breakdownReport(): JsonResponse
    {
        $report = EquipmentLog::query()
            ->where('status', 'breakdown')
            ->orWhere('breakdown_hours', '>', 0)
            ->select(
                'equipment_name',
                'equipment_type',
                DB::raw('SUM(breakdown_hours) as total_breakdown_hours'),
                DB::raw('COUNT(*) as breakdown_count'),
                DB::raw('MAX(log_date) as last_breakdown_date')
            )
            ->groupBy('equipment_name', 'equipment_type')
            ->orderBy('total_breakdown_hours', 'desc')
            ->get();

        return response()->json(['data' => $report]);
    }
}
