<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimeOffController extends Controller
{
    public function index()
    {
        return Inertia::render('Pages/HRM/TimeOff/Index', [
            'title' => 'Time-off Management',
            'timeOffRequests' => [],
        ]);
    }

    public function calendar()
    {
        return Inertia::render('Pages/HRM/TimeOff/Calendar', [
            'title' => 'Time-off Calendar',
            'events' => [],
        ]);
    }

    public function approvals()
    {
        return Inertia::render('Pages/HRM/TimeOff/Approvals', [
            'title' => 'Time-off Approvals',
            'pendingRequests' => [],
        ]);
    }

    public function approve(Request $request, $id)
    {
        // Implementation for approving time-off requests
        return redirect()->back()->with('success', 'Time-off request approved successfully');
    }

    public function reject(Request $request, $id)
    {
        // Implementation for rejecting time-off requests
        return redirect()->back()->with('success', 'Time-off request rejected');
    }

    public function reports()
    {
        return Inertia::render('Pages/HRM/TimeOff/Reports', [
            'title' => 'Time-off Reports',
            'reports' => [],
        ]);
    }

    public function settings()
    {
        return Inertia::render('Pages/HRM/TimeOff/Settings', [
            'title' => 'Time-off Settings',
            'settings' => [],
        ]);
    }

    public function updateSettings(Request $request)
    {
        // Implementation for updating time-off settings
        return redirect()->back()->with('success', 'Time-off settings updated successfully');
    }
}
