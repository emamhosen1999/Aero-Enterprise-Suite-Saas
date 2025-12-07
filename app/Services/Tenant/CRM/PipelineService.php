<?php

namespace App\Services\Tenant\CRM;

use App\Models\Tenant\CRM\Deal;
use App\Models\CRM\DealActivity;
use App\Models\CRM\DealStageHistory;
use App\Models\Tenant\CRM\Pipeline;
use App\Models\CRM\PipelineStage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PipelineService
{
    /**
     * Update deal stage and position (drag-drop in Kanban)
     *
     * @throws \Exception
     */
    public function updateDealStage(Deal $deal, int $newStageId, int $newPosition): Deal
    {
        return DB::transaction(function () use ($deal, $newStageId, $newPosition) {
            $oldStageId = $deal->pipeline_stage_id;
            $oldPosition = $deal->position;
            $isStageChange = $oldStageId !== $newStageId;

            // Validate the new stage exists and belongs to same pipeline
            $newStage = PipelineStage::findOrFail($newStageId);

            if ($deal->pipeline_id !== $newStage->pipeline_id) {
                throw new \Exception('Cannot move deal to a stage in a different pipeline.');
            }

            // Check max deals limit on new stage
            if ($isStageChange && $newStage->max_deals) {
                $currentDealsCount = Deal::where('pipeline_stage_id', $newStageId)->count();
                if ($currentDealsCount >= $newStage->max_deals) {
                    throw new \Exception("Stage '{$newStage->name}' has reached its maximum deal limit.");
                }
            }

            if ($isStageChange) {
                // Moving to a different stage
                // 1. Shift positions in old stage (fill the gap)
                Deal::where('pipeline_stage_id', $oldStageId)
                    ->where('position', '>', $oldPosition)
                    ->decrement('position');

                // 2. Shift positions in new stage (make room)
                Deal::where('pipeline_stage_id', $newStageId)
                    ->where('position', '>=', $newPosition)
                    ->increment('position');

                // 3. Update deal with new stage and position
                $deal->pipeline_stage_id = $newStageId;
                $deal->position = $newPosition;
                $deal->probability = $newStage->probability;

                // Update status based on stage type
                if ($newStage->stage_type === 'won') {
                    $deal->status = 'won';
                    $deal->closed_at = now();
                } elseif ($newStage->stage_type === 'lost') {
                    $deal->status = 'lost';
                    $deal->closed_at = now();
                } else {
                    $deal->status = 'open';
                    $deal->closed_at = null;
                }

                $deal->save();

                // 4. Record stage history
                $this->recordStageHistory($deal, $oldStageId, $newStageId);

                // 5. Log activity
                $this->logActivity($deal, 'stage_changed', [
                    'from_stage' => $oldStageId,
                    'to_stage' => $newStageId,
                    'from_stage_name' => PipelineStage::find($oldStageId)?->name,
                    'to_stage_name' => $newStage->name,
                ]);
            } else {
                // Moving within same stage (reordering)
                if ($newPosition > $oldPosition) {
                    // Moving down: shift positions up for deals between old and new
                    Deal::where('pipeline_stage_id', $oldStageId)
                        ->where('position', '>', $oldPosition)
                        ->where('position', '<=', $newPosition)
                        ->decrement('position');
                } elseif ($newPosition < $oldPosition) {
                    // Moving up: shift positions down for deals between new and old
                    Deal::where('pipeline_stage_id', $oldStageId)
                        ->where('position', '>=', $newPosition)
                        ->where('position', '<', $oldPosition)
                        ->increment('position');
                }

                $deal->position = $newPosition;
                $deal->save();
            }

            return $deal->fresh(['stage', 'customer', 'assignedTo']);
        });
    }

    /**
     * Move deal within the same stage
     */
    public function moveDealWithinStage(Deal $deal, int $newPosition): Deal
    {
        return $this->updateDealStage($deal, $deal->pipeline_stage_id, $newPosition);
    }

    /**
     * Create a new deal
     */
    public function createDeal(array $data): Deal
    {
        return DB::transaction(function () use ($data) {
            $stage = PipelineStage::findOrFail($data['pipeline_stage_id']);

            // Check max deals limit
            if ($stage->max_deals) {
                $currentDealsCount = Deal::where('pipeline_stage_id', $stage->id)->count();
                if ($currentDealsCount >= $stage->max_deals) {
                    throw new \Exception("Stage '{$stage->name}' has reached its maximum deal limit.");
                }
            }

            // Get next position in stage
            $maxPosition = Deal::where('pipeline_stage_id', $stage->id)->max('position') ?? 0;

            $deal = Deal::create([
                'pipeline_id' => $stage->pipeline_id,
                'pipeline_stage_id' => $stage->id,
                'customer_id' => $data['customer_id'] ?? null,
                'opportunity_id' => $data['opportunity_id'] ?? null,
                'assigned_to' => $data['assigned_to'] ?? Auth::id(),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'value' => $data['value'] ?? 0,
                'currency' => $data['currency'] ?? 'USD',
                'probability' => $stage->probability,
                'expected_close_date' => $data['expected_close_date'] ?? null,
                'position' => $maxPosition + 1,
                'status' => 'open',
                'source' => $data['source'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
            ]);

            // Record initial stage history
            DealStageHistory::create([
                'deal_id' => $deal->id,
                'pipeline_stage_id' => $stage->id,
                'entered_at' => now(),
                'entered_by' => Auth::id(),
            ]);

            // Log creation activity
            $this->logActivity($deal, 'created', [
                'title' => $deal->title,
                'value' => $deal->value,
                'stage' => $stage->name,
            ]);

            return $deal->fresh(['stage', 'customer', 'assignedTo']);
        });
    }

    /**
     * Get pipeline with all stages and deals for Kanban board
     *
     * @return array<string, mixed>
     */
    public function getPipelineForKanban(int $pipelineId, array $filters = []): array
    {
        $pipeline = Pipeline::with(['stages' => function ($query) {
            $query->ordered();
        }])->findOrFail($pipelineId);

        $dealsQuery = Deal::where('pipeline_id', $pipelineId)
            ->with(['customer:id,name', 'assignedTo:id,name', 'stage:id,name,color,stage_type']);

        // Apply filters
        if (! empty($filters['assigned_to'])) {
            $dealsQuery->where('assigned_to', $filters['assigned_to']);
        }

        if (! empty($filters['status'])) {
            $dealsQuery->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $dealsQuery->where('priority', $filters['priority']);
        }

        if (! empty($filters['search'])) {
            $dealsQuery->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('deal_number', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['is_rotting']) && $filters['is_rotting']) {
            $dealsQuery->rotting();
        }

        $deals = $dealsQuery->orderBy('position')->get();

        // Group deals by stage
        $dealsByStage = $deals->groupBy('pipeline_stage_id');

        // Build Kanban structure
        $columns = $pipeline->stages->map(function ($stage) use ($dealsByStage) {
            $stageDeals = $dealsByStage->get($stage->id, collect());

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'color' => $stage->color,
                'position' => $stage->position,
                'stage_type' => $stage->stage_type,
                'probability' => $stage->probability,
                'max_deals' => $stage->max_deals,
                'rotting_days' => $stage->rotting_days,
                'deals_count' => $stageDeals->count(),
                'deals_value' => $stageDeals->sum('value'),
                'deals' => $stageDeals->values(),
            ];
        });

        return [
            'pipeline' => [
                'id' => $pipeline->id,
                'name' => $pipeline->name,
                'type' => $pipeline->type,
                'currency' => $pipeline->currency,
            ],
            'columns' => $columns,
            'summary' => [
                'total_deals' => $deals->count(),
                'total_value' => $deals->sum('value'),
                'weighted_value' => $deals->sum(fn ($d) => $d->value * ($d->probability / 100)),
                'rotting_deals' => $deals->filter(fn ($d) => $d->is_rotting)->count(),
            ],
        ];
    }

    /**
     * Get deals by stage
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Deal>
     */
    public function getDealsByStage(int $stageId, array $filters = [])
    {
        $query = Deal::where('pipeline_stage_id', $stageId)
            ->with(['customer:id,name', 'assignedTo:id,name', 'activities' => function ($q) {
                $q->latest()->limit(3);
            }])
            ->orderBy('position');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        return $query->get();
    }

    /**
     * Update deal details
     */
    public function updateDeal(Deal $deal, array $data): Deal
    {
        return DB::transaction(function () use ($deal, $data) {
            $oldData = $deal->only(['title', 'value', 'assigned_to', 'expected_close_date', 'priority']);

            $deal->update($data);

            // Log changes
            $changes = [];
            foreach ($oldData as $key => $oldValue) {
                if (isset($data[$key]) && $data[$key] !== $oldValue) {
                    $changes[$key] = [
                        'from' => $oldValue,
                        'to' => $data[$key],
                    ];
                }
            }

            if (! empty($changes)) {
                $this->logActivity($deal, 'updated', $changes);
            }

            return $deal->fresh(['stage', 'customer', 'assignedTo']);
        });
    }

    /**
     * Mark deal as won
     */
    public function markAsWon(Deal $deal, ?float $actualValue = null): Deal
    {
        return DB::transaction(function () use ($deal, $actualValue) {
            // Find won stage in pipeline
            $wonStage = PipelineStage::where('pipeline_id', $deal->pipeline_id)
                ->where('stage_type', 'won')
                ->first();

            if (! $wonStage) {
                throw new \Exception('No "Won" stage defined in this pipeline.');
            }

            $oldStageId = $deal->pipeline_stage_id;

            // Move to won stage
            $this->updateDealStage($deal, $wonStage->id, 1);

            // Update actual value if provided
            if ($actualValue !== null) {
                $deal->actual_value = $actualValue;
                $deal->save();
            }

            return $deal->fresh(['stage', 'customer', 'assignedTo']);
        });
    }

    /**
     * Mark deal as lost
     */
    public function markAsLost(Deal $deal, ?int $lostReasonId = null, ?string $lostNotes = null): Deal
    {
        return DB::transaction(function () use ($deal, $lostReasonId, $lostNotes) {
            // Find lost stage in pipeline
            $lostStage = PipelineStage::where('pipeline_id', $deal->pipeline_id)
                ->where('stage_type', 'lost')
                ->first();

            if (! $lostStage) {
                throw new \Exception('No "Lost" stage defined in this pipeline.');
            }

            $oldStageId = $deal->pipeline_stage_id;

            // Move to lost stage
            $this->updateDealStage($deal, $lostStage->id, 1);

            // Update lost reason
            if ($lostReasonId) {
                $deal->lost_reason_id = $lostReasonId;
            }
            if ($lostNotes) {
                $deal->lost_notes = $lostNotes;
            }
            $deal->save();

            // Log activity
            $this->logActivity($deal, 'marked_lost', [
                'reason_id' => $lostReasonId,
                'notes' => $lostNotes,
            ]);

            return $deal->fresh(['stage', 'customer', 'assignedTo', 'lostReason']);
        });
    }

    /**
     * Reopen a closed deal
     */
    public function reopenDeal(Deal $deal, int $stageId): Deal
    {
        return DB::transaction(function () use ($deal, $stageId) {
            if ($deal->status === 'open') {
                throw new \Exception('Deal is already open.');
            }

            $stage = PipelineStage::findOrFail($stageId);

            if ($stage->pipeline_id !== $deal->pipeline_id) {
                throw new \Exception('Cannot move deal to a stage in a different pipeline.');
            }

            if (in_array($stage->stage_type, ['won', 'lost'])) {
                throw new \Exception('Cannot reopen deal to a Won or Lost stage.');
            }

            $maxPosition = Deal::where('pipeline_stage_id', $stageId)->max('position') ?? 0;

            $deal->pipeline_stage_id = $stageId;
            $deal->position = $maxPosition + 1;
            $deal->status = 'open';
            $deal->closed_at = null;
            $deal->lost_reason_id = null;
            $deal->lost_notes = null;
            $deal->probability = $stage->probability;
            $deal->save();

            // Record stage history
            $this->recordStageHistory($deal, null, $stageId);

            // Log activity
            $this->logActivity($deal, 'reopened', [
                'stage' => $stage->name,
            ]);

            return $deal->fresh(['stage', 'customer', 'assignedTo']);
        });
    }

    /**
     * Bulk update deal positions (for Kanban board reordering)
     *
     * @param  array<int, array{id: int, position: int}>  $positions
     */
    public function bulkUpdatePositions(int $stageId, array $positions): void
    {
        DB::transaction(function () use ($stageId, $positions) {
            foreach ($positions as $item) {
                Deal::where('id', $item['id'])
                    ->where('pipeline_stage_id', $stageId)
                    ->update(['position' => $item['position']]);
            }
        });
    }

    /**
     * Record stage transition history
     */
    protected function recordStageHistory(Deal $deal, ?int $fromStageId, int $toStageId): void
    {
        // Close previous stage history entry
        if ($fromStageId) {
            DealStageHistory::where('deal_id', $deal->id)
                ->where('pipeline_stage_id', $fromStageId)
                ->whereNull('exited_at')
                ->update(['exited_at' => now()]);
        }

        // Create new stage history entry
        DealStageHistory::create([
            'deal_id' => $deal->id,
            'pipeline_stage_id' => $toStageId,
            'entered_at' => now(),
            'entered_by' => Auth::id(),
        ]);
    }

    /**
     * Log deal activity
     *
     * @param  array<string, mixed>  $data
     */
    protected function logActivity(Deal $deal, string $type, array $data = []): void
    {
        DealActivity::create([
            'deal_id' => $deal->id,
            'user_id' => Auth::id(),
            'type' => $type,
            'description' => $this->getActivityDescription($type, $data),
            'data' => $data,
        ]);
    }

    /**
     * Generate human-readable activity description
     *
     * @param  array<string, mixed>  $data
     */
    protected function getActivityDescription(string $type, array $data): string
    {
        return match ($type) {
            'created' => 'Deal was created',
            'updated' => 'Deal details were updated',
            'stage_changed' => sprintf(
                'Moved from "%s" to "%s"',
                $data['from_stage_name'] ?? 'Unknown',
                $data['to_stage_name'] ?? 'Unknown'
            ),
            'marked_lost' => 'Deal was marked as lost',
            'reopened' => sprintf('Deal was reopened to "%s" stage', $data['stage'] ?? 'Unknown'),
            default => ucfirst(str_replace('_', ' ', $type)),
        };
    }

    /**
     * Get pipeline statistics
     *
     * @return array<string, mixed>
     */
    public function getPipelineStats(int $pipelineId): array
    {
        $pipeline = Pipeline::findOrFail($pipelineId);

        $deals = Deal::where('pipeline_id', $pipelineId)->get();

        $openDeals = $deals->where('status', 'open');
        $wonDeals = $deals->where('status', 'won');
        $lostDeals = $deals->where('status', 'lost');

        $avgDealValue = $openDeals->avg('value') ?? 0;
        $avgWonValue = $wonDeals->avg('actual_value') ?? $wonDeals->avg('value') ?? 0;

        // Calculate conversion rate
        $closedDeals = $wonDeals->count() + $lostDeals->count();
        $conversionRate = $closedDeals > 0 ? ($wonDeals->count() / $closedDeals) * 100 : 0;

        // Calculate average time in pipeline for won deals
        $avgCycleTime = $wonDeals->avg(function ($deal) {
            return $deal->created_at->diffInDays($deal->closed_at);
        }) ?? 0;

        return [
            'open_deals' => $openDeals->count(),
            'open_value' => $openDeals->sum('value'),
            'weighted_value' => $openDeals->sum(fn ($d) => $d->value * ($d->probability / 100)),
            'won_deals' => $wonDeals->count(),
            'won_value' => $wonDeals->sum('actual_value') ?: $wonDeals->sum('value'),
            'lost_deals' => $lostDeals->count(),
            'lost_value' => $lostDeals->sum('value'),
            'conversion_rate' => round($conversionRate, 1),
            'avg_deal_value' => round($avgDealValue, 2),
            'avg_won_value' => round($avgWonValue, 2),
            'avg_cycle_time_days' => round($avgCycleTime, 1),
            'rotting_deals' => $openDeals->filter(fn ($d) => $d->is_rotting)->count(),
        ];
    }
}
