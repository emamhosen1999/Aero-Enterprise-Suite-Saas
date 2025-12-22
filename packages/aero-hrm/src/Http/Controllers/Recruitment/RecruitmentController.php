<?php

namespace Aero\HRM\Http\Controllers\Recruitment;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\JobHiringStage;
use Aero\HRM\Models\JobInterview;
use Aero\HRM\Http\Controllers\Controller;
use App\Http\Controllers\Tenant\HRM\Recruitment\JobApplicationStageHistory;
use App\Http\Controllers\Tenant\HRM\Recruitment\JobOffer;
use Aero\Core\Models\User;
use App\Models\Tenant\HRM\Job;
use App\Models\Tenant\HRM\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RecruitmentController extends Controller
{
    /**
     * Display a listing of the jobs.
     */
    public function index(Request $request)
    {
        $jobs = Job::with([
            'department',
            'hiringManager',
            'applications' => function ($query) {
                $query->with(['applicant', 'currentStage']);
            },
            'hiringStages',
        ])
            ->withCount([
                'applications',
                'applications as new_applications_count' => function ($query) {
                    $query->where('status', 'new');
                },
                'applications as shortlisted_applications_count' => function ($query) {
                    $query->where('status', 'shortlisted');
                },
                'applications as hired_applications_count' => function ($query) {
                    $query->where('status', 'hired');
                },
            ])
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->job_type, function ($query, $jobType) {
                $query->where('type', $jobType);
            })
            ->orderBy($request->input('sort_by', 'posting_date'), $request->input('sort_order', 'desc'))
            ->paginate($request->input('perPage', 10))
            ->withQueryString();

        $data = [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'status', 'department_id', 'job_type', 'sort_by', 'sort_order']),
            'departments' => Department::select('id', 'name')->get(),
            'managers' => User::role(['Super Administrator', 'Administrator', 'HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'jobTypes' => [
                ['id' => 'full_time', 'name' => 'Full Time'],
                ['id' => 'part_time', 'name' => 'Part Time'],
                ['id' => 'contract', 'name' => 'Contract'],
                ['id' => 'temporary', 'name' => 'Temporary'],
                ['id' => 'internship', 'name' => 'Internship'],
                ['id' => 'remote', 'name' => 'Remote'],
            ],
            'statuses' => [
                ['id' => 'draft', 'name' => 'Draft'],
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
        ];

        // Always return Inertia response for page loads
        return Inertia::render('Pages/HRM/Recruitment/Index', $data);
    }

    /**
     * Get data for jobs index page (AJAX endpoint for SPA refreshes)
     */
    public function indexData(Request $request)
    {
        $jobs = Job::with([
            'department',
            'hiringManager',
            'applications' => function ($query) {
                $query->with(['applicant', 'currentStage']);
            },
            'hiringStages',
        ])
            ->withCount([
                'applications',
                'applications as new_applications_count' => function ($query) {
                    $query->where('status', 'new');
                },
                'applications as shortlisted_applications_count' => function ($query) {
                    $query->where('status', 'shortlisted');
                },
                'applications as hired_applications_count' => function ($query) {
                    $query->where('status', 'hired');
                },
            ])
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->job_type, function ($query, $jobType) {
                $query->where('type', $jobType);
            })
            ->orderBy($request->input('sort_by', 'posting_date'), $request->input('sort_order', 'desc'))
            ->paginate($request->input('perPage', 10))
            ->withQueryString();

        return response()->json([
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'status', 'department_id', 'job_type', 'sort_by', 'sort_order']),
            'departments' => Department::select('id', 'name')->get(),
            'managers' => User::role(['Super Administrator', 'Administrator', 'HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'jobTypes' => [
                ['id' => 'full_time', 'name' => 'Full Time'],
                ['id' => 'part_time', 'name' => 'Part Time'],
                ['id' => 'contract', 'name' => 'Contract'],
                ['id' => 'temporary', 'name' => 'Temporary'],
                ['id' => 'internship', 'name' => 'Internship'],
                ['id' => 'remote', 'name' => 'Remote'],
            ],
            'statuses' => [
                ['id' => 'draft', 'name' => 'Draft'],
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
        ]);
    }

    /**
     * Store a newly created job in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|in:full_time,part_time,contract,temporary,internship,remote',
            'location' => 'nullable|string|max:255',
            'is_remote_allowed' => 'boolean',
            'description' => 'required|string',
            'responsibilities' => 'nullable|array',
            'requirements' => 'nullable|array',
            'qualifications' => 'nullable|array',
            'benefits' => 'nullable|array',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'required|string|max:3',
            'salary_visible' => 'boolean',
            'posting_date' => 'nullable|date',
            'closing_date' => 'nullable|date|after:posting_date',
            'status' => 'required|in:draft,open,closed,on_hold,cancelled',
            'hiring_manager_id' => 'nullable|exists:users,id',
            'positions' => 'required|integer|min:1',
            'is_featured' => 'boolean',
            'skills_required' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ]);

        // Set creator
        $validated['created_by'] = auth()->id();

        // Handle posting date
        if ($validated['status'] === 'open' && ! isset($validated['posting_date'])) {
            $validated['posting_date'] = now();
        }

        $job = Job::create($validated);

        // Create default hiring stages
        $defaultStages = [
            ['name' => 'Applied', 'sequence' => 1, 'is_active' => true, 'is_final' => false],
            ['name' => 'Screening', 'sequence' => 2, 'is_active' => true, 'is_final' => false],
            ['name' => 'Interview', 'sequence' => 3, 'is_active' => true, 'is_final' => false],
            ['name' => 'Offer', 'sequence' => 4, 'is_active' => true, 'is_final' => false],
            ['name' => 'Hired', 'sequence' => 5, 'is_active' => true, 'is_final' => true],
            ['name' => 'Rejected', 'sequence' => 6, 'is_active' => true, 'is_final' => true],
        ];

        foreach ($defaultStages as $stage) {
            JobHiringStage::create([
                'job_id' => $job->id,
                'name' => $stage['name'],
                'description' => 'Default stage: '.$stage['name'],
                'sequence' => $stage['sequence'],
                'is_active' => $stage['is_active'],
                'is_final' => $stage['is_final'],
            ]);
        }

        // Load relationships for response
        $job->load(['department', 'hiringManager']);

        return response()->json([
            'message' => 'Job position created successfully.',
            'job' => $job,
        ]);
    }

    /**
     * Store a newly created job via AJAX.
     */
    public function storeAjax(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|in:full_time,part_time,contract,temporary,internship,remote',
            'location' => 'nullable|string|max:255',
            'is_remote_allowed' => 'boolean',
            'description' => 'required|string',
            'responsibilities' => 'nullable|array',
            'requirements' => 'nullable|array',
            'qualifications' => 'nullable|array',
            'benefits' => 'nullable|array',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'required|string|max:3',
            'salary_visible' => 'boolean',
            'posting_date' => 'nullable|date',
            'closing_date' => 'nullable|date|after:posting_date',
            'status' => 'required|in:draft,open,closed,on_hold,cancelled',
            'hiring_manager_id' => 'nullable|exists:users,id',
            'positions' => 'required|integer|min:1',
            'is_featured' => 'boolean',
            'skills_required' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ]);

        // Set creator
        $validated['created_by'] = auth()->id();

        // Handle posting date
        if ($validated['status'] === 'open' && ! isset($validated['posting_date'])) {
            $validated['posting_date'] = now();
        }

        $job = Job::create($validated);

        // Create default hiring stages
        $defaultStages = [
            ['name' => 'Applied', 'sequence' => 1, 'is_active' => true, 'is_final' => false],
            ['name' => 'Screening', 'sequence' => 2, 'is_active' => true, 'is_final' => false],
            ['name' => 'Interview', 'sequence' => 3, 'is_active' => true, 'is_final' => false],
            ['name' => 'Offer', 'sequence' => 4, 'is_active' => true, 'is_final' => false],
            ['name' => 'Hired', 'sequence' => 5, 'is_active' => true, 'is_final' => true],
            ['name' => 'Rejected', 'sequence' => 6, 'is_active' => true, 'is_final' => true],
        ];

        foreach ($defaultStages as $stage) {
            JobHiringStage::create([
                'job_id' => $job->id,
                'name' => $stage['name'],
                'description' => 'Default stage: '.$stage['name'],
                'sequence' => $stage['sequence'],
                'is_active' => $stage['is_active'],
                'is_final' => $stage['is_final'],
            ]);
        }

        // Load relationships for response
        $job->load(['department', 'hiringManager']);

        return response()->json([
            'message' => 'Job position created successfully.',
            'job' => $job,
        ]);
    }

    /**
     * Display the specified job.
     */
    public function show(Request $request, $id)
    {
        $job = Job::with([
            'department',
            'hiringManager',
            'hiringStages',
            'applications.applicant',
            'applications.currentStage',
        ])->findOrFail($id);

        // Get applications with detailed statistics
        $applications = $job->applications;
        $totalApplications = $applications->count();

        // Application statistics by status
        $applicationStats = [
            'total' => $totalApplications,
            'new' => $applications->where('status', 'new')->count(),
            'in_review' => $applications->where('status', 'in_review')->count(),
            'shortlisted' => $applications->where('status', 'shortlisted')->count(),
            'interviewed' => $applications->where('status', 'interviewed')->count(),
            'offered' => $applications->where('status', 'offered')->count(),
            'hired' => $applications->where('status', 'hired')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'withdrawn' => $applications->where('status', 'withdrawn')->count(),
        ];

        // Application statistics by stage
        $applicationsByStage = [];
        $hiringStages = $job->hiringStages;

        foreach ($hiringStages as $stage) {
            $stageApplications = $applications->where('current_stage_id', $stage->id);

            $applicationsByStage[$stage->id] = [
                'stage' => $stage,
                'applications' => $stageApplications->values(),
                'count' => $stageApplications->count(),
            ];
        }

        // Job performance metrics
        $jobMetrics = [
            'days_active' => $job->posting_date ? $job->posting_date->diffInDays(now()) : 0,
            'days_until_closing' => $job->daysUntilClosing(),
            'is_active' => $job->isOpen(),
            'applications_per_day' => $totalApplications > 0 && $job->posting_date ?
                round($totalApplications / max($job->posting_date->diffInDays(now()), 1), 2) : 0,
            'hire_rate' => $totalApplications > 0 ?
                round(($applicationStats['hired'] / $totalApplications) * 100, 2) : 0,
            'interview_rate' => $totalApplications > 0 ?
                round(($applicationStats['interviewed'] / $totalApplications) * 100, 2) : 0,
        ];

        // Recent applications (last 5)
        $recentApplications = $applications->sortByDesc('created_at')->take(5)->values();

        $data = [
            'job' => $job,
            'hiringStages' => $hiringStages,
            'applicationsByStage' => $applicationsByStage,
            'applicationStats' => $applicationStats,
            'jobMetrics' => $jobMetrics,
            'recentApplications' => $recentApplications,
            'totalApplications' => $totalApplications,
            'isActive' => $job->isOpen(),
            'daysUntilClosing' => $job->daysUntilClosing(),
            // Add dropdown data for forms, same as in index method
            'departments' => Department::select('id', 'name')->get(),
            'managers' => User::role(['Super Administrator', 'Administrator', 'HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'jobTypes' => [
                ['id' => 'full_time', 'name' => 'Full Time'],
                ['id' => 'part_time', 'name' => 'Part Time'],
                ['id' => 'contract', 'name' => 'Contract'],
                ['id' => 'temporary', 'name' => 'Temporary'],
                ['id' => 'internship', 'name' => 'Internship'],
                ['id' => 'remote', 'name' => 'Remote'],
            ],
            'statuses' => [
                ['id' => 'draft', 'name' => 'Draft'],
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
        ];

        // Always return Inertia response for page loads
        return Inertia::render('Pages/HRM/Recruitment/Show', $data);
    }

    /**
     * Get data for job detail page (AJAX endpoint for SPA refreshes)
     */
    public function showData(Request $request, $id)
    {
        $job = Job::with([
            'department',
            'hiringManager',
            'hiringStages',
            'applications.applicant',
            'applications.currentStage',
        ])->findOrFail($id);

        // Get applications with detailed statistics
        $applications = $job->applications;
        $totalApplications = $applications->count();

        // Application statistics by status
        $applicationStats = [
            'total' => $totalApplications,
            'new' => $applications->where('status', 'new')->count(),
            'in_review' => $applications->where('status', 'in_review')->count(),
            'shortlisted' => $applications->where('status', 'shortlisted')->count(),
            'interviewed' => $applications->where('status', 'interviewed')->count(),
            'offered' => $applications->where('status', 'offered')->count(),
            'hired' => $applications->where('status', 'hired')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'withdrawn' => $applications->where('status', 'withdrawn')->count(),
        ];

        // Application statistics by stage
        $applicationsByStage = [];
        $hiringStages = $job->hiringStages;

        foreach ($hiringStages as $stage) {
            $stageApplications = $applications->where('current_stage_id', $stage->id);

            $applicationsByStage[$stage->id] = [
                'stage' => $stage,
                'applications' => $stageApplications->values(),
                'count' => $stageApplications->count(),
            ];
        }

        // Job performance metrics
        $jobMetrics = [
            'days_active' => $job->posting_date ? $job->posting_date->diffInDays(now()) : 0,
            'days_until_closing' => $job->daysUntilClosing(),
            'is_active' => $job->isOpen(),
            'applications_per_day' => $totalApplications > 0 && $job->posting_date ?
                round($totalApplications / max($job->posting_date->diffInDays(now()), 1), 2) : 0,
            'hire_rate' => $totalApplications > 0 ?
                round(($applicationStats['hired'] / $totalApplications) * 100, 2) : 0,
            'interview_rate' => $totalApplications > 0 ?
                round(($applicationStats['interviewed'] / $totalApplications) * 100, 2) : 0,
        ];

        // Recent applications (last 5)
        $recentApplications = $applications->sortByDesc('created_at')->take(5)->values();

        return response()->json([
            'job' => $job,
            'hiringStages' => $hiringStages,
            'applicationsByStage' => $applicationsByStage,
            'applicationStats' => $applicationStats,
            'jobMetrics' => $jobMetrics,
            'recentApplications' => $recentApplications,
            'totalApplications' => $totalApplications,
            'isActive' => $job->isOpen(),
            'daysUntilClosing' => $job->daysUntilClosing(),
            // Add dropdown data for forms, same as in index and show methods
            'departments' => Department::select('id', 'name')->get(),
            'managers' => User::role(['Super Administrator', 'Administrator', 'HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'jobTypes' => [
                ['id' => 'full_time', 'name' => 'Full Time'],
                ['id' => 'part_time', 'name' => 'Part Time'],
                ['id' => 'contract', 'name' => 'Contract'],
                ['id' => 'temporary', 'name' => 'Temporary'],
                ['id' => 'internship', 'name' => 'Internship'],
                ['id' => 'remote', 'name' => 'Remote'],
            ],
            'statuses' => [
                ['id' => 'draft', 'name' => 'Draft'],
                ['id' => 'open', 'name' => 'Open'],
                ['id' => 'closed', 'name' => 'Closed'],
                ['id' => 'on_hold', 'name' => 'On Hold'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
        ]);
    }

    /**
     * Show the form for editing the specified job.
     */
    public function edit($id)
    {
        $job = Job::with([
            'department',
            'hiringManager',
            'hiringStages' => function ($query) {
                $query->orderBy('sequence');
            },
        ])->findOrFail($id);

        return Inertia::render('Pages/HRM/Recruitment/Edit', [
            'job' => $job,
            'departments' => Department::all(['id', 'name']),
            'managers' => User::role(['HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'jobTypes' => [
                ['id' => 'full_time', 'name' => 'Full Time'],
                ['id' => 'part_time', 'name' => 'Part Time'],
                ['id' => 'contract', 'name' => 'Contract'],
                ['id' => 'temporary', 'name' => 'Temporary'],
                ['id' => 'internship', 'name' => 'Internship'],
                ['id' => 'remote', 'name' => 'Remote'],
            ],
            'currencies' => [
                'USD',
                'EUR',
                'GBP',
                'CAD',
                'AUD',
                'JPY',
                'INR',
                'CNY',
            ],
        ]);
    }

    /**
     * Update the specified job in storage.
     */
    public function update(Request $request, $id)
    {
        $job = Job::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|in:full_time,part_time,contract,temporary,internship,remote',
            'location' => 'nullable|string|max:255',
            'is_remote_allowed' => 'boolean',
            'description' => 'required|string',
            'responsibilities' => 'nullable|array',
            'requirements' => 'nullable|array',
            'qualifications' => 'nullable|array',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'required|string|max:10',
            'salary_visible' => 'boolean',
            'benefits' => 'nullable|array',
            'posting_date' => 'nullable|date',
            'closing_date' => 'nullable|date|after_or_equal:posting_date',
            'status' => 'required|in:draft,open,closed,on_hold,cancelled',
            'hiring_manager_id' => 'required|exists:users,id',
            'positions' => 'required|integer|min:1',
            'is_featured' => 'boolean',
            'skills_required' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ]);

        // If status changed from draft to open, set posting date to today if not provided
        if ($job->status === 'draft' && $validated['status'] === 'open' && ! isset($validated['posting_date'])) {
            $validated['posting_date'] = now();
        }

        $job->update($validated);

        return redirect()->route('hr.recruitment.show', $job->id)
            ->with('success', 'Job position updated successfully.');
    }

    /**
     * Update the specified job via AJAX.
     */
    public function updateAjax(Request $request, $id)
    {
        $job = Job::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|in:full_time,part_time,contract,temporary,internship,remote',
            'location' => 'nullable|string|max:255',
            'is_remote_allowed' => 'boolean',
            'description' => 'required|string',
            'responsibilities' => 'nullable|array',
            'requirements' => 'nullable|array',
            'qualifications' => 'nullable|array',
            'benefits' => 'nullable|array',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'required|string|max:3',
            'salary_visible' => 'boolean',
            'posting_date' => 'nullable|date',
            'closing_date' => 'nullable|date|after:posting_date',
            'status' => 'required|in:draft,open,closed,on_hold,cancelled',
            'hiring_manager_id' => 'nullable|exists:users,id',
            'positions' => 'required|integer|min:1',
            'is_featured' => 'boolean',
            'skills_required' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ]);

        // If status changed from draft to open, set posting date to today if not provided
        if ($job->status === 'draft' && $validated['status'] === 'open' && ! isset($validated['posting_date'])) {
            $validated['posting_date'] = now();
        }

        $job->update($validated);

        // Load relationships for response
        $job->load(['department', 'hiringManager']);

        return response()->json([
            'message' => 'Job position updated successfully.',
            'job' => $job,
        ]);
    }

    /**
     * Remove the specified job from storage.
     */
    public function destroy($id)
    {
        $job = Job::findOrFail($id);

        // Check if there are applications for this job
        if ($job->applications()->exists()) {
            if (request()->header('X-Inertia')) {
                return back()->with('error', 'Cannot delete job with existing applications.');
            } elseif (request()->wantsJson() || request()->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete job with existing applications.',
                ], 422);
            }

            return redirect()->back()
                ->with('error', 'Cannot delete job with existing applications.');
        }

        $job->delete();

        if (request()->header('X-Inertia')) {
            // For Inertia requests, just redirect with a flash message
            return redirect()->route('hr.recruitment.index')
                ->with('success', 'Job position deleted successfully.');
        } elseif (request()->wantsJson() || request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Job position deleted successfully.',
            ]);
        }

        return redirect()->route('hr.recruitment.index')
            ->with('success', 'Job position deleted successfully.');
    }

    /**
     * Display a listing of applications for a job.
     */
    public function applications(Request $request, $id)
    {
        $job = Job::findOrFail($id);

        $query = JobApplication::where('job_id', $id)
            ->with(['applicant', 'currentStage']);

        // Always handle full page rendering
        $applications = $query->orderBy('application_date', 'desc')
            ->paginate(15);

        $hiringStages = $job->hiringStages()->orderBy('sequence')->get();

        return Inertia::render('Pages/HRM/Recruitment/Applications/Index', [
            'job' => $job,
            'applications' => $applications,
            'hiringStages' => $hiringStages,
            'statusOptions' => [
                ['id' => 'new', 'name' => 'New Application'],
                ['id' => 'in_review', 'name' => 'Under Review'],
                ['id' => 'shortlisted', 'name' => 'Shortlisted'],
                ['id' => 'interviewed', 'name' => 'Interviewed'],
                ['id' => 'offered', 'name' => 'Offer Extended'],
                ['id' => 'hired', 'name' => 'Hired'],
                ['id' => 'rejected', 'name' => 'Rejected'],
                ['id' => 'withdrawn', 'name' => 'Withdrawn'],
            ],
        ]);
    }

    /**
     * Get data for applications page (AJAX endpoint for SPA refreshes)
     */
    public function applicationsData(Request $request, $id)
    {
        $job = Job::findOrFail($id);

        $query = JobApplication::where('job_id', $id)
            ->with(['applicant', 'currentStage']);

        $applications = $query->orderBy('application_date', 'desc')
            ->paginate(15);

        $hiringStages = $job->hiringStages()->orderBy('sequence')->get();

        return response()->json([
            'job' => $job,
            'applications' => $applications,
            'hiringStages' => $hiringStages,
            'statusOptions' => [
                ['id' => 'new', 'name' => 'New Application'],
                ['id' => 'in_review', 'name' => 'Under Review'],
                ['id' => 'shortlisted', 'name' => 'Shortlisted'],
                ['id' => 'interviewed', 'name' => 'Interviewed'],
                ['id' => 'offered', 'name' => 'Offer Extended'],
                ['id' => 'hired', 'name' => 'Hired'],
                ['id' => 'rejected', 'name' => 'Rejected'],
                ['id' => 'withdrawn', 'name' => 'Withdrawn'],
            ],
        ]);
    }

    /**
     * Show the form for creating a new application.
     */
    public function createApplication($id)
    {
        $job = Job::with(['department'])->findOrFail($id);

        // Check if the job is open for applications
        if (! $job->isOpen()) {
            return redirect()->route('hr.recruitment.show', $job->id)
                ->with('error', 'This job is not open for applications.');
        }

        return Inertia::render('Pages/HRM/Recruitment/Applications/Create', [
            'job' => $job,
            'existingUsers' => User::select('id', 'name', 'email', 'phone')->get(),
            'sources' => [
                ['id' => 'internal', 'name' => 'Internal Posting'],
                ['id' => 'referral', 'name' => 'Employee Referral'],
                ['id' => 'website', 'name' => 'Company Website'],
                ['id' => 'linkedin', 'name' => 'LinkedIn'],
                ['id' => 'indeed', 'name' => 'Indeed'],
                ['id' => 'glassdoor', 'name' => 'Glassdoor'],
                ['id' => 'monster', 'name' => 'Monster'],
                ['id' => 'careerbuilder', 'name' => 'CareerBuilder'],
                ['id' => 'ziprecruiter', 'name' => 'ZipRecruiter'],
                ['id' => 'job_board', 'name' => 'Job Board'],
                ['id' => 'university', 'name' => 'University/College'],
                ['id' => 'recruiting_agency', 'name' => 'Recruiting Agency'],
                ['id' => 'social_media', 'name' => 'Social Media'],
                ['id' => 'direct_application', 'name' => 'Direct Application'],
                ['id' => 'other', 'name' => 'Other'],
            ],
        ]);
    }

    /**
     * Store a newly created application in storage.
     */
    public function storeApplication(Request $request, $id)
    {
        $job = Job::findOrFail($id);

        // Check if the job is open for applications
        if (! $job->isOpen()) {
            return redirect()->route('hr.recruitment.show', $job->id)
                ->with('error', 'This job is not open for applications.');
        }

        $validated = $request->validate([
            'applicant_id' => 'nullable|exists:users,id',
            'applicant_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'cover_letter' => 'nullable|string',
            'source' => 'required|string',
            'referral_source' => 'nullable|string',
            'referrer_id' => 'nullable|exists:users,id',
            'expected_salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|max:3',
            'notice_period' => 'nullable|integer|min:0',
            'experience_years' => 'nullable|numeric|min:0',
            'skills' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'notes' => 'nullable|string',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120', // 5MB max
        ]);

        // Get the first stage for this job
        $firstStage = $job->hiringStages()->orderBy('sequence')->first();
        if (! $firstStage) {
            return redirect()->route('hr.recruitment.show', $job->id)
                ->with('error', 'No hiring stages defined for this job.');
        }

        $validated['job_id'] = $job->id;
        $validated['status'] = 'new';
        $validated['current_stage_id'] = $firstStage->id;
        $validated['application_date'] = now();
        $validated['last_status_change'] = now();
        $validated['application_ip'] = $request->ip();

        // Set default salary currency if not provided
        if (empty($validated['salary_currency'])) {
            $validated['salary_currency'] = $job->salary_currency ?? 'USD';
        }

        $application = JobApplication::create($validated);

        if ($request->hasFile('resume')) {
            $application->addMedia($request->file('resume'))->toMediaCollection('resumes');
        }

        return redirect()->route('hr.recruitment.applications.show', [$job->id, $application->id])
            ->with('success', 'Application submitted successfully.');
    }

    /**
     * Display the specified application.
     */
    public function showApplication($id, $applicationId)
    {
        $application = JobApplication::where('job_id', $id)
            ->with([
                'job',
                'applicant',
                'currentStage',
                'stageHistory.stage',
                'interviews' => function ($query) {
                    $query->orderBy('scheduled_at');
                },
            ])
            ->findOrFail($applicationId);

        $job = Job::with('hiringStages')->findOrFail($id);

        return Inertia::render('Pages/HRM/Recruitment/Applications/Show', [
            'job' => $job,
            'application' => $application,
            'resume' => $application->getFirstMedia('resumes'),
            'hiringStages' => $job->hiringStages()->orderBy('sequence')->get(),
            'nextStage' => $application->currentStage ? $application->currentStage->nextStage() : null,
            'previousStage' => $application->currentStage ? $application->currentStage->previousStage() : null,
        ]);
    }

    /**
     * Update the specified application in storage.
     */
    public function updateApplication(Request $request, $id, $applicationId)
    {
        $application = JobApplication::where('job_id', $id)->findOrFail($applicationId);

        $validated = $request->validate([
            'status' => 'required|string',
            'rating' => 'nullable|numeric|min:1|max:5',
            'current_stage_id' => 'nullable|exists:job_hiring_stages,id',
            'application_notes' => 'nullable|string',
            'expected_salary' => 'nullable|numeric|min:0',
            'notice_period' => 'nullable|integer|min:0',
            'experience_years' => 'nullable|numeric|min:0',
        ]);

        // If stage is changing, create a stage history entry
        if (isset($validated['current_stage_id']) && $validated['current_stage_id'] != $application->current_stage_id) {
            $previousStageId = $application->current_stage_id;

            // Create stage history entry
            $application->stageHistory()->create([
                'stage_id' => $validated['current_stage_id'],
                'previous_stage_id' => $previousStageId,
                'changed_by' => Auth::id(),
                'changed_at' => now(),
                'notes' => $request->stage_change_notes ?? 'Stage updated',
            ]);

            $validated['last_status_change'] = now();
        }

        $application->update($validated);

        if ($request->hasFile('resume')) {
            $application->clearMediaCollection('resumes');
            $application->addMedia($request->file('resume'))->toMediaCollection('resumes');
        }

        return redirect()->back()
            ->with('success', 'Application updated successfully.');
    }

    /**
     * Remove the specified application from storage.
     */
    public function destroyApplication($id, $applicationId)
    {
        $application = JobApplication::where('job_id', $id)->findOrFail($applicationId);
        $application->delete();

        return redirect()->route('hr.recruitment.applications.index', $id)
            ->with('success', 'Application deleted successfully.');
    }

    /**
     * Display a listing of interviews for an application.
     */
    public function interviews($id, $applicationId)
    {
        $application = JobApplication::where('job_id', $id)
            ->with(['job', 'applicant'])
            ->findOrFail($applicationId);

        $interviews = JobInterview::where('application_id', $applicationId)
            ->orderBy('scheduled_at')
            ->get();

        return Inertia::render('Pages/HRM/Recruitment/Applications/Interviews/Index', [
            'job' => Job::findOrFail($id),
            'application' => $application,
            'interviews' => $interviews,
            'interviewers' => User::role(['HR Manager', 'Department Manager', 'Team Lead', 'Senior Employee'])->get(['id', 'name']),
            'interviewTypes' => [
                ['id' => 'phone', 'name' => 'Phone Interview'],
                ['id' => 'video', 'name' => 'Video Interview'],
                ['id' => 'in_person', 'name' => 'In-Person Interview'],
                ['id' => 'technical', 'name' => 'Technical Interview'],
                ['id' => 'panel', 'name' => 'Panel Interview'],
            ],
        ]);
    }

    /**
     * Store a newly created interview in storage.
     */
    public function storeInterview(Request $request, $id, $applicationId)
    {
        $application = JobApplication::where('job_id', $id)->findOrFail($applicationId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scheduled_at' => 'required|date|after:now',
            'duration_minutes' => 'required|integer|min:10|max:480', // 8 hours max
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'type' => 'required|in:phone,video,in_person,technical,panel',
            'status' => 'required|in:scheduled,completed,cancelled,rescheduled,no_show',
            'interviewers' => 'required|array|min:1',
            'interviewers.*' => 'exists:users,id',
        ]);

        $validated['application_id'] = $application->id;
        $validated['scheduled_by'] = Auth::id();

        $interview = JobInterview::create($validated);

        return redirect()->back()
            ->with('success', 'Interview scheduled successfully.');
    }

    /**
     * Update the specified interview in storage.
     */
    public function updateInterview(Request $request, $id, $applicationId, $interviewId)
    {
        $interview = JobInterview::where('application_id', $applicationId)->findOrFail($interviewId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scheduled_at' => 'required|date',
            'duration_minutes' => 'required|integer|min:10|max:480',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'type' => 'required|in:phone,video,in_person,technical,panel',
            'status' => 'required|in:scheduled,completed,cancelled,rescheduled,no_show',
            'interviewers' => 'required|array|min:1',
            'interviewers.*' => 'exists:users,id',
        ]);

        $interview->update($validated);

        return redirect()->back()
            ->with('success', 'Interview updated successfully.');
    }

    /**
     * Remove the specified interview from storage.
     */
    public function destroyInterview($id, $applicationId, $interviewId)
    {
        $interview = JobInterview::where('application_id', $applicationId)->findOrFail($interviewId);
        $interview->delete();

        return redirect()->back()
            ->with('success', 'Interview deleted successfully.');
    }

    /**
     * Get statistics for recruitment dashboard.
     */
    public function getStatistics(Request $request)
    {
        $dateRange = $request->input('date_range', 30); // days
        $startDate = now()->subDays($dateRange);

        $stats = [
            'total_jobs' => Job::count(),
            'active_jobs' => Job::whereIn('status', ['open', 'draft'])->count(),
            'total_applications' => JobApplication::count(),
            'new_applications' => JobApplication::where('created_at', '>=', $startDate)->count(),
            'applications_by_status' => JobApplication::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'interviews_scheduled' => JobInterview::where('status', 'scheduled')
                ->where('scheduled_at', '>=', now())
                ->count(),
            'offers_pending' => JobOffer::whereIn('status', ['sent', 'negotiating'])->count(),
            'positions_filled' => JobApplication::where('status', 'hired')->count(),
        ];

        if ($request->wantsJson()) {
            return response()->json($stats);
        }

        return $stats;
    }

    /**
     * Bulk update application statuses.
     */
    public function bulkUpdateApplications(Request $request)
    {
        $validated = $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:job_applications,id',
            'status' => 'required|in:new,in_review,shortlisted,interviewed,offered,hired,rejected,withdrawn',
            'stage_id' => 'nullable|exists:job_hiring_stages,id',
            'notes' => 'nullable|string',
        ]);

        $applications = JobApplication::whereIn('id', $validated['application_ids'])->get();

        foreach ($applications as $application) {
            $updateData = ['status' => $validated['status']];

            if (isset($validated['stage_id'])) {
                $updateData['current_stage_id'] = $validated['stage_id'];
            }

            $application->update($updateData);

            // Create stage history if stage changed
            if (isset($validated['stage_id']) && $validated['stage_id'] != $application->current_stage_id) {
                JobApplicationStageHistory::create([
                    'application_id' => $application->id,
                    'stage_id' => $validated['stage_id'],
                    'moved_by' => Auth::id(),
                    'moved_at' => now(),
                    'notes' => $validated['notes'] ?? 'Bulk status update',
                ]);
            }
        }

        return redirect()->back()
            ->with('success', 'Applications updated successfully.');
    }

    /**
     * Export job applications to CSV.
     */
    public function exportApplications(Request $request, $id)
    {
        $job = Job::findOrFail($id);
        $applications = $job->applications()->with(['applicant', 'currentStage'])->get();

        $filename = 'job_applications_'.$job->id.'_'.now()->format('Y-m-d').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        $callback = function () use ($applications) {
            $file = fopen('php://output', 'w');

            // CSV headers
            fputcsv($file, [
                'Application ID',
                'Applicant Name',
                'Email',
                'Phone',
                'Status',
                'Current Stage',
                'Application Date',
                'Expected Salary',
                'Experience Years',
                'Source',
            ]);

            // CSV data
            foreach ($applications as $application) {
                fputcsv($file, [
                    $application->id,
                    $application->applicant_name,
                    $application->email,
                    $application->phone,
                    $application->status,
                    $application->currentStage?->name,
                    $application->application_date?->format('Y-m-d'),
                    $application->expected_salary,
                    $application->experience_years,
                    $application->source,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate job posting report.
     */
    public function generateJobReport(Request $request, $id)
    {
        $job = Job::with([
            'department',
            'hiringManager',
            'applications.currentStage',
            'hiringStages',
        ])->findOrFail($id);

        $report = [
            'job' => $job,
            'applications_count' => $job->applications()->count(),
            'applications_by_status' => $job->applications()
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'applications_by_stage' => $job->applications()
                ->join('job_hiring_stages', 'job_applications.current_stage_id', '=', 'job_hiring_stages.id')
                ->selectRaw('job_hiring_stages.name, COUNT(*) as count')
                ->groupBy('job_hiring_stages.name')
                ->pluck('count', 'name'),
            'average_time_to_hire' => $this->calculateAverageTimeToHire($job),
            'conversion_rate' => $this->calculateConversionRate($job),
        ];

        if ($request->wantsJson()) {
            return response()->json($report);
        }

        return view('hr.recruitment.reports.job', compact('report'));
    }

    /**
     * Calculate average time to hire for a job.
     */
    private function calculateAverageTimeToHire(Job $job): ?float
    {
        $hiredApplications = $job->applications()
            ->where('status', 'hired')
            ->whereNotNull('application_date')
            ->get();

        if ($hiredApplications->isEmpty()) {
            return null;
        }

        $totalDays = 0;
        foreach ($hiredApplications as $application) {
            $totalDays += $application->application_date->diffInDays($application->updated_at);
        }

        return round($totalDays / $hiredApplications->count(), 1);
    }

    /**
     * Calculate conversion rate from application to hire.
     */
    private function calculateConversionRate(Job $job): float
    {
        $totalApplications = $job->applications()->count();
        $hiredApplications = $job->applications()->where('status', 'hired')->count();

        if ($totalApplications === 0) {
            return 0;
        }

        return round(($hiredApplications / $totalApplications) * 100, 2);
    }

    /**
     * Publish a job posting
     */
    public function publish($id)
    {
        $job = Job::findOrFail($id);

        $job->update([
            'status' => 'published',
            'posting_date' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Job posting published successfully',
        ]);
    }

    /**
     * Unpublish a job posting
     */
    public function unpublish($id)
    {
        $job = Job::findOrFail($id);

        $job->update([
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Job posting unpublished successfully',
        ]);
    }

    /**
     * Close a job posting
     */
    public function close($id)
    {
        $job = Job::findOrFail($id);

        $job->update([
            'status' => 'closed',
            'closing_date' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Job posting closed successfully',
        ]);
    }

    /**
     * Display Kanban board view for recruitment pipeline
     */
    public function kanban($id)
    {
        $job = Job::with([
            'department',
            'hiringManager',
            'hiringStages' => function ($query) {
                $query->orderBy('sequence');
            },
        ])->findOrFail($id);

        // Get applications grouped by stage
        $applications = $job->applications()->with(['applicant', 'currentStage'])->get();
        $hiringStages = $job->hiringStages;

        // Group applications by stage
        $applicationsByStage = [];
        foreach ($hiringStages as $stage) {
            $stageApplications = $applications->where('current_stage_id', $stage->id);

            $applicationsByStage[$stage->id] = [
                'stage' => $stage,
                'applications' => $stageApplications->values(),
                'count' => $stageApplications->count(),
            ];
        }

        return Inertia::render('Pages/HRM/Recruitment/Kanban', [
            'job' => $job,
            'hiringStages' => $hiringStages,
            'applicationsByStage' => $applicationsByStage,
            'departments' => Department::select('id', 'name')->get(),
            'jobTypes' => [
                ['id' => 'full_time', 'name' => 'Full Time'],
                ['id' => 'part_time', 'name' => 'Part Time'],
                ['id' => 'contract', 'name' => 'Contract'],
                ['id' => 'temporary', 'name' => 'Temporary'],
                ['id' => 'internship', 'name' => 'Internship'],
                ['id' => 'remote', 'name' => 'Remote'],
            ],
        ]);
    }

    /**
     * Update application stage via AJAX (for Kanban drag & drop)
     */
    public function updateStage(Request $request, $id, $applicationId)
    {
        $application = JobApplication::where('job_id', $id)->findOrFail($applicationId);

        $validated = $request->validate([
            'stage_id' => 'required|exists:job_hiring_stages,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $previousStageId = $application->current_stage_id;

        // Create stage history entry
        $application->stageHistory()->create([
            'stage_id' => $validated['stage_id'],
            'previous_stage_id' => $previousStageId,
            'changed_by' => Auth::id(),
            'changed_at' => now(),
            'notes' => $validated['notes'] ?? 'Stage updated via Kanban',
        ]);

        // Update application
        $application->update([
            'current_stage_id' => $validated['stage_id'],
            'last_status_change' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Candidate moved successfully',
            'application' => $application->load('currentStage'),
        ]);
    }
}
