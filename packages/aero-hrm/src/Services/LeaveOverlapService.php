<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Holiday;
use Aero\HRM\Models\Leave;
use Carbon\Carbon;

class LeaveOverlapService
{
    /**
     * Check for overlapping leaves for a user
     */
    public function checkOverlappingLeaves(int $userId, Carbon $fromDate, Carbon $toDate, ?int $excludeLeaveId = null): array
    {
        $query = Leave::with('employee')
            ->join('leave_settings', 'leaves.leave_type', '=', 'leave_settings.id')
            ->select('leaves.*', 'leave_settings.type as leave_type')
            ->where('leaves.user_id', $userId)
            ->where(function ($q) use ($fromDate, $toDate) {
                $q->whereBetween('from_date', [$fromDate, $toDate])
                    ->orWhereBetween('to_date', [$fromDate, $toDate])
                    ->orWhere(function ($q) use ($fromDate, $toDate) {
                        $q->where('from_date', '<=', $fromDate)
                            ->where('to_date', '>=', $toDate);
                    });
            });

        if ($excludeLeaveId) {
            $query->where('id', '!=', $excludeLeaveId);
        }

        $overlapping = $query->get();

        if ($overlapping->isEmpty()) {
            return [];
        }

        return $overlapping->map(function ($leave) {
            // Convert string dates to Carbon instances if they're not already
            $fromDate = $leave->from_date instanceof Carbon ? $leave->from_date : new Carbon($leave->from_date);
            $toDate = $leave->to_date instanceof Carbon ? $leave->to_date : new Carbon($leave->to_date);

            return $fromDate->equalTo($toDate)
                ? "\"{$leave->leave_type}\" leave already exists for: ".$fromDate->format('Y-m-d')
                : "\"{$leave->leave_type}\" leave already exists from ".$fromDate->format('Y-m-d').' to '.$toDate->format('Y-m-d');
        })->toArray();
    }

    public function checkOverLappingHoliday(Carbon $fromDate, Carbon $toDate, ?int $excludeHolidayId = null): array
    {
        $query = Holiday::where(function ($q) use ($fromDate, $toDate) {
            $q->whereBetween('from_date', [$fromDate, $toDate])
                ->orWhereBetween('to_date', [$fromDate, $toDate])
                ->orWhere(function ($q) use ($fromDate, $toDate) {
                    $q->where('from_date', '<=', $fromDate)
                        ->where('to_date', '>=', $toDate);
                });
        });

        if ($excludeHolidayId) {
            $query->where('id', '!=', $excludeHolidayId);
        }

        $overlapping = $query->get();

        if ($overlapping->isEmpty()) {
            return [];
        }

        return $overlapping->map(function ($holiday) {
            // Convert string dates to Carbon instances if they're not already
            $fromDate = $holiday->from_date instanceof Carbon ? $holiday->from_date : new Carbon($holiday->from_date);
            $toDate = $holiday->to_date instanceof Carbon ? $holiday->to_date : new Carbon($holiday->to_date);

            return $fromDate->equalTo($toDate)
                ? "\"{$holiday->title}\" holiday on this date: ".$fromDate->format('Y-m-d')
                : "\"{$holiday->title}\" holiday on this dates: ".$fromDate->format('Y-m-d').' to '.$toDate->format('Y-m-d');
        })->toArray();
    }

    /**
     * Check if there are any overlapping leaves and return error message
     */
    public function getOverlapErrorMessage(int $userId, Carbon $fromDate, Carbon $toDate, ?int $excludeLeaveId = null): ?string
    {
        $overlapsLeave = $this->checkOverlappingLeaves($userId, $fromDate, $toDate, $excludeLeaveId);
        $overlapsHoliday = $this->checkOverLappingHoliday($fromDate, $toDate, $excludeLeaveId);

        $overlaps = array_merge($overlapsLeave, $overlapsHoliday);

        return empty($overlaps) ? null : implode(', ', $overlaps);
    }
}
