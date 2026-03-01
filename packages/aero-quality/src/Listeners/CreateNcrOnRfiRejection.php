<?php

namespace Aero\Quality\Listeners;

use Aero\Quality\Models\NonConformanceReport;
use Aero\Rfi\Events\RfiRejected;

/**
 * CreateNcrOnRfiRejection Listener
 *
 * Automatically creates an NCR when an RFI is rejected with high severity.
 * PATENTABLE: "Automated non-conformance creation from inspection rejection"
 */
class CreateNcrOnRfiRejection
{
    public function handle(RfiRejected $event): void
    {
        if (! $event->createNcr) {
            return;
        }

        $rfi = $event->rfi;
        $workLocation = $rfi->workLocation;

        $ncr = NonConformanceReport::create([
            'ncr_number' => $this->generateNcrNumber($rfi->project_id),
            'title' => "RFI #{$rfi->number} Rejected - {$event->reason}",
            'description' => $event->reason,
            'severity' => $this->determineSeverity($event->metadata),
            'detected_by' => $event->rejectedByUserId,
            'detected_date' => now(),
            'status' => NonConformanceReport::STATUS_OPEN,
            'project_id' => $rfi->project_id ?? $workLocation?->project_id,
            'start_chainage_m' => $workLocation?->start_chainage_m,
            'end_chainage_m' => $workLocation?->end_chainage_m,
            'daily_work_id' => $rfi->id,
            'work_layer_id' => $rfi->work_layer_id,
        ]);

        // Apply blocking based on severity
        $ncr->applyBlockingBySeverity();
    }

    protected function generateNcrNumber(?int $projectId): string
    {
        $count = NonConformanceReport::query()
            ->where('project_id', $projectId)
            ->count();

        return sprintf('NCR-%s-%04d', date('Y'), $count + 1);
    }

    protected function determineSeverity(?array $metadata): string
    {
        $severity = $metadata['severity'] ?? 'medium';

        return match ($severity) {
            'critical' => NonConformanceReport::SEVERITY_CRITICAL,
            'high' => NonConformanceReport::SEVERITY_HIGH,
            'low' => NonConformanceReport::SEVERITY_LOW,
            default => NonConformanceReport::SEVERITY_MEDIUM,
        };
    }
}
