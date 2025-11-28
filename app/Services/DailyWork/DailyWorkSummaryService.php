<?php

namespace App\Services\DailyWork;

use App\Models\DailyWork;
use App\Models\DailyWorkSummary;
use Carbon\Carbon;

class DailyWorkSummaryService
{
    /**
     * Generate summary for a specific date and optionally a specific incharge
     */
    public function generateSummaryForDate(string $date, ?int $inchargeId = null): void
    {
        $query = DailyWork::whereDate('date', $date);

        if ($inchargeId) {
            $query->where('incharge', $inchargeId);
            $this->generateSummaryForIncharge($date, $inchargeId);
        } else {
            $incharges = DailyWork::whereDate('date', $date)
                ->distinct()
                ->pluck('incharge');

            foreach ($incharges as $inchargeId) {
                $this->generateSummaryForIncharge($date, $inchargeId);
            }
        }
    }

    /**
     * Generate summary for a specific incharge on a specific date
     */
    private function generateSummaryForIncharge(string $date, int $inchargeId): void
    {
        $works = DailyWork::whereDate('date', $date)
            ->where('incharge', $inchargeId)
            ->get();

        if ($works->isEmpty()) {
            // Delete summary if no works exist
            DailyWorkSummary::where('date', $date)
                ->where('incharge', $inchargeId)
                ->delete();

            return;
        }

        $summary = [
            'totalDailyWorks' => $works->count(),
            'resubmissions' => $works->where('resubmission_count', '>', 0)->count(),
            'embankment' => $works->where('type', 'Embankment')->count(),
            'structure' => $works->where('type', 'Structure')->count(),
            'pavement' => $works->where('type', 'Pavement')->count(),
        ];

        DailyWorkSummary::updateOrCreate(
            ['date' => $date, 'incharge' => $inchargeId],
            $summary
        );
    }

    /**
     * Refresh summaries for a date range
     */
    public function refreshSummariesForDateRange(string $startDate, string $endDate): void
    {
        $dates = [];
        $current = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($current <= $end) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }

        foreach ($dates as $date) {
            $this->generateSummaryForDate($date);
        }
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
}
