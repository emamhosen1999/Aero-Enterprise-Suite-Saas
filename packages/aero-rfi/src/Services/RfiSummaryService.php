<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\Rfi;
use Carbon\Carbon;

/**
 * RfiSummaryService
 *
 * Service for generating RFI summaries.
 */
class RfiSummaryService
{
    /**
     * Generate summary for a specific date and optionally a specific incharge
     */
    public function generateSummaryForDate(string $date, ?int $inchargeId = null): array
    {
        $query = Rfi::whereDate('date', $date);

        if ($inchargeId) {
            $query->where('incharge_user_id', $inchargeId);
        }

        $rfis = $query->get();

        return $this->calculateSummary($rfis, $date);
    }

    /**
     * Generate summary for a date range
     */
    public function generateSummaryForDateRange(string $startDate, string $endDate, ?int $inchargeId = null): array
    {
        $summaries = [];
        $current = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($current <= $end) {
            $dateStr = $current->format('Y-m-d');
            $summaries[$dateStr] = $this->generateSummaryForDate($dateStr, $inchargeId);
            $current->addDay();
        }

        return $summaries;
    }

    /**
     * Calculate summary from RFIs collection
     */
    private function calculateSummary($rfis, string $date): array
    {
        if ($rfis->isEmpty()) {
            return [
                'date' => $date,
                'totalRfis' => 0,
                'completed' => 0,
                'pending' => 0,
                'rfiSubmissions' => 0,
                'completionPercentage' => 0,
                'rfiSubmissionPercentage' => 0,
                'embankment' => 0,
                'structure' => 0,
                'pavement' => 0,
                'resubmissions' => 0,
            ];
        }

        $totalRfis = $rfis->count();
        $completed = $rfis->where('status', Rfi::STATUS_COMPLETED)->count();
        $rfiSubmissions = $rfis->whereNotNull('rfi_submission_date')->count();
        $resubmissions = $rfis->where('resubmission_count', '>', 0)->count();

        return [
            'date' => $date,
            'totalRfis' => $totalRfis,
            'completed' => $completed,
            'pending' => $totalRfis - $completed,
            'rfiSubmissions' => $rfiSubmissions,
            'completionPercentage' => $totalRfis > 0 ? round(($completed / $totalRfis) * 100, 1) : 0,
            'rfiSubmissionPercentage' => $totalRfis > 0 ? round(($rfiSubmissions / $totalRfis) * 100, 1) : 0,
            'embankment' => $rfis->where('type', Rfi::TYPE_EMBANKMENT)->count(),
            'structure' => $rfis->where('type', Rfi::TYPE_STRUCTURE)->count(),
            'pavement' => $rfis->where('type', Rfi::TYPE_PAVEMENT)->count(),
            'resubmissions' => $resubmissions,
        ];
    }

    /**
     * Get summary statistics for display
     */
    public function calculateDisplayMetrics(array $summaries): array
    {
        $totalRfis = collect($summaries)->sum('totalRfis');
        $totalCompleted = collect($summaries)->sum('completed');
        $totalPending = collect($summaries)->sum('pending');
        $totalRFI = collect($summaries)->sum('rfiSubmissions');
        $avgCompletion = $totalRfis > 0 ? round(($totalCompleted / $totalRfis) * 100, 1) : 0;

        return [
            'totalRfis' => $totalRfis,
            'totalCompleted' => $totalCompleted,
            'totalPending' => $totalPending,
            'totalRFI' => $totalRFI,
            'avgCompletion' => $avgCompletion,
        ];
    }

    /**
     * Generate summary grouped by incharge
     */
    public function generateSummaryByIncharge(string $date): array
    {
        $rfis = Rfi::whereDate('date', $date)
            ->with('inchargeUser:id,name')
            ->get();

        $grouped = $rfis->groupBy('incharge_user_id');
        $summaries = [];

        foreach ($grouped as $inchargeId => $inchargeRfis) {
            $inchargeName = $inchargeRfis->first()->inchargeUser?->name ?? 'Unknown';

            $summaries[] = array_merge(
                $this->calculateSummary($inchargeRfis, $date),
                [
                    'incharge_user_id' => $inchargeId,
                    'incharge_name' => $inchargeName,
                ]
            );
        }

        return $summaries;
    }
}
