<?php

namespace Aero\HRM\Http\Controllers\Performance;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\PerformanceReview;
use Aero\HRM\Models\PerformanceReviewTemplate;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PerformanceReviewController extends Controller
{
    /**
     * Display the HR dashboard.
     */
    public function dashboard()
    {
        // Get statistics for the dashboard
        $totalReviews = PerformanceReview::count();
        $pendingReviews = PerformanceReview::where('status', 'pending')->count();
        $completedReviews = PerformanceReview::where('status', 'completed')->count();
        $averageRating = PerformanceReview::whereNotNull('overall_rating')->avg('overall_rating');

        // Recent reviews
        $recentReviews = PerformanceReview::with(['employee', 'reviewer'])
            ->latest()
            ->take(5)
            ->get();

        // Upcoming reviews
        $upcomingReviews = PerformanceReview::with(['employee', 'reviewer'])
            ->where('status', 'scheduled')
            ->orderBy('review_date')
            ->take(5)
            ->get();

        return Inertia::render('Pages/HRM/Dashboard', [
            'stats' => [
                'totalReviews' => $totalReviews,
                'pendingReviews' => $pendingReviews,
                'completedReviews' => $completedReviews,
                'averageRating' => $averageRating,
            ],
            'recentReviews' => $recentReviews,
            'upcomingReviews' => $upcomingReviews,
        ]);
    }

    /**
     * Display a listing of performance reviews.
     */
    public function index(Request $request)
    {
        $reviews = PerformanceReview::with(['employee', 'reviewer', 'department'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('employee', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('reviewer', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->orderBy($request->input('sort_by', 'review_date'), $request->input('sort_order', 'desc'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Pages/HRM/Performance/Index', [
            'reviews' => $reviews,
            'filters' => $request->only(['search', 'status', 'department_id', 'sort_by', 'sort_order']),
            'departments' => Department::select('id', 'name')->get(),
            'statuses' => [
                ['id' => 'scheduled', 'name' => 'Scheduled'],
                ['id' => 'in_progress', 'name' => 'In Progress'],
                ['id' => 'pending_acknowledgment', 'name' => 'Pending Acknowledgment'],
                ['id' => 'completed', 'name' => 'Completed'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
        ]);
    }

    /**
     * Show the form for creating a new performance review.
     */
    public function create()
    {
        return Inertia::render('Pages/HRM/Performance/Create', [
            'employees' => User::role('Employee')->get(['id', 'name']),
            'reviewers' => User::role(['HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'departments' => Department::all(['id', 'name']),
            'templates' => PerformanceReviewTemplate::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created performance review in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'reviewer_id' => 'required|exists:users,id',
            'review_period_start' => 'required|date',
            'review_period_end' => 'required|date|after:review_period_start',
            'review_date' => 'required|date',
            'department_id' => 'required|exists:departments,id',
            'template_id' => 'required|exists:performance_review_templates,id',
            'status' => 'required|in:scheduled,in_progress,pending_acknowledgment,completed,cancelled',
        ]);

        $review = PerformanceReview::create($validated);

        return redirect()->route('hr.performance.show', $review->id)
            ->with('success', 'Performance review scheduled successfully.');
    }

    /**
     * Display the specified performance review.
     */
    public function show($id)
    {
        $review = PerformanceReview::with([
            'employee',
            'reviewer',
            'department',
            'template',
            'competencyRatings.competency.category',
        ])->findOrFail($id);

        return Inertia::render('Pages/HRM/Performance/Show', [
            'review' => $review,
        ]);
    }

    /**
     * Show the form for editing the specified performance review.
     */
    public function edit($id)
    {
        $review = PerformanceReview::with([
            'employee',
            'reviewer',
            'department',
            'template',
            'competencyRatings.competency.category',
        ])->findOrFail($id);

        return Inertia::render('Pages/HRM/Performance/Edit', [
            'review' => $review,
            'employees' => User::role('Employee')->get(['id', 'name']),
            'reviewers' => User::role(['HR Manager', 'Department Manager', 'Team Lead'])->get(['id', 'name']),
            'departments' => Department::all(['id', 'name']),
            'templates' => PerformanceReviewTemplate::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified performance review in storage.
     */
    public function update(Request $request, $id)
    {
        $review = PerformanceReview::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'reviewer_id' => 'required|exists:users,id',
            'review_period_start' => 'required|date',
            'review_period_end' => 'required|date|after:review_period_start',
            'review_date' => 'required|date',
            'department_id' => 'required|exists:departments,id',
            'template_id' => 'required|exists:performance_review_templates,id',
            'status' => 'required|in:scheduled,in_progress,pending_acknowledgment,completed,cancelled',
            'overall_rating' => 'nullable|numeric|min:1|max:5',
            'goals_achieved' => 'nullable|string',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'comments' => 'nullable|string',
            'employee_comments' => 'nullable|string',
            'next_review_date' => 'nullable|date',
        ]);

        $review->update($validated);

        return redirect()->route('hr.performance.show', $review->id)
            ->with('success', 'Performance review updated successfully.');
    }

    /**
     * Remove the specified performance review from storage.
     */
    public function destroy($id)
    {
        $review = PerformanceReview::findOrFail($id);
        $review->delete();

        return redirect()->route('hr.performance.index')
            ->with('success', 'Performance review deleted successfully.');
    }

    /**
     * Display a listing of performance review templates.
     */
    public function templates()
    {
        $templates = PerformanceReviewTemplate::with('creator')
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('Pages/HRM/Performance/Templates/Index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Show the form for creating a new performance review template.
     */
    public function createTemplate()
    {
        return Inertia::render('Pages/HRM/Performance/Templates/Create', [
            'departments' => Department::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created performance review template in storage.
     */
    public function storeTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,inactive',
            'default_for_department_id' => 'nullable|exists:departments,id',
            'is_active' => 'boolean',
        ]);

        $validated['created_by'] = Auth::id();

        $template = PerformanceReviewTemplate::create($validated);

        return redirect()->route('hr.performance.templates.show', $template->id)
            ->with('success', 'Performance review template created successfully.');
    }

    /**
     * Display the specified performance review template.
     */
    public function showTemplate($id)
    {
        $template = PerformanceReviewTemplate::with([
            'creator',
            'defaultForDepartment',
            'competencyCategories.competencies',
        ])->findOrFail($id);

        return Inertia::render('Pages/HRM/Performance/Templates/Show', [
            'template' => $template,
        ]);
    }

    /**
     * Show the form for editing the specified performance review template.
     */
    public function editTemplate($id)
    {
        $template = PerformanceReviewTemplate::with([
            'creator',
            'defaultForDepartment',
            'competencyCategories.competencies',
        ])->findOrFail($id);

        return Inertia::render('Pages/HRM/Performance/Templates/Edit', [
            'template' => $template,
            'departments' => Department::all(['id', 'name']),
        ]);
    }

    /**
     * Update the specified performance review template in storage.
     */
    public function updateTemplate(Request $request, $id)
    {
        $template = PerformanceReviewTemplate::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,inactive',
            'default_for_department_id' => 'nullable|exists:departments,id',
            'is_active' => 'boolean',
        ]);

        $template->update($validated);

        return redirect()->route('hr.performance.templates.show', $template->id)
            ->with('success', 'Performance review template updated successfully.');
    }

    /**
     * Remove the specified performance review template from storage.
     */
    public function destroyTemplate($id)
    {
        $template = PerformanceReviewTemplate::findOrFail($id);
        $template->delete();

        return redirect()->route('hr.performance.templates.index')
            ->with('success', 'Performance review template deleted successfully.');
    }
}
