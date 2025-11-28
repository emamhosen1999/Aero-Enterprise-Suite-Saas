<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        return Inertia::render('LMS/Courses/Index', [
            'courses' => Course::with(['category', 'instructor'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('LMS/Courses/Create', [
            'categories' => CourseCategory::where('is_active', true)->get(),
            'instructors' => User::whereHas('roles', function ($query) {
                $query->where('name', 'instructor');
            })->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'objectives' => 'nullable|string',
            'level' => 'required|in:beginner,intermediate,advanced',
            'duration_minutes' => 'required|integer|min:0',
            'thumbnail' => 'nullable|string',
            'instructor_id' => 'nullable|exists:users,id',
            'price' => 'required|numeric|min:0',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'categories' => 'array',
            'categories.*' => 'exists:course_categories,id',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $course = Course::create($validated);

            if ($request->has('categories')) {
                $course->categories()->attach($request->categories);
            }
        });

        return redirect()->route('lms.courses.index')->with('status', 'Course created successfully');
    }

    public function show(Course $course)
    {
        return Inertia::render('LMS/Courses/Show', [
            'course' => $course->load(['categories', 'instructor', 'modules.lessons']),
            'enrollmentsCount' => $course->enrollments()->count(),
            'completionsCount' => $course->enrollments()->where('status', 'completed')->count(),
        ]);
    }

    public function edit(Course $course)
    {
        return Inertia::render('LMS/Courses/Edit', [
            'course' => $course->load(['categories']),
            'categories' => CourseCategory::where('is_active', true)->get(),
            'instructors' => User::whereHas('roles', function ($query) {
                $query->where('name', 'instructor');
            })->get(),
        ]);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'objectives' => 'nullable|string',
            'level' => 'required|in:beginner,intermediate,advanced',
            'duration_minutes' => 'required|integer|min:0',
            'thumbnail' => 'nullable|string',
            'instructor_id' => 'nullable|exists:users,id',
            'price' => 'required|numeric|min:0',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'categories' => 'array',
            'categories.*' => 'exists:course_categories,id',
        ]);

        DB::transaction(function () use ($validated, $request, $course) {
            $course->update($validated);

            if ($request->has('categories')) {
                $course->categories()->sync($request->categories);
            }
        });

        return redirect()->route('lms.courses.index')->with('status', 'Course updated successfully');
    }

    public function destroy(Course $course)
    {
        $course->delete();

        return redirect()->route('lms.courses.index')->with('status', 'Course deleted successfully');
    }
}
