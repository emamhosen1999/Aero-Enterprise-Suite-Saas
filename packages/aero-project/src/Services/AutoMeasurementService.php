<?php

namespace Aero\Project\Services;

use Aero\Project\Models\BoqItem;
use Aero\Project\Models\BoqMeasurement;
use Aero\Rfi\Events\RfiApproved;
use Aero\Rfi\Models\ChainageProgress;
use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLayer;

/**
 * AutoMeasurementService
 *
 * PATENTABLE: "Automated quantity calculation from approved RFI spatial data"
 *
 * This service:
 * 1. Listens for RfiApproved events
 * 2. Calculates quantity based on chainage length and work dimensions
 * 3. Creates BoqMeasurement linked to the approved RFI
 * 4. Updates ChainageProgress to 'approved'
 */
class AutoMeasurementService
{
    /**
     * Handle RFI approval and generate measurement.
     */
    public function handleRfiApproval(RfiApproved $event): ?BoqMeasurement
    {
        $rfi = $event->rfi;
        $workLocation = $rfi->workLocation;

        if (! $workLocation) {
            return null;
        }

        // Get the work layer for this RFI type
        $workLayer = $this->determineWorkLayer($rfi);
        if (! $workLayer) {
            return null;
        }

        // Find matching BOQ item
        $boqItem = $this->findMatchingBoqItem($rfi, $workLayer);
        if (! $boqItem) {
            return null;
        }

        // Calculate dimensions and quantity
        $dimensions = $this->calculateDimensions($rfi, $workLocation);
        $quantity = $this->calculateQuantity($dimensions, $boqItem->unit);

        // Create the measurement
        $measurement = BoqMeasurement::create([
            'boq_item_id' => $boqItem->id,
            'daily_work_id' => $rfi->id,
            'measured_quantity' => $quantity,
            'formula' => $this->getFormula($boqItem->unit),
            'dimensions' => $dimensions,
            'location_description' => $this->formatChainageRange(
                $workLocation->start_chainage_m,
                $workLocation->end_chainage_m
            ),
            'status' => 'verified', // Auto-verified because inspection passed
            'verified_by_user_id' => $event->approvedByUserId,
            'verified_at' => now(),
        ]);

        // Update ChainageProgress
        $this->updateChainageProgress($rfi, $workLayer, $measurement, $event->approvedByUserId);

        return $measurement;
    }

    /**
     * Calculate dimensions from RFI and work location.
     * PATENTABLE: "Automatic dimension extraction from chainage data"
     *
     * @return array{length: float, width: float, depth: float, area: float, volume: float}
     */
    protected function calculateDimensions(Rfi $rfi, $workLocation): array
    {
        // Length from chainage (in meters)
        $length = ($workLocation->end_chainage_m ?? 0) - ($workLocation->start_chainage_m ?? 0);

        // Width from offset or from RFI metadata
        $width = ($workLocation->offset_right ?? 0) + ($workLocation->offset_left ?? 0);
        if ($width <= 0) {
            // Default road width assumption or from RFI
            $width = $rfi->getAttribute('width') ?? 10.0; // 10m default
        }

        // Depth/Height from RFI layer info
        $depth = $rfi->getAttribute('layer_thickness') ?? $rfi->getAttribute('depth') ?? 0.3;

        return [
            'length' => round($length, 3),
            'width' => round($width, 3),
            'depth' => round($depth, 3),
            'area' => round($length * $width, 3),
            'volume' => round($length * $width * $depth, 3),
        ];
    }

    /**
     * Calculate quantity based on unit type.
     * PATENTABLE: "Unit-aware quantity derivation from spatial measurements"
     */
    protected function calculateQuantity(array $dimensions, string $unit): float
    {
        $unit = strtolower($unit);

        return match ($unit) {
            'm3', 'cum', 'cubic meter' => $dimensions['volume'],
            'sqm', 'm2', 'square meter' => $dimensions['area'],
            'rm', 'm', 'running meter', 'meter' => $dimensions['length'],
            'nos', 'no', 'number' => 1,
            default => $dimensions['volume'], // Default to volume
        };
    }

    /**
     * Get formula string based on unit.
     */
    protected function getFormula(string $unit): string
    {
        $unit = strtolower($unit);

        return match ($unit) {
            'm3', 'cum', 'cubic meter' => 'L × W × D',
            'sqm', 'm2', 'square meter' => 'L × W',
            'rm', 'm', 'running meter', 'meter' => 'L',
            default => 'L × W × D',
        };
    }

    /**
     * Determine work layer from RFI type.
     */
    protected function determineWorkLayer(Rfi $rfi): ?WorkLayer
    {
        // Try to find layer from RFI attributes
        if ($rfi->work_layer_id) {
            return WorkLayer::find($rfi->work_layer_id);
        }

        // Match by RFI type
        $type = $rfi->type ?? '';
        $layerMatch = match ($type) {
            'Embankment' => 'EMB%',
            'Structure' => 'STR%',
            'Pavement' => 'PAV%',
            default => null,
        };

        if ($layerMatch) {
            return WorkLayer::query()
                ->where('code', 'LIKE', $layerMatch)
                ->where(function ($q) use ($rfi) {
                    $q->where('project_id', $rfi->project_id)
                        ->orWhereNull('project_id');
                })
                ->active()
                ->first();
        }

        return null;
    }

    /**
     * Find matching BOQ item for the RFI and layer.
     */
    protected function findMatchingBoqItem(Rfi $rfi, WorkLayer $layer): ?BoqItem
    {
        // Try to match by layer code
        return BoqItem::query()
            ->where('project_id', $rfi->project_id)
            ->where(function ($q) use ($layer) {
                $q->where('item_code', 'LIKE', '%'.$layer->code.'%')
                    ->orWhere('description', 'LIKE', '%'.$layer->name.'%');
            })
            ->first();
    }

    /**
     * Update ChainageProgress to approved status.
     */
    protected function updateChainageProgress(
        Rfi $rfi,
        WorkLayer $workLayer,
        BoqMeasurement $measurement,
        int $approvedByUserId
    ): void {
        $workLocation = $rfi->workLocation;

        $progress = ChainageProgress::query()
            ->where('daily_work_id', $rfi->id)
            ->first();

        if ($progress) {
            $progress->update([
                'status' => ChainageProgress::STATUS_APPROVED,
                'boq_measurement_id' => $measurement->id,
                'approved_at' => now(),
                'approved_by_user_id' => $approvedByUserId,
            ]);
        } else {
            // Create new progress record
            ChainageProgress::create([
                'project_id' => $rfi->project_id ?? $workLocation?->project_id,
                'work_layer_id' => $workLayer->id,
                'start_chainage_m' => $workLocation?->start_chainage_m ?? 0,
                'end_chainage_m' => $workLocation?->end_chainage_m ?? 0,
                'status' => ChainageProgress::STATUS_APPROVED,
                'daily_work_id' => $rfi->id,
                'boq_measurement_id' => $measurement->id,
                'rfi_submitted_at' => $rfi->created_at,
                'approved_at' => now(),
                'approved_by_user_id' => $approvedByUserId,
            ]);
        }
    }

    /**
     * Format chainage range for display.
     */
    protected function formatChainageRange(?float $startM, ?float $endM): string
    {
        if (! $startM && ! $endM) {
            return 'N/A';
        }

        $formatCh = function (float $meters): string {
            $km = floor($meters / 1000);
            $m = $meters - ($km * 1000);

            return sprintf('%d+%03d', $km, $m);
        };

        return sprintf('CH %s - %s', $formatCh($startM ?? 0), $formatCh($endM ?? 0));
    }
}
