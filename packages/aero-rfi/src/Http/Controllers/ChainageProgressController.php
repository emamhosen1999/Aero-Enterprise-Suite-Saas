<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\ChainageProgress;
use Aero\Rfi\Models\WorkLayer;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\ChainageGapAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ChainageProgressController
 *
 * Handles the Chainage Progress Map visualization and API endpoints.
 * This is a core component of the patentable "Chainage-Centric Integrated
 * Construction Ledger" system.
 */
class ChainageProgressController extends Controller
{
    public function __construct(
        protected ChainageGapAnalysisService $gapAnalysisService
    ) {}

    /**
     * Display the Chainage Progress Map page.
     */
    public function index(Request $request): Response
    {
        $workLocations = WorkLocation::active()
            ->with('project')
            ->orderBy('name')
            ->get(['id', 'name', 'project_id', 'start_chainage', 'end_chainage']);

        $workLayers = WorkLayer::query()
            ->orderBy('layer_order')
            ->get(['id', 'name', 'layer_order', 'color', 'prerequisite_layer_id']);

        return Inertia::render('Rfi/ChainageProgress/Index', [
            'title' => 'Chainage Progress Map',
            'workLocations' => $workLocations,
            'workLayers' => $workLayers,
            'statuses' => ChainageProgress::$statuses,
        ]);
    }

    /**
     * Get chainage progress data for a specific work location.
     *
     * Returns a linearized view of all chainage segments with their status
     * for each work layer - the "Golden Ledger" of construction progress.
     */
    public function getProgressData(Request $request): JsonResponse
    {
        $request->validate([
            'work_location_id' => 'required|exists:work_locations,id',
            'layer_id' => 'nullable|exists:work_layers,id',
            'status' => 'nullable|in:' . implode(',', array_keys(ChainageProgress::$statuses)),
            'chainage_from' => 'nullable|numeric|min:0',
            'chainage_to' => 'nullable|numeric|min:0',
        ]);

        $query = ChainageProgress::query()
            ->where('work_location_id', $request->work_location_id)
            ->with(['workLayer', 'rfi', 'qualityInspection']);

        if ($request->filled('layer_id')) {
            $query->where('work_layer_id', $request->layer_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('chainage_from')) {
            $query->where('end_chainage', '>=', $request->chainage_from);
        }

        if ($request->filled('chainage_to')) {
            $query->where('start_chainage', '<=', $request->chainage_to);
        }

        $progressData = $query
            ->orderBy('start_chainage')
            ->orderBy('work_layer_id')
            ->get();

        // Get work location bounds
        $workLocation = WorkLocation::find($request->work_location_id);

        // Calculate summary statistics
        $stats = $this->calculateProgressStats($progressData, $workLocation);

        return response()->json([
            'progress' => $progressData,
            'stats' => $stats,
            'work_location' => $workLocation,
        ]);
    }

    /**
     * Get gap analysis for a specific chainage range.
     *
     * PATENTABLE: Spatial prerequisite validation showing what work
     * must be completed before a new RFI can be submitted.
     */
    public function getGapAnalysis(Request $request): JsonResponse
    {
        $request->validate([
            'work_location_id' => 'required|exists:work_locations,id',
            'layer_id' => 'required|exists:work_layers,id',
            'start_chainage' => 'required|numeric|min:0',
            'end_chainage' => 'required|numeric|min:0|gte:start_chainage',
        ]);

        $layer = WorkLayer::findOrFail($request->layer_id);
        $workLocation = WorkLocation::findOrFail($request->work_location_id);

        // Get gaps in prerequisite layers
        $prerequisiteGaps = [];
        if ($layer->prerequisite_layer_id) {
            $prerequisiteGaps = $layer->prerequisiteLayer->getGapsInRange(
                $workLocation->id,
                $request->start_chainage,
                $request->end_chainage
            );
        }

        // Check for blocking NCRs
        $blockingNcrs = $this->gapAnalysisService->getBlockingNcrs(
            $workLocation->id,
            $request->layer_id,
            $request->start_chainage,
            $request->end_chainage
        );

        // Check if RFI can be submitted
        $canSubmit = empty($prerequisiteGaps) && empty($blockingNcrs);

        return response()->json([
            'can_submit' => $canSubmit,
            'prerequisite_gaps' => $prerequisiteGaps,
            'blocking_ncrs' => $blockingNcrs,
            'layer' => $layer,
            'chainage_range' => [
                'start' => $request->start_chainage,
                'end' => $request->end_chainage,
            ],
        ]);
    }

    /**
     * Get progress timeline for a specific chainage segment.
     */
    public function getChainageTimeline(Request $request): JsonResponse
    {
        $request->validate([
            'work_location_id' => 'required|exists:work_locations,id',
            'chainage' => 'required|numeric|min:0',
        ]);

        $progress = ChainageProgress::query()
            ->where('work_location_id', $request->work_location_id)
            ->where('start_chainage', '<=', $request->chainage)
            ->where('end_chainage', '>=', $request->chainage)
            ->with([
                'workLayer',
                'rfi.inchargeUser',
                'qualityInspection.inspector',
                'boqMeasurement.boqItem',
            ])
            ->orderBy('work_layer_id')
            ->get();

        return response()->json([
            'timeline' => $progress,
            'chainage' => $request->chainage,
        ]);
    }

    /**
     * Calculate progress statistics.
     */
    protected function calculateProgressStats($progressData, $workLocation): array
    {
        $totalLength = $workLocation ? ($workLocation->end_chainage - $workLocation->start_chainage) : 0;
        $layers = WorkLayer::orderBy('layer_order')->get();

        $stats = [
            'total_length' => $totalLength,
            'by_layer' => [],
            'by_status' => [],
        ];

        foreach ($layers as $layer) {
            $layerProgress = $progressData->where('work_layer_id', $layer->id);
            $approvedLength = $layerProgress
                ->where('status', 'approved')
                ->sum(fn ($p) => $p->end_chainage - $p->start_chainage);

            $stats['by_layer'][$layer->id] = [
                'name' => $layer->name,
                'color' => $layer->color,
                'approved_length' => $approvedLength,
                'percentage' => $totalLength > 0 ? round(($approvedLength / $totalLength) * 100, 2) : 0,
            ];
        }

        foreach (ChainageProgress::$statuses as $status => $label) {
            $count = $progressData->where('status', $status)->count();
            $stats['by_status'][$status] = [
                'label' => $label,
                'count' => $count,
            ];
        }

        return $stats;
    }
}
