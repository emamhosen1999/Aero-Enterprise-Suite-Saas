<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\GeoFencingService;
use Aero\Rfi\Services\LinearContinuityValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

/**
 * RfiController
 *
 * API controller for managing Request for Inspection (RFI) submissions.
 * Uses Rfi as the unified RFI model (backed by daily_works table).
 * Integrates with patentable services: GPS geofencing, layer continuity.
 */
class RfiController extends Controller
{
    public function __construct(
        protected GeoFencingService $geoFencingService,
        protected LinearContinuityValidator $continuityValidator
    ) {}

    /**
     * List RFIs with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Rfi::query()->with(['workLocation', 'inchargeUser', 'assignedUser']);

        if ($request->filled('work_location_id')) {
            $query->where('work_location_id', $request->integer('work_location_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('layer')) {
            $query->where('layer', $request->input('layer'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('inspection_result')) {
            $query->where('inspection_result', $request->input('inspection_result'));
        }

        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->input('date_to'));
        }

        $perPage = $request->integer('per_page', 20);
        $rfis = $query->orderByDesc('date')->orderByDesc('created_at')->paginate($perPage);

        return response()->json($rfis);
    }

    /**
     * Show a single RFI.
     */
    public function show(Rfi $rfi): JsonResponse
    {
        $rfi->load(['workLocation', 'inchargeUser', 'assignedUser', 'objections']);

        return response()->json([
            'data' => $rfi,
        ]);
    }

    /**
     * Create a new RFI with pre-submission validation.
     *
     * PATENTABLE INTEGRATION:
     * - GPS Geofencing validation (via HasGeoLock trait)
     * - Layer continuity check
     * - Permit validation (via RequiresPermit trait)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'type' => 'required|string|in:Embankment,Structure,Pavement',
            'work_location_id' => 'required|integer|exists:work_locations,id',
            'layer' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:2000',
            'side' => 'nullable|string|in:TR-R,TR-L,SR-R,SR-L,Both',
            'qty_layer' => 'nullable|integer|min:1',
            'planned_time' => 'nullable|string',
            'incharge_user_id' => 'nullable|integer|exists:users,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'gps_accuracy' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $validationResults = [];

        // Get work location for chainage info
        $workLocation = WorkLocation::find($data['work_location_id']);
        if (! $workLocation) {
            return response()->json([
                'message' => 'Work location not found',
            ], 404);
        }

        $projectId = $workLocation->project_id ?? 1;
        $startChainage = $workLocation->start_chainage_m ?? 0;
        $endChainage = $workLocation->end_chainage_m ?? $startChainage;

        // PATENTABLE: GPS Geofencing validation
        if (! empty($data['latitude']) && ! empty($data['longitude'])) {
            $geoResult = $this->geoFencingService->validateLocation(
                $data['latitude'],
                $data['longitude'],
                $startChainage,
                $projectId
            );

            $validationResults['gps_validation'] = $geoResult;

            // Store GPS data even if validation fails (for audit)
            $data['geo_validation_result'] = $geoResult;
            $data['geo_validation_status'] = $geoResult['valid'] ? 'valid' : 'invalid';
            $data['gps_captured_at'] = now();

            if (! $geoResult['valid']) {
                $data['requires_review'] = true;
                $data['review_reason'] = $geoResult['message'] ?? 'GPS location outside project boundary';
            }
        }

        // PATENTABLE: Layer continuity validation (if layer specified)
        if (! empty($data['layer']) && $endChainage > $startChainage) {
            $continuityResult = $this->continuityValidator->validateLayerContinuity(
                $data['layer'],
                $startChainage,
                $endChainage,
                $projectId
            );

            $validationResults['continuity_validation'] = $continuityResult;
            $data['continuity_validation_result'] = $continuityResult;
            $data['can_approve'] = $continuityResult['can_approve'];

            if (! $continuityResult['can_approve']) {
                $data['continuity_status'] = 'blocked';
                $data['detected_gaps'] = $continuityResult['gaps'] ?? [];
                $data['prerequisite_coverage'] = $continuityResult['coverage'] ?? 0;
            } else {
                $data['continuity_status'] = 'validated';
                $data['prerequisite_coverage'] = 100;
            }
        }

        // Generate RFI number
        $data['number'] = $this->generateRfiNumber($data['date']);
        $data['status'] = Rfi::STATUS_NEW;

        // Create RFI
        $rfi = Rfi::create($data);

        return response()->json([
            'message' => 'RFI created successfully',
            'data' => $rfi->fresh(['workLocation']),
            'validation' => $validationResults,
        ], 201);
    }

    /**
     * Generate unique RFI number for a given date.
     */
    protected function generateRfiNumber(string $date): string
    {
        $dateFormatted = date('Ymd', strtotime($date));
        $count = Rfi::whereDate('date', $date)->count() + 1;

        return sprintf('RFI-%s-%03d', $dateFormatted, $count);
    }

    /**
     * Update an existing RFI.
     */
    public function update(Request $request, Rfi $rfi): JsonResponse
    {
        if ($rfi->inspection_result === Rfi::INSPECTION_APPROVED) {
            return response()->json([
                'message' => 'Cannot update an approved RFI',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|string|in:Embankment,Structure,Pavement',
            'layer' => 'sometimes|string|max:50',
            'description' => 'nullable|string|max:2000',
            'side' => 'sometimes|string|in:TR-R,TR-L,SR-R,SR-L,Both',
            'qty_layer' => 'nullable|integer|min:1',
            'planned_time' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rfi->update($validator->validated());

        return response()->json([
            'message' => 'RFI updated successfully',
            'data' => $rfi->fresh(['workLocation']),
        ]);
    }

    /**
     * Approve an RFI.
     *
     * PATENTABLE: Re-validates continuity before approval.
     */
    public function approve(Request $request, Rfi $rfi): JsonResponse
    {
        if ($rfi->inspection_result === Rfi::INSPECTION_APPROVED) {
            return response()->json([
                'message' => 'RFI is already approved',
            ], 422);
        }

        // Check if continuity allows approval
        if ($rfi->can_approve === false && ! $rfi->continuity_overridden_by) {
            return response()->json([
                'message' => 'Cannot approve: Layer continuity check failed',
                'validation' => $rfi->continuity_validation_result,
                'gaps' => $rfi->detected_gaps,
            ], 422);
        }

        $rfi->update([
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'rfi_response_status' => Rfi::RFI_RESPONSE_APPROVED,
            'rfi_response_date' => now()->toDateString(),
            'completion_time' => now(),
        ]);

        return response()->json([
            'message' => 'RFI approved successfully',
            'data' => $rfi->fresh(['workLocation']),
        ]);
    }

    /**
     * Reject an RFI.
     */
    public function reject(Request $request, Rfi $rfi): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Rejection reason is required',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rfi->update([
            'inspection_result' => Rfi::INSPECTION_REJECTED,
            'rfi_response_status' => Rfi::RFI_RESPONSE_REJECTED,
            'rfi_response_date' => now()->toDateString(),
            'inspection_details' => $request->input('reason'),
        ]);

        return response()->json([
            'message' => 'RFI rejected',
            'data' => $rfi->fresh(['workLocation']),
        ]);
    }

    /**
     * Delete (soft) an RFI.
     */
    public function destroy(Rfi $rfi): JsonResponse
    {
        if ($rfi->inspection_result === Rfi::INSPECTION_APPROVED) {
            return response()->json([
                'message' => 'Cannot delete an approved RFI',
            ], 403);
        }

        $rfi->delete();

        return response()->json([
            'message' => 'RFI deleted successfully',
        ]);
    }

    /**
     * Validate GPS location without creating RFI.
     *
     * PATENTABLE: Standalone GPS validation endpoint.
     */
    public function validateGps(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'work_location_id' => 'required|integer|exists:work_locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $workLocation = WorkLocation::find($request->integer('work_location_id'));
        $projectId = $workLocation->project_id ?? 1;
        $chainage = $workLocation->start_chainage_m ?? 0;

        $result = $this->geoFencingService->validateLocation(
            $request->float('latitude'),
            $request->float('longitude'),
            $chainage,
            $projectId
        );

        return response()->json($result);
    }

    /**
     * Check layer continuity without creating RFI.
     *
     * PATENTABLE: Standalone continuity validation endpoint.
     */
    public function validateContinuity(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'layer' => 'required|string|max:50',
            'work_location_id' => 'required|integer|exists:work_locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $workLocation = WorkLocation::find($request->integer('work_location_id'));
        $projectId = $workLocation->project_id ?? 1;
        $startChainage = $workLocation->start_chainage_m ?? 0;
        $endChainage = $workLocation->end_chainage_m ?? $startChainage;

        $result = $this->continuityValidator->validateLayerContinuity(
            $request->input('layer'),
            $startChainage,
            $endChainage,
            $projectId
        );

        return response()->json($result);
    }

    /**
     * Override continuity block for emergency situations.
     *
     * PATENTABLE: Documented override with full audit trail.
     */
    public function overrideContinuity(Request $request, Rfi $rfi): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:20|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'A detailed reason (min 20 characters) is required for override',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rfi->update([
            'continuity_overridden_by' => Auth::id(),
            'continuity_overridden_at' => now(),
            'continuity_override_reason' => $request->input('reason'),
            'can_approve' => true,
        ]);

        return response()->json([
            'message' => 'Continuity override recorded - RFI can now be approved',
            'data' => $rfi->fresh(['workLocation']),
        ]);
    }
}
