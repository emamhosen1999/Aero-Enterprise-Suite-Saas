<?php

namespace Aero\Quality\Services;

use Aero\Project\Models\BoqMeasurement;
use Aero\Quality\Models\NonConformanceReport;
use Aero\Quality\Models\QualityInspection;
use Aero\Rfi\Events\RfiApproved;
use Aero\Rfi\Events\RfiRejected;
use Aero\Rfi\Models\ChainageProgress;
use Aero\Rfi\Models\Rfi;

/**
 * QualityBOQIntegrationService
 * 
 * PATENTABLE: "Quality-gated payment certification for construction"
 * 
 * This service ensures that:
 * 1. BOQ Measurements can only be verified if Quality Inspection passes
 * 2. Payment is blocked if open NCRs exist
 * 3. Inspection pass triggers RfiApproved event
 */
class QualityBOQIntegrationService
{
    /**
     * Complete an inspection and trigger downstream workflows.
     * PATENTABLE: "Automated workflow trigger from geo-verified inspection"
     */
    public function completeInspection(
        QualityInspection $inspection,
        string $result,
        array $checklistResults,
        int $inspectorId
    ): array {
        // 1. Update inspection with results
        $inspection->update([
            'result' => $result,
            'checklist_results' => $checklistResults,
            'status' => 'completed',
        ]);

        // 2. Calculate compliance
        $inspection->calculateCompliance();

        // 3. Generate verification hash
        $hash = $inspection->generateVerificationHash();

        // 4. Trigger appropriate event based on result
        if ($result === QualityInspection::RESULT_PASS) {
            return $this->handlePassedInspection($inspection, $inspectorId);
        } else {
            return $this->handleFailedInspection($inspection, $inspectorId, $result);
        }
    }

    /**
     * Handle passed inspection - approve RFI and enable billing.
     */
    protected function handlePassedInspection(QualityInspection $inspection, int $inspectorId): array
    {
        $rfi = $inspection->rfi;

        if ($rfi) {
            // Update RFI status
            $rfi->update([
                'status' => Rfi::STATUS_COMPLETED,
                'inspection_result' => Rfi::INSPECTION_APPROVED,
            ]);

            // Dispatch RfiApproved event (triggers AutoMeasurementService)
            RfiApproved::dispatch(
                $rfi,
                $inspectorId,
                $inspection->result,
                [
                    'inspection_id' => $inspection->id,
                    'compliance_percentage' => $inspection->compliance_percentage,
                    'verification_hash' => $inspection->verification_hash,
                ]
            );
        }

        return [
            'success' => true,
            'message' => 'Inspection passed. RFI approved and measurement generated.',
            'inspection' => $inspection,
        ];
    }

    /**
     * Handle failed inspection - reject RFI and optionally create NCR.
     */
    protected function handleFailedInspection(
        QualityInspection $inspection,
        int $inspectorId,
        string $result
    ): array {
        $rfi = $inspection->rfi;
        $createNcr = $inspection->fail_count > 0 || $result === QualityInspection::RESULT_FAIL;

        if ($rfi) {
            // Update RFI status
            $rfi->update([
                'status' => Rfi::STATUS_REJECTED,
                'inspection_result' => Rfi::INSPECTION_REJECTED,
            ]);

            // Dispatch RfiRejected event (may create NCR)
            RfiRejected::dispatch(
                $rfi,
                $inspectorId,
                "Inspection failed with {$inspection->fail_count} non-conforming items",
                $createNcr,
                [
                    'inspection_id' => $inspection->id,
                    'fail_count' => $inspection->fail_count,
                    'severity' => $this->determineSeverityFromFailures($inspection),
                ]
            );

            // Update ChainageProgress to rejected
            ChainageProgress::query()
                ->where('daily_work_id', $rfi->id)
                ->update(['status' => ChainageProgress::STATUS_REJECTED]);
        }

        return [
            'success' => true,
            'message' => 'Inspection failed. RFI rejected and NCR created.',
            'inspection' => $inspection,
            'ncr_created' => $createNcr,
        ];
    }

    /**
     * Verify a BOQ Measurement based on Quality Inspection.
     * PATENTABLE: "Quality-verified billing authorization"
     */
    public function verifyMeasurement(BoqMeasurement $measurement, int $userId): bool
    {
        $rfi = $measurement->rfi;

        if (! $rfi) {
            return false;
        }

        // Check for passed inspection
        $passedInspection = QualityInspection::query()
            ->where('daily_work_id', $rfi->id)
            ->passed()
            ->geoVerified()
            ->exists();

        if (! $passedInspection) {
            return false;
        }

        // Check for blocking NCRs
        $workLocation = $rfi->workLocation;
        if ($workLocation) {
            $blockingNcrs = NonConformanceReport::query()
                ->byProject($rfi->project_id)
                ->inChainageRange($workLocation->start_chainage_m, $workLocation->end_chainage_m)
                ->blocking()
                ->exists();

            if ($blockingNcrs) {
                return false;
            }
        }

        // Verify the measurement
        $measurement->update([
            'status' => 'verified',
            'verified_by_user_id' => $userId,
            'verified_at' => now(),
        ]);

        return true;
    }

    /**
     * Check if a chainage can be billed (no blocking NCRs, inspection passed).
     * PATENTABLE: "Spatially-verified payment authorization"
     */
    public function canBillChainage(int $projectId, float $startM, float $endM): array
    {
        $blockers = [];

        // Check for blocking NCRs
        $blockingNcrs = NonConformanceReport::query()
            ->byProject($projectId)
            ->inChainageRange($startM, $endM)
            ->blocking()
            ->get();

        foreach ($blockingNcrs as $ncr) {
            $blockers[] = [
                'type' => 'ncr',
                'id' => $ncr->id,
                'number' => $ncr->ncr_number,
                'reason' => "Open NCR blocks payment: {$ncr->title}",
            ];
        }

        // Check for pending inspections
        $pendingInspections = QualityInspection::query()
            ->byProject($projectId)
            ->inChainageRange($startM, $endM)
            ->whereIn('status', ['pending', 'in_progress'])
            ->get();

        foreach ($pendingInspections as $inspection) {
            $blockers[] = [
                'type' => 'inspection',
                'id' => $inspection->id,
                'number' => $inspection->inspection_number,
                'reason' => 'Pending inspection must be completed',
            ];
        }

        return [
            'can_bill' => empty($blockers),
            'blockers' => $blockers,
        ];
    }

    /**
     * Determine NCR severity from inspection failures.
     */
    protected function determineSeverityFromFailures(QualityInspection $inspection): string
    {
        $failPercent = 100 - ($inspection->compliance_percentage ?? 100);

        if ($failPercent >= 50) {
            return 'critical';
        } elseif ($failPercent >= 30) {
            return 'high';
        } elseif ($failPercent >= 10) {
            return 'medium';
        }

        return 'low';
    }
}
