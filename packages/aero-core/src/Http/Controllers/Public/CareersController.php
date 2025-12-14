<?php

namespace Aero\Core\Http\Controllers\Public;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\Tenant\HRM\Job;
use Aero\Core\Models\Tenant\HRM\JobApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CareersController extends Controller
{
    /**
     * Display public job listings.
     */
    public function index(Request $request)
    {
        $jobs = Job::with(['department'])
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', now());
            })
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->department, function ($query, $department) {
                $query->whereHas('department', function ($q) use ($department) {
                    $q->where('name', $department);
                });
            })
            ->when($request->employment_type, function ($query, $type) {
                $query->where('employment_type', $type);
            })
            ->latest('posted_at')
            ->get();

        return Inertia::render('Pages/Shared/Public/Careers/Index', [
            'jobs' => $jobs,
            'filters' => [
                'search' => $request->search,
                'department' => $request->department,
                'employment_type' => $request->employment_type,
            ],
        ]);
    }

    /**
     * Display specific job details.
     */
    public function show($id)
    {
        $job = Job::with(['department'])
            ->where('status', 'published')
            ->findOrFail($id);

        return Inertia::render('Pages/Shared/Public/Careers/Show', [
            'job' => $job,
        ]);
    }

    /**
     * Show application form.
     */
    public function apply($id)
    {
        $job = Job::with(['department'])
            ->where('status', 'published')
            ->findOrFail($id);

        if ($job->application_deadline && $job->application_deadline < now()) {
            return redirect()->route('careers.show', $job->id)
                ->with('error', 'Application deadline has passed for this position.');
        }

        return Inertia::render('Pages/Shared/Public/Careers/Apply', [
            'job' => $job,
        ]);
    }

    /**
     * Submit job application.
     */
    public function submit(Request $request, $id)
    {
        $job = Job::where('status', 'published')->findOrFail($id);

        if ($job->application_deadline && $job->application_deadline < now()) {
            return back()->with('error', 'Application deadline has passed for this position.');
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'location' => 'nullable|string|max:255',
            'linkedin_url' => 'nullable|url|max:500',
            'portfolio_url' => 'nullable|url|max:500',
            'years_of_experience' => 'required|integer|min:0',
            'current_position' => 'nullable|string|max:255',
            'current_company' => 'nullable|string|max:255',
            'expected_salary' => 'nullable|numeric|min:0',
            'notice_period' => 'nullable|string|max:100',
            'available_from' => 'nullable|date',
            'cover_letter' => 'required|string',
            'resume' => 'required|file|mimes:pdf,doc,docx|max:5120',
            'education' => 'nullable|string',
            'skills' => 'required|string',
            'references' => 'nullable|string',
        ]);

        // Store resume
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('resumes', 'public');
            $validated['resume_path'] = $resumePath;
        }

        // Create application
        $application = JobApplication::create([
            'job_id' => $job->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'location' => $validated['location'] ?? null,
            'linkedin_url' => $validated['linkedin_url'] ?? null,
            'portfolio_url' => $validated['portfolio_url'] ?? null,
            'years_of_experience' => $validated['years_of_experience'],
            'current_position' => $validated['current_position'] ?? null,
            'current_company' => $validated['current_company'] ?? null,
            'expected_salary' => $validated['expected_salary'] ?? null,
            'notice_period' => $validated['notice_period'] ?? null,
            'available_from' => $validated['available_from'] ?? null,
            'cover_letter' => $validated['cover_letter'],
            'resume_path' => $validated['resume_path'],
            'education' => $validated['education'] ?? null,
            'skills' => $validated['skills'],
            'references' => $validated['references'] ?? null,
            'status' => 'submitted',
            'applied_at' => now(),
        ]);

        // Dispatch event for notifications
        event(new \App\Events\CandidateApplied($application));

        return redirect()->route('careers.index')
            ->with('success', 'Your application has been submitted successfully! We will review it and get back to you soon.');
    }
}
