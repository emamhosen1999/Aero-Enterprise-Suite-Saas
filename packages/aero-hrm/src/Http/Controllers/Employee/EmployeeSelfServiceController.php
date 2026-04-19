<?php

declare(strict_types=1);

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Benefit;
use Aero\HRM\Models\CareerPath;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeCareerProgression;
use Aero\HRM\Models\EmployeePersonalDocument;
use Aero\HRM\Models\HrDocument;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\Payslip;
use Aero\HRM\Models\PerformanceReview;
use Aero\HRM\Models\TrainingEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSelfServiceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('HRM/SelfService/Index', [
            'title' => 'Employee Self-Service Portal',
            'user' => Auth::user(),
        ]);
    }

    public function profile(): Response
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)
            ->with(['department', 'designation', 'bankDetail', 'addresses', 'emergencyContacts', 'education', 'workExperience'])
            ->first();

        return Inertia::render('HRM/SelfService/Profile', [
            'title' => 'My Profile',
            'user' => $user,
            'employee' => $employee,
        ]);
    }

    public function updateProfile(Request $request)
    {
        return redirect()->back()->with('success', 'Profile updated successfully');
    }

    public function documents(): Response
    {
        $user = Auth::user();

        $documents = EmployeePersonalDocument::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'type' => $d->document_type,
                'status' => $d->status,
                'expiry_date' => $d->expiry_date?->format('Y-m-d'),
                'uploaded_date' => $d->created_at?->format('Y-m-d'),
            ]);

        return Inertia::render('HRM/SelfService/Documents', [
            'title' => 'My Documents',
            'documents' => $documents,
        ]);
    }

    public function benefits(): Response
    {
        $user = Auth::user();

        $benefits = Benefit::whereHas('employees', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'type' => $b->type,
                'provider' => $b->provider,
                'status' => $b->status,
            ]);

        return Inertia::render('HRM/SelfService/Benefits', [
            'title' => 'My Benefits',
            'benefits' => $benefits,
        ]);
    }

    public function timeOff(): Response
    {
        $user = Auth::user();

        $requests = Leave::where('user_id', $user->id)
            ->with('leaveSetting')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'type' => $l->leaveSetting?->name ?? 'Unknown',
                'start_date' => $l->from_date?->format('Y-m-d'),
                'end_date' => $l->to_date?->format('Y-m-d'),
                'days' => $l->no_of_days ?? 1,
                'status' => $l->status,
                'reason' => $l->reason,
            ]);

        return Inertia::render('HRM/SelfService/TimeOff', [
            'title' => 'Time-off Requests',
            'requests' => $requests,
        ]);
    }

    public function requestTimeOff(Request $request)
    {
        return redirect()->back()->with('success', 'Time-off request submitted successfully');
    }

    public function trainings(): Response
    {
        $user = Auth::user();

        $trainings = TrainingEnrollment::where('user_id', $user->id)
            ->with('training.category')
            ->orderBy('enrollment_date', 'desc')
            ->take(20)
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->training?->title,
                'category' => $e->training?->category?->name,
                'status' => $e->status,
                'start_date' => $e->training?->start_date?->format('Y-m-d'),
                'end_date' => $e->training?->end_date?->format('Y-m-d'),
                'score' => $e->score,
            ]);

        return Inertia::render('HRM/SelfService/Trainings', [
            'title' => 'My Trainings',
            'trainings' => $trainings,
        ]);
    }

    public function payslips(): Response
    {
        $user = Auth::user();

        $payslips = Payslip::where('user_id', $user->id)
            ->where('status', '!=', 'draft')
            ->orderBy('pay_period_end', 'desc')
            ->take(12)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'period' => $p->pay_period_start?->format('M d') . ' - ' . $p->pay_period_end?->format('M d, Y'),
                'gross_pay' => (float) $p->gross_salary,
                'net_pay' => (float) $p->net_salary,
                'deductions' => (float) $p->total_deductions,
                'status' => $p->status,
            ]);

        return Inertia::render('HRM/SelfService/Payslips', [
            'title' => 'My Payslips',
            'payslips' => $payslips,
        ]);
    }

    public function performance(): Response
    {
        $user = Auth::user();

        $reviews = PerformanceReview::where('employee_id', $user->id)
            ->with(['reviewer', 'template'])
            ->orderBy('review_date', 'desc')
            ->take(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'cycle' => $r->template?->name ?? 'Review',
                'reviewer' => $r->reviewer?->name,
                'overall_rating' => $r->overall_rating,
                'status' => $r->status,
                'review_date' => $r->review_date?->format('Y-m-d'),
            ]);

        return Inertia::render('HRM/SelfService/Performance', [
            'title' => 'My Performance',
            'reviews' => $reviews,
        ]);
    }

    public function careerPath(): Response
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        $careerPaths = [];
        if ($employee) {
            $careerPaths = EmployeeCareerProgression::where('employee_id', $employee->id)
                ->with(['careerPath', 'currentMilestone', 'targetMilestone'])
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'path_name' => $p->careerPath?->name,
                    'current_milestone' => $p->currentMilestone?->name,
                    'target_milestone' => $p->targetMilestone?->name,
                    'progress' => (float) $p->progress_percentage,
                    'status' => $p->status,
                ]);
        }

        return Inertia::render('HRM/SelfService/CareerPath', [
            'title' => 'My Career Path',
            'careerPaths' => $careerPaths,
        ]);
    }
}
