<?php

namespace Aero\Crm\Http\Controllers;

use Aero\Crm\Http\Controllers\Controller;
use Aero\Crm\Http\Requests\StoreDealRequest;
use Aero\Crm\Http\Requests\UpdateDealRequest;
use Aero\Crm\Models\Deal;
use App\Models\CRM\DealLostReason;
use App\Services\CRM\PipelineService;
use Illuminate\Http\Request;

class DealController extends Controller
{
    public function __construct(
        protected PipelineService $pipelineService
    ) {}

    /**
     * Store a new deal
     */
    public function store(StoreDealRequest $request)
    {
        $this->authorize('manage_deals');

        try {
            $deal = $this->pipelineService->createDeal($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Deal created successfully',
                'deal' => $deal,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Move deal to a new stage/position (Kanban drag-drop)
     */
    public function move(Request $request, Deal $deal)
    {
        $this->authorize('manage_deals');

        $validated = $request->validate([
            'pipeline_stage_id' => 'required|exists:pipeline_stages,id',
            'position' => 'required|integer|min:1',
        ]);

        try {
            $updatedDeal = $this->pipelineService->updateDealStage(
                $deal,
                $validated['pipeline_stage_id'],
                $validated['position']
            );

            return response()->json([
                'success' => true,
                'message' => 'Deal moved successfully',
                'deal' => $updatedDeal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update deal details
     */
    public function update(UpdateDealRequest $request, Deal $deal)
    {
        $this->authorize('manage_deals');

        try {
            $updatedDeal = $this->pipelineService->updateDeal($deal, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Deal updated successfully',
                'deal' => $updatedDeal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mark deal as won
     */
    public function markAsWon(Request $request, Deal $deal)
    {
        $this->authorize('manage_deals');

        $validated = $request->validate([
            'actual_value' => 'nullable|numeric|min:0',
        ]);

        try {
            $updatedDeal = $this->pipelineService->markAsWon(
                $deal,
                $validated['actual_value'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Deal marked as won!',
                'deal' => $updatedDeal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mark deal as lost
     */
    public function markAsLost(Request $request, Deal $deal)
    {
        $this->authorize('manage_deals');

        $validated = $request->validate([
            'lost_reason_id' => 'nullable|exists:deal_lost_reasons,id',
            'lost_notes' => 'nullable|string|max:1000',
        ]);

        try {
            $updatedDeal = $this->pipelineService->markAsLost(
                $deal,
                $validated['lost_reason_id'] ?? null,
                $validated['lost_notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Deal marked as lost',
                'deal' => $updatedDeal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reopen a closed deal
     */
    public function reopen(Request $request, Deal $deal)
    {
        $this->authorize('manage_deals');

        $validated = $request->validate([
            'pipeline_stage_id' => 'required|exists:pipeline_stages,id',
        ]);

        try {
            $updatedDeal = $this->pipelineService->reopenDeal(
                $deal,
                $validated['pipeline_stage_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Deal reopened successfully',
                'deal' => $updatedDeal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a deal
     */
    public function destroy(Deal $deal)
    {
        $this->authorize('manage_deals');

        try {
            $deal->delete();

            return response()->json([
                'success' => true,
                'message' => 'Deal deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get lost reasons for dropdown
     */
    public function getLostReasons()
    {
        $reasons = DealLostReason::where('is_active', true)
            ->orderBy('display_order')
            ->get(['id', 'name', 'description']);

        return response()->json($reasons);
    }
}
