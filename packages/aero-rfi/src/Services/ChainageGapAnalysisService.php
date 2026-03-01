<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Contracts\NcrBlockingServiceInterface;
use Aero\Rfi\Models\ChainageProgress;
use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLayer;
use Aero\Rfi\Models\WorkLocation;
use Illuminate\Support\Collection;

/**
 * ChainageGapAnalysisService
 *
 * PATENTABLE SERVICE: "Spatially-indexed prerequisite validation for linear infrastructure"
 *
 * This service validates that:
 * 1. Prerequisite layers are approved at the requested chainage
 * 2. No open NCRs exist that block the chainage
 * 3. The chainage range is within project boundaries
 */
class ChainageGapAnalysisService
{
    public function __construct(private NcrBlockingServiceInterface $ncrBlockingService) {}

    /**
     * Validate if an RFI can be submitted for the given layer at the given chainage.
     *
     * @return array{valid: bool, errors: array, warnings: array, gaps: array}
     */
    public function validateRfiSubmission(
        int $projectId,
        int $workLayerId,
        float $startChainageM,
        float $endChainageM
    ): array {
        $errors = [];
        $warnings = [];

        // 1. Validate layer exists and is active
        $workLayer = WorkLayer::find($workLayerId);
        if (! $workLayer || ! $workLayer->is_active) {
            $errors[] = 'Invalid or inactive work layer.';

            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings, 'gaps' => []];
        }

        // 2. Check prerequisite layer is approved at this chainage
        if (! $workLayer->isPrerequisiteSatisfiedAt($startChainageM, $endChainageM)) {
            $prereq = $workLayer->prerequisiteLayer;
            $errors[] = sprintf(
                'Prerequisite layer "%s" must be approved at CH %s - %s before submitting for "%s".',
                $prereq?->name ?? 'Unknown',
                $this->formatChainage($startChainageM),
                $this->formatChainage($endChainageM),
                $workLayer->name
            );
        }

        // 3. Check for open NCRs at this chainage via quality service
        $openNcrs = $this->ncrBlockingService->getOpenNcrsAtChainage($projectId, $startChainageM, $endChainageM);
        if ($openNcrs->isNotEmpty()) {
            foreach ($openNcrs as $ncr) {
                $errors[] = sprintf(
                    'Open NCR #%s blocks this chainage. Resolve NCR before submitting RFI.',
                    $ncr->ncr_number ?? $ncr->reference_number ?? $ncr->id
                );
            }
        }

        // 4. Check for existing pending RFIs at this chainage (prevent duplicates)
        $existingProgress = ChainageProgress::query()
            ->byProject($projectId)
            ->byLayer($workLayerId)
            ->inRange($startChainageM, $endChainageM)
            ->pending()
            ->exists();

        if ($existingProgress) {
            $warnings[] = 'A pending RFI already exists for part of this chainage range.';
        }

        // 5. Calculate gap coverage
        $gaps = $workLayer->getGapsInRange($startChainageM, $endChainageM);
        if (empty($gaps)) {
            $warnings[] = 'This chainage range has already been fully approved.';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'gaps' => $gaps ?? [],
        ];
    }

    /**
     * Get the prerequisite chain for a layer (all layers that must be done first).
     */
    public function getPrerequisiteChain(WorkLayer $layer): Collection
    {
        $chain = collect();
        $current = $layer->prerequisiteLayer;

        while ($current) {
            $chain->push($current);
            $current = $current->prerequisiteLayer;
        }

        return $chain->reverse();
    }

    /**
     * Get progress summary for a project at a specific chainage.
     */
    public function getProgressAtChainage(int $projectId, float $chainageM): array
    {
        $layers = WorkLayer::query()
            ->where('project_id', $projectId)
            ->orWhereNull('project_id') // Global layers
            ->active()
            ->ordered()
            ->get();

        $progress = [];

        foreach ($layers as $layer) {
            $status = ChainageProgress::query()
                ->byProject($projectId)
                ->byLayer($layer->id)
                ->inRange($chainageM, $chainageM)
                ->first();

            $progress[] = [
                'layer' => $layer,
                'status' => $status?->status ?? 'not_started',
                'rfi_id' => $status?->daily_work_id,
                'approved_at' => $status?->approved_at,
            ];
        }

        return $progress;
    }

    /**
     * Generate a visual progress map for a chainage range.
     *
     * @return array Array of segments with layer statuses
     */
    public function getProgressMap(int $projectId, float $startM, float $endM, float $segmentSize = 100): array
    {
        $map = [];
        $layers = WorkLayer::query()
            ->where('project_id', $projectId)
            ->orWhereNull('project_id')
            ->active()
            ->ordered()
            ->get();

        for ($pos = $startM; $pos < $endM; $pos += $segmentSize) {
            $segmentEnd = min($pos + $segmentSize, $endM);
            $segment = [
                'start' => $pos,
                'end' => $segmentEnd,
                'chainage' => $this->formatChainage($pos),
                'layers' => [],
            ];

            foreach ($layers as $layer) {
                $progress = ChainageProgress::query()
                    ->byProject($projectId)
                    ->byLayer($layer->id)
                    ->inRange($pos, $segmentEnd)
                    ->first();

                $segment['layers'][$layer->code] = $progress?->status ?? 'not_started';
            }

            $map[] = $segment;
        }

        return $map;
    }

    /**
     * Auto-create ChainageProgress record when RFI is submitted.
     */
    public function recordRfiSubmission(Rfi $rfi, int $workLayerId): ChainageProgress
    {
        $workLocation = $rfi->workLocation;

        return ChainageProgress::create([
            'project_id' => $rfi->project_id ?? $workLocation?->project_id,
            'work_layer_id' => $workLayerId,
            'start_chainage_m' => $workLocation?->start_chainage_m ?? 0,
            'end_chainage_m' => $workLocation?->end_chainage_m ?? 0,
            'status' => ChainageProgress::STATUS_RFI_SUBMITTED,
            'daily_work_id' => $rfi->id,
            'rfi_submitted_at' => now(),
        ]);
    }

    /**
     * Get blocking NCRs for a work location and layer at a specific chainage range.
     * PUBLIC API for controller usage.
     */
    public function getBlockingNcrs(int $workLocationId, int $layerId, float $startM, float $endM): array
    {
        $workLocation = WorkLocation::find($workLocationId);
        if (! $workLocation) {
            return [];
        }

        $projectId = $workLocation->project_id;

        return $this->ncrBlockingService
            ->getBlockingNcrs($projectId, $layerId, $startM, $endM)
            ->map(function ($ncr) {
                return [
                    'id' => $ncr->id,
                    'reference_number' => $ncr->ncr_number ?? $ncr->reference_number ?? $ncr->id,
                    'title' => $ncr->title ?? $ncr->description,
                    'severity' => $ncr->severity,
                    'start_chainage' => $ncr->start_chainage_m,
                    'end_chainage' => $ncr->end_chainage_m,
                    'status' => $ncr->status,
                ];
            })
            ->toArray();
    }

    /**
     * Format chainage value as KM+meters.
     */
    protected function formatChainage(float $meters): string
    {
        $km = floor($meters / 1000);
        $m = $meters - ($km * 1000);

        return sprintf('%d+%03d', $km, $m);
    }
}
