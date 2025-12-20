<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\Objection;
use Aero\Rfi\Models\WorkLocation;

/**
 * RfiService
 *
 * Main service for RFI module providing aggregate operations and statistics.
 */
class RfiService
{
    /**
     * Get RFI dashboard statistics.
     *
     * @return array<string, mixed>
     */
    public function getDashboardStats(): array
    {
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        return [
            'daily_works' => [
                'total' => DailyWork::count(),
                'today' => DailyWork::whereDate('date', $today)->count(),
                'this_week' => DailyWork::where('date', '>=', $thisWeek)->count(),
                'this_month' => DailyWork::where('date', '>=', $thisMonth)->count(),
                'pending' => DailyWork::pending()->count(),
                'completed' => DailyWork::completed()->count(),
                'with_objections' => DailyWork::withActiveObjections()->count(),
            ],
            'objections' => [
                'total' => Objection::count(),
                'active' => Objection::active()->count(),
                'resolved' => Objection::resolved()->count(),
                'by_category' => Objection::selectRaw('category, count(*) as count')
                    ->groupBy('category')
                    ->pluck('count', 'category')
                    ->toArray(),
            ],
            'work_locations' => [
                'total' => WorkLocation::count(),
                'active' => WorkLocation::active()->count(),
            ],
        ];
    }

    /**
     * Get daily work summary for a date range.
     *
     * @return array<string, mixed>
     */
    public function getDailyWorkSummary(?string $startDate = null, ?string $endDate = null): array
    {
        $query = DailyWork::query();

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        return [
            'total' => $query->count(),
            'by_status' => (clone $query)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_type' => (clone $query)
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
            'by_inspection_result' => (clone $query)
                ->whereNotNull('inspection_result')
                ->selectRaw('inspection_result, count(*) as count')
                ->groupBy('inspection_result')
                ->pluck('count', 'inspection_result')
                ->toArray(),
            'rfi_submitted' => (clone $query)->withRFI()->count(),
            'resubmissions' => (clone $query)->resubmissions()->count(),
        ];
    }

    /**
     * Get work completion rate.
     */
    public function getCompletionRate(?string $startDate = null, ?string $endDate = null): float
    {
        $query = DailyWork::query();

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        $total = $query->count();

        if ($total === 0) {
            return 0.0;
        }

        $completed = (clone $query)->completed()->count();

        return round(($completed / $total) * 100, 2);
    }

    /**
     * Get objection resolution rate.
     */
    public function getObjectionResolutionRate(): float
    {
        $total = Objection::count();

        if ($total === 0) {
            return 0.0;
        }

        $resolved = Objection::resolved()->count();

        return round(($resolved / $total) * 100, 2);
    }

    /**
     * Get pending work locations with active objections.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getLocationsPendingReview()
    {
        return WorkLocation::query()
            ->active()
            ->whereHas('dailyWorks', function ($query) {
                $query->pending();
            })
            ->withCount(['dailyWorks' => function ($query) {
                $query->pending();
            }])
            ->orderByDesc('daily_works_count')
            ->get();
    }
}
