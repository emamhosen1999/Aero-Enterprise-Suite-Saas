<?php

namespace Aero\Compliance\Http\Controllers;

use Aero\Compliance\Services\PermitValidationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

/**
 * PermitValidationController
 *
 * API controller for Permit-to-Work validation.
 * PATENTABLE: Safety authorization validation for construction work.
 */
class PermitValidationController extends Controller
{
    public function __construct(
        protected PermitValidationService $permitValidationService
    ) {}

    /**
     * Validate if a valid permit exists for proposed work.
     *
     * PATENTABLE: Pre-work permit authorization check.
     */
    public function validate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'work_type' => 'required|string|max:100',
            'project_id' => 'required|integer|exists:projects,id',
            'chainage' => 'required|numeric|min:0',
            'date' => 'nullable|date',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $date = $request->filled('date')
            ? Carbon::parse($request->input('date'))
            : Carbon::now();

        $result = $this->permitValidationService->validatePermit(
            $request->input('work_type'),
            $request->integer('project_id'),
            $request->float('chainage'),
            $date,
            $request->integer('user_id')
        );

        $statusCode = $result['has_permit'] ? 200 : 403;

        return response()->json($result, $statusCode);
    }

    /**
     * Get permit requirements for a work type.
     */
    public function getRequirements(Request $request): JsonResponse
    {
        $workType = $request->input('work_type');

        $permitCategory = $this->getRequiredPermitCategory($workType);

        if (! $permitCategory) {
            return response()->json([
                'required' => false,
                'message' => 'No permit required for this work type',
                'work_type' => $workType,
            ]);
        }

        return response()->json([
            'required' => true,
            'permit_category' => $permitCategory,
            'work_type' => $workType,
            'message' => "A {$permitCategory} permit is required",
        ]);
    }

    /**
     * List all permit categories and their required activities.
     */
    public function listCategories(): JsonResponse
    {
        $categories = [
            'hot_work' => [
                'name' => 'Hot Work Permit',
                'activities' => ['welding', 'grinding', 'cutting', 'brazing'],
                'risk_level' => 'high',
            ],
            'confined_space' => [
                'name' => 'Confined Space Entry Permit',
                'activities' => ['tank_entry', 'pit_work', 'tunnel_work'],
                'risk_level' => 'critical',
            ],
            'work_at_height' => [
                'name' => 'Work at Height Permit',
                'activities' => ['scaffolding', 'crane_operation', 'roof_work'],
                'risk_level' => 'high',
            ],
            'excavation' => [
                'name' => 'Excavation Permit',
                'activities' => ['deep_excavation', 'trenching', 'boring'],
                'risk_level' => 'high',
            ],
            'electrical' => [
                'name' => 'Electrical Work Permit',
                'activities' => ['live_work', 'high_voltage', 'electrical_installation'],
                'risk_level' => 'critical',
            ],
            'lifting_operations' => [
                'name' => 'Lifting Operations Permit',
                'activities' => ['crane_lift', 'mobile_crane', 'tower_crane'],
                'risk_level' => 'high',
            ],
        ];

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Get required permit category for a work type.
     */
    private function getRequiredPermitCategory(string $workType): ?string
    {
        $mapping = [
            'welding' => 'hot_work',
            'grinding' => 'hot_work',
            'cutting' => 'hot_work',
            'brazing' => 'hot_work',
            'tank_entry' => 'confined_space',
            'pit_work' => 'confined_space',
            'tunnel_work' => 'confined_space',
            'scaffolding' => 'work_at_height',
            'crane_operation' => 'work_at_height',
            'roof_work' => 'work_at_height',
            'deep_excavation' => 'excavation',
            'trenching' => 'excavation',
            'boring' => 'excavation',
            'live_work' => 'electrical',
            'high_voltage' => 'electrical',
            'electrical_installation' => 'electrical',
            'crane_lift' => 'lifting_operations',
            'mobile_crane' => 'lifting_operations',
            'tower_crane' => 'lifting_operations',
        ];

        return $mapping[$workType] ?? null;
    }
}
