<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeSelfServiceController extends Controller
{
    public function index()
    {
        return Inertia::render('HRM/SelfService/Index', [
            'title' => 'Employee Self-Service Portal',
            'user' => auth()->user(),
        ]);
    }

    public function profile()
    {
        return Inertia::render('HRM/SelfService/Profile/Index', [
            'title' => 'My Profile',
            'user' => auth()->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        // Implementation for updating employee profile
        return redirect()->back()->with('success', 'Profile updated successfully');
    }

    public function documents()
    {
        return Inertia::render('HRM/SelfService/Documents/Index', [
            'title' => 'My Documents',
            'documents' => [],
        ]);
    }

    public function benefits()
    {
        return Inertia::render('HRM/SelfService/Benefits/Index', [
            'title' => 'My Benefits',
            'benefits' => [],
        ]);
    }

    public function timeOff()
    {
        return Inertia::render('HRM/SelfService/TimeOff/Index', [
            'title' => 'Time-off Requests',
            'requests' => [],
        ]);
    }

    public function requestTimeOff(Request $request)
    {
        // Implementation for requesting time-off
        return redirect()->back()->with('success', 'Time-off request submitted successfully');
    }

    public function trainings()
    {
        return Inertia::render('HRM/SelfService/Trainings/Index', [
            'title' => 'My Trainings',
            'trainings' => [],
        ]);
    }

    public function payslips()
    {
        return Inertia::render('HRM/SelfService/Payslips/Index', [
            'title' => 'My Payslips',
            'payslips' => [],
        ]);
    }

    public function performance()
    {
        return Inertia::render('HRM/SelfService/Performance/Index', [
            'title' => 'My Performance',
            'reviews' => [],
        ]);
    }
}
