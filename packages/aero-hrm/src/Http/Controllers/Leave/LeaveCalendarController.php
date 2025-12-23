<?php

namespace Aero\HRM\Http\Controllers\Leave;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Services\LeaveCalendarService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Leave Calendar Controller
 *
 * Handles team leave calendar views and availability management.
 */
class LeaveCalendarController extends Controller
{
    public function __construct(
        protected LeaveCalendarService $calendarService
    ) {}

    /**
     * Display the team calendar page.
     */
    public function index(Request $request): InertiaResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $departmentId = $request->input('department_id');

        $calendar = $this->calendarService->getTeamCalendar(
            $departmentId,
            $month,
            [
                'include_weekends' => $request->boolean('include_weekends'),
                'include_holidays' => true,
            ]
        );

        return Inertia::render('Pages/HRM/TimeOff/TeamCalendar', [
            'title' => 'Team Leave Calendar',
            'calendar' => $calendar,
            'selectedMonth' => $month,
            'selectedDepartment' => $departmentId,
        ]);
    }

    /**
     * Get calendar data via API.
     */
    public function getCalendarData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'department_id' => ['nullable', 'integer'],
            'include_weekends' => ['nullable', 'boolean'],
            'group_by' => ['nullable', 'in:date,employee,department'],
        ]);

        $calendar = $this->calendarService->getTeamCalendar(
            $validated['department_id'] ?? null,
            $validated['month'],
            [
                'include_weekends' => $validated['include_weekends'] ?? false,
                'include_holidays' => true,
                'group_by' => $validated['group_by'] ?? 'date',
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $calendar,
        ]);
    }

    /**
     * Get team availability for a date range.
     */
    public function getAvailability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'department_id' => ['nullable', 'integer'],
        ]);

        $availability = $this->calendarService->getAvailability(
            $validated['department_id'] ?? null,
            Carbon::parse($validated['start_date']),
            $validated['end_date'] ? Carbon::parse($validated['end_date']) : null
        );

        return response()->json([
            'success' => true,
            'data' => $availability,
        ]);
    }

    /**
     * Check for leave conflicts before approval.
     */
    public function checkConflicts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'integer'],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'min_capacity' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $conflicts = $this->calendarService->detectConflicts(
            $validated['employee_id'],
            Carbon::parse($validated['from_date']),
            Carbon::parse($validated['to_date']),
            ['min_capacity' => $validated['min_capacity'] ?? 50]
        );

        return response()->json([
            'success' => true,
            'data' => $conflicts,
        ]);
    }

    /**
     * Get capacity forecast for planning.
     */
    public function getCapacityForecast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => ['nullable', 'integer'],
            'days_ahead' => ['nullable', 'integer', 'min:7', 'max:90'],
        ]);

        $forecast = $this->calendarService->getCapacityForecast(
            $validated['department_id'] ?? null,
            $validated['days_ahead'] ?? 30
        );

        return response()->json([
            'success' => true,
            'data' => $forecast,
        ]);
    }

    /**
     * Get leave balance forecast for an employee.
     */
    public function getBalanceForecast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'integer'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
        ]);

        $forecast = $this->calendarService->getLeaveBalanceForecast(
            $validated['employee_id'],
            $validated['year']
        );

        return response()->json([
            'success' => true,
            'data' => $forecast,
        ]);
    }

    /**
     * Export calendar to iCal format.
     */
    public function exportIcal(Request $request)
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'department_id' => ['nullable', 'integer'],
        ]);

        $ical = $this->calendarService->exportToICal(
            $validated['department_id'] ?? null,
            $validated['month']
        );

        return response($ical, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="leave-calendar-' . $validated['month'] . '.ics"',
        ]);
    }

    /**
     * Export calendar to CSV format.
     */
    public function exportCsv(Request $request)
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'department_id' => ['nullable', 'integer'],
        ]);

        $csv = $this->calendarService->exportToCSV(
            $validated['department_id'] ?? null,
            $validated['month']
        );

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="leave-calendar-' . $validated['month'] . '.csv"',
        ]);
    }
}
