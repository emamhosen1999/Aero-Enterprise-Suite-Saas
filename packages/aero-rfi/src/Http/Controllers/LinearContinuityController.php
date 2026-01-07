<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Services\GeoFencingService;
use Aero\Rfi\Services\LinearContinuityValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * LinearContinuityController - PATENTABLE CORE IP
 * 
 * API endpoints for layer progression validation and gap detection.
 * Used by LinearProgressMap and GeoLockedRfiForm components.
 */
class LinearContinuityController
{
    public function __construct(
        protected LinearContinuityValidator $continuityValidator,
        protected GeoFencingService $geoFencingService
    ) {}

    /**
     * Get layer completion grid for visual map
     * 
     * GET /api/rfi/linear-continuity/grid
     */
    public function getCompletionGrid(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'layer' => 'required|string',
            'start_chainage' => 'required|numeric|min:0',
            'end_chainage' => 'required|numeric|gt:start_chainage',
            'segment_size' => 'nullable|numeric|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        try {
            $grid = $this->continuityValidator->getLayerCompletionGrid(
                $request->input('layer'),
                $request->input('start_chainage'),
                $request->input('end_chainage'),
                $request->input('project_id'),
                $request->input('segment_size', 10)
            );

            // Also get validation result for the range
            $validation = $this->continuityValidator->validateLayerContinuity(
                $request->input('layer'),
                $request->input('start_chainage'),
                $request->input('end_chainage'),
                $request->input('project_id')
            );

            return response()->json([
                'grid' => $grid,
                'coverage' => $validation['coverage'],
                'gaps' => $validation['gaps'],
                'can_approve' => $validation['can_approve'],
                'violations' => $validation['violations'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate completion grid',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate layer continuity for proposed work
     * 
     * POST /api/rfi/linear-continuity/validate
     */
    public function validateContinuity(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'layer' => 'required|string',
            'start_chainage' => 'required|numeric|min:0',
            'end_chainage' => 'required|numeric|gt:start_chainage',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->continuityValidator->validateLayerContinuity(
                $request->input('layer'),
                $request->input('start_chainage'),
                $request->input('end_chainage'),
                $request->input('project_id')
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get AI-suggested next work location
     * 
     * POST /api/rfi/linear-continuity/suggest-location
     */
    public function suggestNextLocation(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'layer' => 'required|string',
            'start_chainage' => 'nullable|numeric|min:0',
            'end_chainage' => 'nullable|numeric|gt:start_chainage',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        try {
            $suggestion = $this->continuityValidator->suggestNextWorkLocation(
                $request->input('layer'),
                $request->input('project_id'),
                $request->input('start_chainage', 0),
                $request->input('end_chainage', 999999)
            );

            return response()->json([
                'suggested_location' => $suggestion,
                'message' => $suggestion 
                    ? "Priority work area identified" 
                    : "All areas adequately covered",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate suggestion',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Analyze layer coverage for a specific range
     * 
     * GET /api/rfi/linear-continuity/coverage
     */
    public function analyzeCoverage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'layer' => 'required|string',
            'start_chainage' => 'required|numeric|min:0',
            'end_chainage' => 'required|numeric|gt:start_chainage',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        try {
            $coverage = $this->continuityValidator->analyzeLayerCoverage(
                $request->input('layer'),
                $request->input('start_chainage'),
                $request->input('end_chainage'),
                $request->input('project_id')
            );

            return response()->json($coverage);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Coverage analysis failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get dashboard stats for project
     * 
     * GET /api/rfi/linear-continuity/stats
     */
    public function getStats(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        try {
            $projectId = $request->input('project_id');

            // Get counts for all layers
            $totalRfis = \Aero\Rfi\Models\Rfi::where('project_id', $projectId)
                ->whereNotNull('layer')
                ->count();

            $validatedRfis = \Aero\Rfi\Models\Rfi::where('project_id', $projectId)
                ->where('geo_validation_status', 'passed')
                ->count();

            $activeRfis = \Aero\Rfi\Models\Rfi::where('project_id', $projectId)
                ->whereIn('status', ['new', 'in-progress', 'pending'])
                ->count();

            $blockedApprovals = \Aero\Rfi\Models\Rfi::where('project_id', $projectId)
                ->where('can_approve', false)
                ->count();

            // Calculate average coverage across all layers
            $avgCoverage = 0;
            $layers = ['earthwork_excavation', 'earthwork_compaction', 'sub_base', 'base_course', 'binder_course', 'wearing_course', 'surface_treatment'];
            
            foreach ($layers as $layer) {
                $coverage = $this->continuityValidator->analyzeLayerCoverage(
                    $layer,
                    0,
                    999999,
                    $projectId
                );
                $avgCoverage += $coverage['coverage'];
            }
            $avgCoverage = round($avgCoverage / count($layers), 1);

            return response()->json([
                'total_layers' => count($layers),
                'active_rfis' => $activeRfis,
                'validated_rfis' => $validatedRfis,
                'avg_coverage' => $avgCoverage,
                'blocked_approvals' => $blockedApprovals,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch stats',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate GPS location against claimed chainage
     * 
     * POST /api/rfi/geofencing/validate
     */
    public function validateGPS(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'claimed_chainage' => 'required|numeric|min:0',
            'project_id' => 'required|exists:projects,id',
            'tolerance_meters' => 'nullable|numeric|min:1|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->geoFencingService->validateLocation(
                $request->input('latitude'),
                $request->input('longitude'),
                $request->input('claimed_chainage'),
                $request->input('project_id'),
                $request->input('tolerance_meters', 50)
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'GPS validation failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
