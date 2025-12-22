<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Holiday;
use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index(): \Inertia\Response
    {
        $holidays = Holiday::active()
            ->orderBy('from_date', 'asc')
            ->get();

        // Get statistics for the dashboard (for reference, but frontend will calculate dynamically)
        $currentYearHolidays = Holiday::active()->currentYear()->get();
        $stats = [
            'total_holidays' => Holiday::active()->count(),
            'upcoming_holidays' => Holiday::active()->upcoming()->count(),
            'current_year_holidays' => $currentYearHolidays->count(),
            'total_holiday_days' => $currentYearHolidays->sum(function ($holiday) {
                return $holiday->duration;
            }),
        ];

        return Inertia::render('Holidays', [
            'title' => 'Company Holidays',
            'holidays' => $holidays,
            'stats' => $stats,
        ]);
    }

    public function create(Request $request)
    {
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|exists:holidays,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'fromDate' => 'required|date',
            'toDate' => 'required|date|after_or_equal:fromDate',
            'type' => 'required|string|in:public,religious,national,company,optional',
            'is_recurring' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = [
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'from_date' => $request->input('fromDate'),
                'to_date' => $request->input('toDate'),
                'type' => $request->input('type', 'company'),
                'is_recurring' => $request->boolean('is_recurring', false),
                'is_active' => $request->boolean('is_active', true),
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ];

            if ($request->has('id')) {
                // Update existing holiday record
                $holiday = Holiday::find($request->input('id'));

                $holiday->update($data);

                $message = 'Holiday updated successfully';
            } else {
                // Create new holiday record
                Holiday::create($data);
                $message = 'Holiday added successfully';
            }

            // Get updated holidays for return
            $holidays = Holiday::active()
                ->orderBy('from_date', 'asc')
                ->get();

            return response()->json([
                'message' => $message,
                'holidays' => $holidays,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to add holiday. Please try again later.',
            ], 500);
        }
    }

    public function delete(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Validate the incoming request
            $request->validate([
                'id' => 'required|exists:holidays,id',
                'route' => 'required',
            ]);

            // Find the daily work by ID
            $holiday = Holiday::find($request->query('id'));

            if (! $holiday) {
                return response()->json(['error' => 'Holiday not found'], 404);
            }

            // Delete the holiday
            $holiday->delete();

            // Get updated holidays for return
            $holidays = Holiday::active()
                ->orderBy('from_date', 'asc')
                ->get();

            // Return a success response
            return response()->json([
                'message' => 'Holiday deleted successfully',
                'holidays' => $holidays,
            ], 200);

        } catch (\Exception $e) {
            // Catch any exceptions and return an error response
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
