<?php

namespace Aero\HRM\Http\Controllers;

use Aero\HRM\Models\CareerPath;
use Aero\HRM\Models\CareerPathMilestone;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeeCareerProgression;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Career Path Controller
 *
 * Manages career paths and employee career progressions.
 */
class CareerPathController extends Controller
{
    /**
     * Display career pathing dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('HRM/CareerPath/Index', [
            'title' => 'Career Pathing',
        ]);
    }

    /**
     * Get paginated career paths.
     */
    public function paginate(Request $request)
    {
        $perPage = $request->input('perPage', 15);
        $search = $request->input('search', '');
        $departmentId = $request->input('department_id', '');

        $query = CareerPath::query()
            ->with(['department', 'createdBy'])
            ->withCount('milestones')
            ->withCount('employeeProgressions');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return response()->json([
            'items' => $query->where('is_active', true)->orderBy('name')->paginate($perPage),
        ]);
    }

    /**
     * Get career path statistics.
     */
    public function stats()
    {
        $totalPaths = CareerPath::where('is_active', true)->count();
        $totalMilestones = CareerPathMilestone::count();
        $employeesOnPath = EmployeeCareerProgression::where('status', 'in_progress')->count();
        $completedProgressions = EmployeeCareerProgression::where('status', 'completed')->count();

        return response()->json([
            'total_paths' => $totalPaths,
            'total_milestones' => $totalMilestones,
            'employees_on_path' => $employeesOnPath,
            'completed_progressions' => $completedProgressions,
        ]);
    }

    /**
     * Store a new career path.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'path_type' => 'required|in:technical,management,specialist,hybrid',
            'typical_duration_months' => 'nullable|integer|min:1',
            'required_competencies' => 'nullable|array',
        ]);

        $validated['is_active'] = true;
        $validated['created_by'] = auth()->id();

        $path = CareerPath::create($validated);

        return response()->json([
            'message' => 'Career path created successfully',
            'data' => $path->load('department'),
        ]);
    }

    /**
     * Show a specific career path with milestones.
     */
    public function show(int $id)
    {
        $path = CareerPath::with([
            'department',
            'milestones.designation',
            'employeeProgressions.employee',
            'createdBy',
        ])->findOrFail($id);

        return response()->json(['data' => $path]);
    }

    /**
     * Update a career path.
     */
    public function update(Request $request, int $id)
    {
        $path = CareerPath::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'path_type' => 'required|in:technical,management,specialist,hybrid',
            'typical_duration_months' => 'nullable|integer|min:1',
            'required_competencies' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $path->update($validated);

        return response()->json([
            'message' => 'Career path updated successfully',
            'data' => $path->fresh('department'),
        ]);
    }

    /**
     * Delete a career path.
     */
    public function destroy(int $id)
    {
        $path = CareerPath::findOrFail($id);
        $path->update(['is_active' => false]);

        return response()->json(['message' => 'Career path archived successfully']);
    }

    /**
     * Get milestones for a career path.
     */
    public function milestones(int $id)
    {
        $milestones = CareerPathMilestone::where('career_path_id', $id)
            ->with('designation')
            ->orderBy('sequence')
            ->get();

        return response()->json(['data' => $milestones]);
    }

    /**
     * Add a milestone to a career path.
     */
    public function addMilestone(Request $request, int $id)
    {
        $path = CareerPath::findOrFail($id);

        $validated = $request->validate([
            'designation_id' => 'nullable|exists:designations,id',
            'sequence' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_experience_months' => 'nullable|integer|min:0',
            'required_skills' => 'nullable|array',
            'required_certifications' => 'nullable|array',
            'required_training' => 'nullable|array',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0',
        ]);

        $validated['career_path_id'] = $path->id;

        $milestone = CareerPathMilestone::create($validated);

        return response()->json([
            'message' => 'Milestone added successfully',
            'data' => $milestone->load('designation'),
        ]);
    }

    /**
     * Update a milestone.
     */
    public function updateMilestone(Request $request, int $id, int $milestoneId)
    {
        $milestone = CareerPathMilestone::where('career_path_id', $id)
            ->findOrFail($milestoneId);

        $validated = $request->validate([
            'designation_id' => 'nullable|exists:designations,id',
            'sequence' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_experience_months' => 'nullable|integer|min:0',
            'required_skills' => 'nullable|array',
            'required_certifications' => 'nullable|array',
            'required_training' => 'nullable|array',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0',
        ]);

        $milestone->update($validated);

        return response()->json([
            'message' => 'Milestone updated successfully',
            'data' => $milestone->fresh('designation'),
        ]);
    }

    /**
     * Delete a milestone.
     */
    public function deleteMilestone(int $id, int $milestoneId)
    {
        $milestone = CareerPathMilestone::where('career_path_id', $id)
            ->findOrFail($milestoneId);

        $milestone->delete();

        return response()->json(['message' => 'Milestone deleted successfully']);
    }

    /**
     * Assign an employee to a career path.
     */
    public function assignEmployee(Request $request, int $id)
    {
        $path = CareerPath::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'current_milestone_id' => 'nullable|exists:career_path_milestones,id',
            'target_milestone_id' => 'nullable|exists:career_path_milestones,id',
            'target_completion_date' => 'nullable|date',
            'mentor_id' => 'nullable|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        $validated['career_path_id'] = $path->id;
        $validated['status'] = 'in_progress';
        $validated['progress_percentage'] = 0;
        $validated['started_at'] = now();
        $validated['completed_requirements'] = [];
        $validated['pending_requirements'] = [];

        $progression = EmployeeCareerProgression::create($validated);

        return response()->json([
            'message' => 'Employee assigned to career path successfully',
            'data' => $progression->load(['employee', 'currentMilestone', 'targetMilestone']),
        ]);
    }

    /**
     * Update employee progression.
     */
    public function updateProgression(Request $request, int $id, int $progressionId)
    {
        $progression = EmployeeCareerProgression::where('career_path_id', $id)
            ->findOrFail($progressionId);

        $validated = $request->validate([
            'current_milestone_id' => 'nullable|exists:career_path_milestones,id',
            'target_milestone_id' => 'nullable|exists:career_path_milestones,id',
            'progress_percentage' => 'nullable|numeric|min:0|max:100',
            'target_completion_date' => 'nullable|date',
            'completed_requirements' => 'nullable|array',
            'pending_requirements' => 'nullable|array',
            'mentor_id' => 'nullable|exists:employees,id',
            'status' => 'nullable|in:in_progress,on_hold,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $progression->update($validated);

        return response()->json([
            'message' => 'Progression updated successfully',
            'data' => $progression->fresh(['employee', 'currentMilestone', 'targetMilestone']),
        ]);
    }

    /**
     * Get employee progressions.
     */
    public function employeeProgressions(Request $request)
    {
        $perPage = $request->input('perPage', 15);
        $employeeId = $request->input('employee_id', '');
        $status = $request->input('status', '');

        $query = EmployeeCareerProgression::query()
            ->with(['employee.department', 'careerPath', 'currentMilestone', 'targetMilestone', 'mentor']);

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return response()->json([
            'items' => $query->orderByDesc('created_at')->paginate($perPage),
        ]);
    }
}
