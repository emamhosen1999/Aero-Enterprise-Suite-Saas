<?php

namespace Aero\Rfi\Traits;

use Aero\Rfi\Models\WorkLocation;

/**
 * Trait for common Daily Work filtering functionality.
 * Extracted from DailyWorkController, DailyWorkSummaryController, and DailyWorkPaginationService.
 */
trait DailyWorkFilterable
{
    /**
     * Normalize filter values (IDs) to a clean array of integers.
     * Handles null, empty strings, 'all', arrays, and single values.
     *
     * @param  mixed  $value  The filter value to normalize
     * @return array<int> Array of integer IDs
     */
    protected function normalizeIdFilter($value): array
    {
        if ($value === null || $value === '' || $value === 'all') {
            return [];
        }

        $ids = is_array($value) ? $value : [$value];

        return collect($ids)
            ->reject(fn ($id) => $id === null || $id === '' || $id === 'all')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Apply incharge and/or work location filters to a query.
     * If incharge is provided, filter by incharge directly.
     * If only work location is provided, find incharges for those locations.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query  The query builder
     * @param  array<int>  $inchargeFilter  Array of incharge user IDs
     * @param  array<int>  $workLocationFilter  Array of work location IDs
     */
    protected function applyInchargeWorkLocationFilters($query, array $inchargeFilter, array $workLocationFilter): void
    {
        // If incharge filter is provided, use it directly
        if (! empty($inchargeFilter)) {
            $query->whereIn('incharge_user_id', $inchargeFilter);

            return;
        }

        // If no work location filter, nothing to apply
        if (empty($workLocationFilter)) {
            return;
        }

        // Get incharges from the specified work locations
        $locationIncharges = WorkLocation::whereIn('id', $workLocationFilter)
            ->whereNotNull('incharge_user_id')
            ->pluck('incharge_user_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if (! empty($locationIncharges)) {
            $query->whereIn('incharge_user_id', $locationIncharges);

            return;
        }

        // If work locations exist but have no associated incharge users, force empty result
        $query->whereRaw('1 = 0');
    }

    /**
     * Apply date range filter to a query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query  The query builder
     * @param  string|null  $startDate  Start date (Y-m-d format)
     * @param  string|null  $endDate  End date (Y-m-d format)
     */
    protected function applyDateRangeFilter($query, ?string $startDate, ?string $endDate): void
    {
        if ($startDate && $endDate) {
            // For single date (mobile mode), use exact match for better performance
            if ($startDate === $endDate) {
                $query->whereDate('date', $startDate);
            } else {
                $query->whereBetween('date', [$startDate, $endDate]);
            }
        } elseif ($startDate) {
            $query->whereDate('date', '>=', $startDate);
        } elseif ($endDate) {
            $query->whereDate('date', '<=', $endDate);
        }
    }

    /**
     * Apply month filter to a query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query  The query builder
     * @param  string|null  $month  Month in Y-m format
     */
    protected function applyMonthFilter($query, ?string $month): void
    {
        if ($month) {
            $startDate = date('Y-m-01', strtotime($month));
            $endDate = date('Y-m-t', strtotime($month));
            $query->whereBetween('date', [$startDate, $endDate]);
        }
    }

    /**
     * Apply status filter to a query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query  The query builder
     * @param  string|null  $status  Status value
     */
    protected function applyStatusFilter($query, ?string $status): void
    {
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
    }

    /**
     * Apply search filter to a query.
     * Searches in number, location, and description fields.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query  The query builder
     * @param  string|null  $search  Search term
     */
    protected function applySearchFilter($query, ?string $search): void
    {
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'LIKE', "%{$search}%")
                    ->orWhere('location', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }
    }

    /**
     * Apply type filter to a query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query  The query builder
     * @param  string|null  $type  Type value
     */
    protected function applyTypeFilter($query, ?string $type): void
    {
        if ($type && $type !== 'all') {
            $query->where('type', $type);
        }
    }
}
