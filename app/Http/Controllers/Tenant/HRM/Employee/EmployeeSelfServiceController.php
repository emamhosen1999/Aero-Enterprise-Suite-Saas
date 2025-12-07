<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeSelfServiceController extends Controller
{
    public function index()
    {
        return Inertia::render('HR/SelfService/Index', [
            'title' => 'Employee Self-Service Portal',
            'user' => auth()->user(),
        ]);
    }

    public function profile()
    {
        return Inertia::render('HR/SelfService/Profile', [
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
        return Inertia::render('HR/SelfService/Documents', [
            'title' => 'My Documents',
            'documents' => [],
        ]);
    }

    public function benefits()
    {
        return Inertia::render('HR/SelfService/Benefits', [
            'title' => 'My Benefits',
            'benefits' => [],
        ]);
    }

    public function timeOff()
    {
        return Inertia::render('HR/SelfService/TimeOff', [
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
        return Inertia::render('HR/SelfService/Trainings', [
            'title' => 'My Trainings',
            'trainings' => [],
        ]);
    }

    public function payslips()
    {
        return Inertia::render('HR/SelfService/Payslips', [
            'title' => 'My Payslips',
            'payslips' => [],
        ]);
    }

    public function performance()
    {
        return Inertia::render('HR/SelfService/Performance', [
            'title' => 'My Performance',
            'reviews' => [],
        ]);
    }
}
