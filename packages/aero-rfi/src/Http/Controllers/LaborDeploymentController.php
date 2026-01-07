<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\LaborDeployment;
use Aero\Rfi\Models\WorkLayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LaborDeploymentController extends Controller
{
    /**
     * Display a listing of labor deployments.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = LaborDeployment::query()
            ->with(['rfi', 'workLayer'])
            ->latest();

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('skill_category', 'like', "%{$search}%")
                    ->orWhere('trade', 'like', "%{$search}%")
                    ->orWhere('contractor_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('skill_category')) {
            $query->where('skill_category', $request->skill_category);
        }

        if ($request->filled('trade')) {
            $query->where('trade', $request->trade);
        }

        // Pagination
        $perPage = $request->get('perPage', 30);
        $deployments = $query->paginate($perPage);

        // If JSON request (for API), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'items' => $deployments->items(),
                'total' => $deployments->total(),
                'currentPage' => $deployments->currentPage(),
                'lastPage' => $deployments->lastPage(),
            ]);
        }

        // Otherwise return Inertia page
        return Inertia::render('RFI/LaborDeployments/Index', [
            'deployments' => $deployments,
            'filters' => $request->only(['search', 'skill_category', 'trade']),
            'stats' => $this->getLaborStats(),
        ]);
    }

    /**
     * Store a newly created labor deployment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'skill_category' => 'required|in:skilled,semi_skilled,unskilled',
            'trade' => 'required|string|max:100',
            'head_count' => 'required|integer|min:1',
            'man_hours' => 'required|numeric|min:0',
            'hours_worked_per_person' => 'nullable|numeric|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'task_assigned' => 'nullable|string',
            'productivity_rate' => 'nullable|numeric|min:0',
            'productivity_unit' => 'nullable|string|max:50',
            'contractor_name' => 'nullable|string|max:255',
            'supervisor_name' => 'nullable|string|max:255',
            'safety_briefing_done' => 'required|boolean',
            'ppe_provided' => 'required|boolean',
            'remarks' => 'nullable|string',
        ]);

        $deployment = LaborDeployment::create($validated);

        return response()->json([
            'message' => 'Labor deployment recorded successfully',
            'data' => $deployment->load(['rfi', 'workLayer']),
        ], 201);
    }

    /**
     * Display the specified labor deployment.
     */
    public function show(LaborDeployment $laborDeployment): JsonResponse
    {
        return response()->json([
            'data' => $laborDeployment->load(['rfi', 'workLayer']),
        ]);
    }

    /**
     * Update the specified labor deployment.
     */
    public function update(Request $request, LaborDeployment $laborDeployment): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'sometimes|required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'skill_category' => 'sometimes|required|in:skilled,semi_skilled,unskilled',
            'trade' => 'sometimes|required|string|max:100',
            'head_count' => 'sometimes|required|integer|min:1',
            'man_hours' => 'sometimes|required|numeric|min:0',
            'hours_worked_per_person' => 'nullable|numeric|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'start_chainage_m' => 'nullable|numeric',
            'end_chainage_m' => 'nullable|numeric',
            'work_location' => 'nullable|string|max:255',
            'task_assigned' => 'nullable|string',
            'productivity_rate' => 'nullable|numeric|min:0',
            'productivity_unit' => 'nullable|string|max:50',
            'contractor_name' => 'nullable|string|max:255',
            'supervisor_name' => 'nullable|string|max:255',
            'safety_briefing_done' => 'sometimes|required|boolean',
            'ppe_provided' => 'sometimes|required|boolean',
            'remarks' => 'nullable|string',
        ]);

        $laborDeployment->update($validated);

        return response()->json([
            'message' => 'Labor deployment updated successfully',
            'data' => $laborDeployment->fresh(['rfi', 'workLayer']),
        ]);
    }

    /**
     * Remove the specified labor deployment.
     */
    public function destroy(LaborDeployment $laborDeployment): JsonResponse
    {
        $laborDeployment->delete();

        return response()->json([
            'message' => 'Labor deployment deleted successfully',
        ]);
    }

    /**
     * Get labor statistics.
     */
    public function getLaborStats(): array
    {
        $deployments = LaborDeployment::all();

        return [
            'total_deployments' => $deployments->count(),
            'total_workers' => $deployments->sum('head_count'),
            'total_man_hours' => $deployments->sum('man_hours'),
            'total_overtime_hours' => $deployments->sum(fn ($d) => $d->total_overtime_hours),
            'safety_compliant' => $deployments->where('safety_compliant', true)->count(),
            'avg_productivity' => round($deployments->whereNotNull('productivity_rate')->avg('productivity_rate'), 2),
        ];
    }

    /**
     * Get productivity analysis report.
     */
    public function productivityAnalysis(Request $request): JsonResponse
    {
        $analysis = LaborDeployment::query()
            ->whereNotNull('productivity_rate')
            ->select(
                'skill_category',
                'trade',
                DB::raw('SUM(head_count) as total_workers'),
                DB::raw('SUM(man_hours) as total_hours'),
                DB::raw('SUM(productivity_rate) as total_output'),
                DB::raw('AVG(productivity_rate / man_hours) as avg_productivity_per_hour'),
                DB::raw('COUNT(*) as deployments')
            )
            ->groupBy('skill_category', 'trade')
            ->orderBy('total_output', 'desc')
            ->get();

        return response()->json(['data' => $analysis]);
    }

    /**
     * Get man-hours summary by skill category.
     */
    public function manHoursSummary(Request $request): JsonResponse
    {
        $summary = LaborDeployment::query()
            ->select(
                'skill_category',
                DB::raw('SUM(head_count) as total_workers'),
                DB::raw('SUM(man_hours) as total_man_hours'),
                DB::raw('SUM(overtime_hours * head_count) as total_overtime_hours'),
                DB::raw('COUNT(*) as deployments')
            )
            ->groupBy('skill_category')
            ->get();

        return response()->json(['data' => $summary]);
    }

    /**
     * Get skill distribution analysis.
     */
    public function skillDistribution(): JsonResponse
    {
        $distribution = LaborDeployment::query()
            ->select(
                'skill_category',
                'trade',
                DB::raw('COUNT(DISTINCT contractor_name) as contractors'),
                DB::raw('SUM(head_count) as workers'),
                DB::raw('SUM(man_hours) as hours')
            )
            ->groupBy('skill_category', 'trade')
            ->orderBy('skill_category')
            ->orderBy('workers', 'desc')
            ->get()
            ->groupBy('skill_category');

        return response()->json(['data' => $distribution]);
    }

    /**
     * Get safety compliance report.
     */
    public function safetyReport(): JsonResponse
    {
        $report = [
            'total_deployments' => LaborDeployment::count(),
            'safety_briefing_done' => LaborDeployment::where('safety_briefing_done', true)->count(),
            'ppe_provided' => LaborDeployment::where('ppe_provided', true)->count(),
            'fully_compliant' => LaborDeployment::where('safety_briefing_done', true)
                ->where('ppe_provided', true)
                ->count(),
            'by_contractor' => LaborDeployment::query()
                ->select(
                    'contractor_name',
                    DB::raw('COUNT(*) as total_deployments'),
                    DB::raw('SUM(CASE WHEN safety_briefing_done = 1 AND ppe_provided = 1 THEN 1 ELSE 0 END) as compliant_deployments'),
                    DB::raw('(SUM(CASE WHEN safety_briefing_done = 1 AND ppe_provided = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100) as compliance_percentage')
                )
                ->whereNotNull('contractor_name')
                ->groupBy('contractor_name')
                ->orderBy('compliance_percentage', 'desc')
                ->get(),
        ];

        return response()->json(['data' => $report]);
    }
}
