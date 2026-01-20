<?php

namespace Aero\HRM\Http\Controllers\Attendance;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DailyAttendanceController extends Controller
{
    /**
     * Resolve configured user model to avoid cross-package coupling.
     */
    protected function userModel(): string
    {
        return config('hrm.user_model', config('auth.providers.users.model'));
    }

    public function index(Request $request): Response
    {
        $date = $request->input('date', now()->format('Y-m-d'));
        
        $users = $this->userModel()::with(['attendances' => function ($query) use ($date) {
            $query->whereDate('check_in', $date);
        }])->get();

        return Inertia::render('HRM/Attendance/Index', [
            'title' => 'Daily Attendance',
            'users' => $users,
            'date' => $date,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'check_in' => 'required|date',
            'check_out' => 'nullable|date|after:check_in',
            'status' => 'required|in:present,absent,late,half_day',
        ]);

        $attendance = Attendance::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'attendance' => $attendance,
        ]);
    }

    public function bulkMarkPresent(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'date' => 'required|date',
        ]);

        $attendances = [];
        foreach ($validated['user_ids'] as $userId) {
            $attendances[] = Attendance::create([
                'user_id' => $userId,
                'check_in' => $validated['date'] . ' 09:00:00',
                'status' => 'present',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulk attendance marked successfully',
            'count' => count($attendances),
        ]);
    }
}
