<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\WorkLayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * WorkLayerController
 *
 * Manages Work Layers - the hierarchical sequence of construction activities.
 * Layers define prerequisites (e.g., Layer 1 "Earthwork" must be completed
 * before Layer 2 "Sub-base" can be started).
 */
class WorkLayerController extends Controller
{
    /**
     * Display a listing of work layers.
     */
    public function index(): Response
    {
        $layers = WorkLayer::query()
            ->with('prerequisiteLayer:id,name')
            ->withCount('chainageProgress')
            ->orderBy('layer_order')
            ->get();

        return Inertia::render('Rfi/WorkLayers/Index', [
            'title' => 'Work Layers',
            'layers' => $layers,
        ]);
    }

    /**
     * Get all work layers for dropdown/select.
     */
    public function list(): JsonResponse
    {
        $layers = WorkLayer::query()
            ->orderBy('layer_order')
            ->get(['id', 'name', 'layer_order', 'color', 'prerequisite_layer_id']);

        return response()->json(['layers' => $layers]);
    }

    /**
     * Store a newly created work layer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:work_layers,name',
            'code' => 'nullable|string|max:50|unique:work_layers,code',
            'description' => 'nullable|string|max:1000',
            'layer_order' => 'required|integer|min:1',
            'prerequisite_layer_id' => 'nullable|exists:work_layers,id',
            'color' => 'nullable|string|max:7',
            'default_thickness' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:20',
            'requires_lab_test' => 'boolean',
            'requires_survey' => 'boolean',
            'requires_photos' => 'boolean',
            'min_photos_required' => 'nullable|integer|min:0',
            'inspection_checklist' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        // Validate no circular prerequisite
        if ($validated['prerequisite_layer_id'] ?? null) {
            $this->validateNoCircularPrerequisite($validated['prerequisite_layer_id'], null);
        }

        $layer = WorkLayer::create($validated);

        return response()->json([
            'message' => 'Work layer created successfully.',
            'layer' => $layer->load('prerequisiteLayer'),
        ], 201);
    }

    /**
     * Display the specified work layer.
     */
    public function show(WorkLayer $workLayer): JsonResponse
    {
        $workLayer->load([
            'prerequisiteLayer',
            'dependentLayers',
        ]);

        return response()->json(['layer' => $workLayer]);
    }

    /**
     * Update the specified work layer.
     */
    public function update(Request $request, WorkLayer $workLayer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:work_layers,name,'.$workLayer->id,
            'code' => 'nullable|string|max:50|unique:work_layers,code,'.$workLayer->id,
            'description' => 'nullable|string|max:1000',
            'layer_order' => 'required|integer|min:1',
            'prerequisite_layer_id' => 'nullable|exists:work_layers,id|different:id',
            'color' => 'nullable|string|max:7',
            'default_thickness' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:20',
            'requires_lab_test' => 'boolean',
            'requires_survey' => 'boolean',
            'requires_photos' => 'boolean',
            'min_photos_required' => 'nullable|integer|min:0',
            'inspection_checklist' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        // Validate no circular prerequisite
        if ($validated['prerequisite_layer_id'] ?? null) {
            $this->validateNoCircularPrerequisite($validated['prerequisite_layer_id'], $workLayer->id);
        }

        $workLayer->update($validated);

        return response()->json([
            'message' => 'Work layer updated successfully.',
            'layer' => $workLayer->fresh()->load('prerequisiteLayer'),
        ]);
    }

    /**
     * Remove the specified work layer.
     */
    public function destroy(WorkLayer $workLayer): JsonResponse
    {
        // Check if layer has dependent layers
        if ($workLayer->dependentLayers()->exists()) {
            return response()->json([
                'message' => 'Cannot delete layer with dependent layers. Update or delete dependent layers first.',
            ], 422);
        }

        // Check if layer has chainage progress
        if ($workLayer->chainageProgress()->exists()) {
            return response()->json([
                'message' => 'Cannot delete layer with existing progress records.',
            ], 422);
        }

        $workLayer->delete();

        return response()->json([
            'message' => 'Work layer deleted successfully.',
        ]);
    }

    /**
     * Reorder work layers.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'layers' => 'required|array',
            'layers.*.id' => 'required|exists:work_layers,id',
            'layers.*.order' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['layers'] as $layerData) {
                WorkLayer::where('id', $layerData['id'])
                    ->update(['layer_order' => $layerData['order']]);
            }
        });

        return response()->json([
            'message' => 'Layers reordered successfully.',
        ]);
    }

    /**
     * Validate that setting a prerequisite doesn't create a circular dependency.
     */
    protected function validateNoCircularPrerequisite(?int $prerequisiteId, ?int $currentLayerId): void
    {
        if (! $prerequisiteId) {
            return;
        }

        $visited = [];
        $current = $prerequisiteId;

        while ($current) {
            if (in_array($current, $visited) || $current === $currentLayerId) {
                abort(422, 'Circular prerequisite dependency detected.');
            }

            $visited[] = $current;
            $layer = WorkLayer::find($current);
            $current = $layer?->prerequisite_layer_id;
        }
    }
}
