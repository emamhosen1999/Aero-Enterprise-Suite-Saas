<?php

namespace Aero\Project\Http\Controllers;

use Aero\Project\Models\BoqItem;
use Aero\Project\Models\BoqMeasurement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BoqMeasurementController
 *
 * Handles Bill of Quantities (BOQ) measurements linked to RFI approvals.
 * Part of the patentable "Auto-Quantity Derivation from Chainage" system.
 */
class BoqMeasurementController extends Controller
{
    /**
     * Display a listing of BOQ measurements.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'boq_item_id', 'project_id', 'status',
            'date_from', 'date_to', 'sort_by', 'sort_direction',
        ]);

        $perPage = $request->input('per_page', 30);

        $measurements = BoqMeasurement::query()
            ->with([
                'boqItem:id,code,description,unit,rate',
                'rfi:id,reference_number,work_date,status',
                'rfi.workLocation:id,name',
                'measuredByUser:id,name',
                'verifiedByUser:id,name',
            ])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('boqItem', function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filters['boq_item_id'] ?? null, function ($query, $itemId) {
                $query->where('boq_item_id', $itemId);
            })
            ->when($filters['project_id'] ?? null, function ($query, $projectId) {
                $query->whereHas('boqItem', function ($q) use ($projectId) {
                    $q->where('project_id', $projectId);
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($filters['date_from'] ?? null, function ($query, $date) {
                $query->where('measurement_date', '>=', $date);
            })
            ->when($filters['date_to'] ?? null, function ($query, $date) {
                $query->where('measurement_date', '<=', $date);
            })
            ->orderBy($filters['sort_by'] ?? 'created_at', $filters['sort_direction'] ?? 'desc')
            ->paginate($perPage);

        // Get summary stats
        $stats = $this->getMeasurementStats($filters);

        return Inertia::render('Project/BoqMeasurements/Index', [
            'title' => 'BOQ Measurements',
            'measurements' => $measurements,
            'filters' => $filters,
            'stats' => $stats,
            'statuses' => BoqMeasurement::$statuses,
            'boqItems' => BoqItem::select(['id', 'code', 'description', 'unit'])->get(),
        ]);
    }

    /**
     * Get measurements for a specific BOQ item (API endpoint).
     */
    public function byBoqItem(Request $request, BoqItem $boqItem): JsonResponse
    {
        $measurements = BoqMeasurement::query()
            ->where('boq_item_id', $boqItem->id)
            ->with([
                'rfi:id,reference_number,work_date,status',
                'rfi.workLocation:id,name',
                'measuredByUser:id,name',
            ])
            ->orderBy('measurement_date', 'desc')
            ->get();

        $totalQuantity = $measurements->where('status', 'verified')->sum('quantity');

        return response()->json([
            'measurements' => $measurements,
            'total_quantity' => $totalQuantity,
            'boq_item' => $boqItem,
        ]);
    }

    /**
     * Get measurements for a specific RFI.
     */
    public function byRfi(Request $request, int $rfiId): JsonResponse
    {
        $measurements = BoqMeasurement::query()
            ->where('daily_work_id', $rfiId)
            ->with([
                'boqItem:id,code,description,unit,rate',
                'measuredByUser:id,name',
                'verifiedByUser:id,name',
            ])
            ->get();

        $totalValue = $measurements->sum(function ($m) {
            return $m->quantity * ($m->boqItem->rate ?? 0);
        });

        return response()->json([
            'measurements' => $measurements,
            'total_value' => $totalValue,
        ]);
    }

    /**
     * Verify a measurement.
     */
    public function verify(Request $request, BoqMeasurement $measurement): JsonResponse
    {
        $validated = $request->validate([
            'verified_quantity' => 'nullable|numeric|min:0',
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        $measurement->update([
            'status' => 'verified',
            'verified_by_user_id' => auth()->id(),
            'verified_at' => now(),
            'verified_quantity' => $validated['verified_quantity'] ?? $measurement->quantity,
            'verification_notes' => $validated['verification_notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Measurement verified successfully.',
            'measurement' => $measurement->fresh()->load(['boqItem', 'verifiedByUser']),
        ]);
    }

    /**
     * Reject a measurement.
     */
    public function reject(Request $request, BoqMeasurement $measurement): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $measurement->update([
            'status' => 'rejected',
            'verified_by_user_id' => auth()->id(),
            'verified_at' => now(),
            'verification_notes' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Measurement rejected.',
            'measurement' => $measurement->fresh(),
        ]);
    }

    /**
     * Get summary report of measurements by project.
     */
    public function summaryReport(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $query = BoqMeasurement::query()
            ->whereHas('boqItem', function ($q) use ($request) {
                $q->where('project_id', $request->project_id);
            })
            ->where('status', 'verified');

        if ($request->date_from) {
            $query->where('measurement_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('measurement_date', '<=', $request->date_to);
        }

        $measurements = $query->with('boqItem')->get();

        // Group by BOQ item
        $grouped = $measurements->groupBy('boq_item_id')->map(function ($group) {
            $boqItem = $group->first()->boqItem;
            $totalQty = $group->sum('verified_quantity');
            $totalValue = $totalQty * ($boqItem->rate ?? 0);

            return [
                'boq_item' => $boqItem,
                'total_quantity' => $totalQty,
                'total_value' => $totalValue,
                'measurement_count' => $group->count(),
                'percentage_complete' => $boqItem->quantity > 0
                    ? round(($totalQty / $boqItem->quantity) * 100, 2)
                    : 0,
            ];
        })->values();

        return response()->json([
            'summary' => $grouped,
            'grand_total' => $grouped->sum('total_value'),
            'project_id' => $request->project_id,
        ]);
    }

    /**
     * Get measurement statistics.
     */
    protected function getMeasurementStats(array $filters): array
    {
        $baseQuery = BoqMeasurement::query()
            ->when($filters['project_id'] ?? null, function ($query, $projectId) {
                $query->whereHas('boqItem', function ($q) use ($projectId) {
                    $q->where('project_id', $projectId);
                });
            });

        return [
            'total_count' => (clone $baseQuery)->count(),
            'pending_count' => (clone $baseQuery)->where('status', 'pending')->count(),
            'verified_count' => (clone $baseQuery)->where('status', 'verified')->count(),
            'rejected_count' => (clone $baseQuery)->where('status', 'rejected')->count(),
            'total_verified_quantity' => (clone $baseQuery)
                ->where('status', 'verified')
                ->sum('verified_quantity'),
        ];
    }
}
