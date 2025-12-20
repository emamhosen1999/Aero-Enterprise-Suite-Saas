<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\DailyWork;
use Carbon\Carbon;

/**
 * DailyWorkSummaryService
 *
 * Service for generating Daily Work summaries.
 */
class DailyWorkSummaryService
{
    /**
     * Generate summary for a specific date and optionally a specific incharge
     */
    public function generateSummaryForDate(string $date, ?int $inchargeId = null): array
    {
        $query = DailyWork::whereDate('date', $date);

        if ($inchargeId) {
            $query->where('incharge_user_id', $inchargeId);
        }

        $works = $query->get();

        return $this->calculateSummary($works, $date);
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
     * Calculate summary from daily works collection
     */
    private function calculateSummary($works, string $date): array
    {
        if ($works->isEmpty()) {
            return [
                'date' => $date,
                'totalDailyWorks' => 0,
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

        $totalWorks = $works->count();
        $completed = $works->where('status', DailyWork::STATUS_COMPLETED)->count();
        $rfiSubmissions = $works->whereNotNull('rfi_submission_date')->count();
        $resubmissions = $works->where('resubmission_count', '>', 0)->count();

        return [
            'date' => $date,
            'totalDailyWorks' => $totalWorks,
            'completed' => $completed,
            'pending' => $totalWorks - $completed,
            'rfiSubmissions' => $rfiSubmissions,
            'completionPercentage' => $totalWorks > 0 ? round(($completed / $totalWorks) * 100, 1) : 0,
            'rfiSubmissionPercentage' => $totalWorks > 0 ? round(($rfiSubmissions / $totalWorks) * 100, 1) : 0,
            'embankment' => $works->where('type', DailyWork::TYPE_EMBANKMENT)->count(),
            'structure' => $works->where('type', DailyWork::TYPE_STRUCTURE)->count(),
            'pavement' => $works->where('type', DailyWork::TYPE_PAVEMENT)->count(),
            'resubmissions' => $resubmissions,
        ];
    }

    /**
     * Get summary statistics for display
     */
    public function calculateDisplayMetrics(array $summaries): array
    {
        $totalWorks = collect($summaries)->sum('totalDailyWorks');
        $totalCompleted = collect($summaries)->sum('completed');
        $totalPending = collect($summaries)->sum('pending');
        $totalRFI = collect($summaries)->sum('rfiSubmissions');
        $avgCompletion = $totalWorks > 0 ? round(($totalCompleted / $totalWorks) * 100, 1) : 0;

        return [
            'totalWorks' => $totalWorks,
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
        $works = DailyWork::whereDate('date', $date)
            ->with('inchargeUser:id,name')
            ->get();

        $grouped = $works->groupBy('incharge_user_id');
        $summaries = [];

        foreach ($grouped as $inchargeId => $inchargeWorks) {
            $inchargeName = $inchargeWorks->first()->inchargeUser?->name ?? 'Unknown';

            $summaries[] = array_merge(
                $this->calculateSummary($inchargeWorks, $date),
                [
                    'incharge_user_id' => $inchargeId,
                    'incharge_name' => $inchargeName,
                ]
            );
        }

        return $summaries;
    }
}
