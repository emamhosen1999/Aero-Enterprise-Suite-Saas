<?php

namespace Aero\Project\Http\Controllers;

use Aero\Project\Models\BoqItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BOQ Items Controller
 *
 * Manages Bill of Quantities item master data with work layer associations.
 * Part of the Chainage-Centric Integrated Construction Ledger (patentable).
 */
class BoqItemController extends Controller
{
    /**
     * Display BOQ Items management page.
     */
    public function index(): Response
    {
        return Inertia::render('Project/BoqItems/Index', [
            'title' => 'BOQ Items',
        ]);
    }

    /**
     * Get paginated BOQ items with filters.
     */
    public function paginate(Request $request): JsonResponse
    {
        $query = BoqItem::query()
            ->with(['workLayer']);

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('item_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('specification', 'like', "%{$search}%");
            });
        }

        // Work layer filter
        if ($workLayerId = $request->input('work_layer_id')) {
            $query->where('work_layer_id', $workLayerId);
        }

        // Unit filter
        if ($unit = $request->input('unit')) {
            $query->where('unit', $unit);
        }

        // Status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->input('perPage', 30);
        $items = $query->orderBy('item_code')->paginate($perPage);

        return response()->json([
            'items' => $items->items(),
            'pagination' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * Get all BOQ items for dropdowns.
     */
    public function list(Request $request): JsonResponse
    {
        $query = BoqItem::query()->where('is_active', true);

        if ($workLayerId = $request->input('work_layer_id')) {
            $query->where('work_layer_id', $workLayerId);
        }

        $items = $query->orderBy('item_code')
            ->select(['id', 'item_code', 'description', 'unit', 'unit_rate', 'work_layer_id'])
            ->get();

        return response()->json(['items' => $items]);
    }

    /**
     * Get unique units for filter dropdown.
     */
    public function getUnits(): JsonResponse
    {
        $units = BoqItem::query()
            ->distinct()
            ->whereNotNull('unit')
            ->pluck('unit')
            ->sort()
            ->values();

        return response()->json(['units' => $units]);
    }

    /**
     * Get BOQ items statistics.
     */
    public function getStats(): JsonResponse
    {
        $stats = [
            'total' => BoqItem::count(),
            'active' => BoqItem::where('is_active', true)->count(),
            'inactive' => BoqItem::where('is_active', false)->count(),
            'totalQuantity' => BoqItem::sum('total_quantity'),
            'totalValue' => BoqItem::selectRaw('SUM(total_quantity * unit_rate) as total')->value('total') ?? 0,
            'byUnit' => BoqItem::selectRaw('unit, COUNT(*) as count')
                ->groupBy('unit')
                ->pluck('count', 'unit')
                ->toArray(),
        ];

        return response()->json($stats);
    }

    /**
     * Store a new BOQ item.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_code' => 'required|string|max:50|unique:boq_items,item_code',
            'description' => 'required|string|max:500',
            'unit' => 'required|string|max:20',
            'unit_rate' => 'required|numeric|min:0',
            'total_quantity' => 'required|numeric|min:0',
            'specification' => 'nullable|string',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'metadata' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $item = BoqItem::create($validated);

        return response()->json([
            'message' => 'BOQ item created successfully',
            'item' => $item->load('workLayer'),
        ], 201);
    }

    /**
     * Get a specific BOQ item.
     */
    public function show(BoqItem $boqItem): JsonResponse
    {
        return response()->json([
            'item' => $boqItem->load(['workLayer', 'measurements']),
        ]);
    }

    /**
     * Update a BOQ item.
     */
    public function update(Request $request, BoqItem $boqItem): JsonResponse
    {
        $validated = $request->validate([
            'item_code' => 'required|string|max:50|unique:boq_items,item_code,' . $boqItem->id,
            'description' => 'required|string|max:500',
            'unit' => 'required|string|max:20',
            'unit_rate' => 'required|numeric|min:0',
            'total_quantity' => 'required|numeric|min:0',
            'specification' => 'nullable|string',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'metadata' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $boqItem->update($validated);

        return response()->json([
            'message' => 'BOQ item updated successfully',
            'item' => $boqItem->fresh()->load('workLayer'),
        ]);
    }

    /**
     * Delete a BOQ item.
     */
    public function destroy(BoqItem $boqItem): JsonResponse
    {
        // Check if item has measurements
        if ($boqItem->measurements()->exists()) {
            return response()->json([
                'message' => 'Cannot delete BOQ item with existing measurements. Deactivate instead.',
            ], 422);
        }

        $boqItem->delete();

        return response()->json([
            'message' => 'BOQ item deleted successfully',
        ]);
    }

    /**
     * Toggle BOQ item active status.
     */
    public function toggleStatus(BoqItem $boqItem): JsonResponse
    {
        $boqItem->update(['is_active' => !$boqItem->is_active]);

        return response()->json([
            'message' => $boqItem->is_active ? 'BOQ item activated' : 'BOQ item deactivated',
            'item' => $boqItem,
        ]);
    }

    /**
     * Import BOQ items from CSV/Excel.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
            'work_layer_id' => 'nullable|exists:work_layers,id',
        ]);

        // TODO: Implement file parsing with Laravel Excel or custom CSV parser
        // For now, return a placeholder response

        return response()->json([
            'message' => 'Import functionality will be implemented with Laravel Excel package',
            'imported' => 0,
            'errors' => [],
        ]);
    }

    /**
     * Export BOQ items to CSV.
     */
    public function export(Request $request): JsonResponse
    {
        $query = BoqItem::query()->with('workLayer');

        if ($workLayerId = $request->input('work_layer_id')) {
            $query->where('work_layer_id', $workLayerId);
        }

        $items = $query->orderBy('item_code')->get();

        // Prepare export data
        $exportData = $items->map(function ($item) {
            return [
                'item_code' => $item->item_code,
                'description' => $item->description,
                'unit' => $item->unit,
                'unit_rate' => $item->unit_rate,
                'total_quantity' => $item->total_quantity,
                'total_value' => $item->total_quantity * $item->unit_rate,
                'work_layer' => $item->workLayer?->name ?? '',
                'specification' => $item->specification ?? '',
                'is_active' => $item->is_active ? 'Yes' : 'No',
            ];
        });

        return response()->json([
            'data' => $exportData,
            'filename' => 'boq_items_' . now()->format('Y-m-d_His') . '.csv',
        ]);
    }

    /**
     * Get BOQ item summary by work layer.
     */
    public function summaryByLayer(): JsonResponse
    {
        $summary = BoqItem::query()
            ->with('workLayer:id,name,code')
            ->selectRaw('work_layer_id, COUNT(*) as item_count, SUM(total_quantity * unit_rate) as total_value')
            ->groupBy('work_layer_id')
            ->get()
            ->map(function ($row) {
                return [
                    'work_layer_id' => $row->work_layer_id,
                    'work_layer_name' => $row->workLayer?->name ?? 'Unassigned',
                    'work_layer_code' => $row->workLayer?->code ?? '-',
                    'item_count' => $row->item_count,
                    'total_value' => round($row->total_value, 2),
                ];
            });

        return response()->json(['summary' => $summary]);
    }

    /**
     * Bulk update BOQ items.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:boq_items,id',
            'action' => 'required|in:activate,deactivate,assign_layer,update_rate',
            'work_layer_id' => 'required_if:action,assign_layer|exists:work_layers,id',
            'rate_adjustment' => 'required_if:action,update_rate|numeric',
            'rate_type' => 'required_if:action,update_rate|in:percentage,fixed',
        ]);

        $count = 0;

        DB::transaction(function () use ($validated, &$count) {
            $items = BoqItem::whereIn('id', $validated['ids']);

            switch ($validated['action']) {
                case 'activate':
                    $count = $items->update(['is_active' => true]);
                    break;

                case 'deactivate':
                    $count = $items->update(['is_active' => false]);
                    break;

                case 'assign_layer':
                    $count = $items->update(['work_layer_id' => $validated['work_layer_id']]);
                    break;

                case 'update_rate':
                    $itemsCollection = $items->get();
                    foreach ($itemsCollection as $item) {
                        if ($validated['rate_type'] === 'percentage') {
                            $item->unit_rate = $item->unit_rate * (1 + $validated['rate_adjustment'] / 100);
                        } else {
                            $item->unit_rate = $item->unit_rate + $validated['rate_adjustment'];
                        }
                        $item->save();
                        $count++;
                    }
                    break;
            }
        });

        return response()->json([
            'message' => "{$count} BOQ items updated successfully",
            'count' => $count,
        ]);
    }
}
