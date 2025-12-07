<?php

namespace App\Http\Controllers\ProjectManagement;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResourceController extends Controller
{
    /**
     * Display project resources
     */
    public function index(Project $project)
    {
        $resources = ProjectResource::with(['user', 'project'])
            ->where('project_id', $project->id)
            ->get();

        return Inertia::render('ProjectManagement/Resources/Index', [
            'project' => $project,
            'resources' => $resources,
            'availableUsers' => User::whereNotIn('id', $resources->pluck('user_id'))
                ->select('id', 'name', 'email')
                ->get(),
            'stats' => $this->getResourceStats($project),
        ]);
    }

    /**
     * Assign resource to project
     */
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|string|max:255',
            'allocation_percentage' => 'required|integer|min:1|max:100',
            'hourly_rate' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'responsibilities' => 'nullable|string',
        ]);

        // Check if user is already assigned to this project
        $existingResource = ProjectResource::where('project_id', $project->id)
            ->where('user_id', $validated['user_id'])
            ->where('status', 'active')
            ->first();

        if ($existingResource) {
            return redirect()->back()->withErrors(['user_id' => 'User is already assigned to this project']);
        }

        ProjectResource::create([
            'project_id' => $project->id,
            'user_id' => $validated['user_id'],
            'role' => $validated['role'],
            'allocation_percentage' => $validated['allocation_percentage'],
            'hourly_rate' => $validated['hourly_rate'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'responsibilities' => $validated['responsibilities'],
            'status' => 'active',
        ]);

        return redirect()->back()->with('success', 'Resource assigned successfully');
    }

    /**
     * Update resource assignment
     */
    public function update(Request $request, Project $project, ProjectResource $resource)
    {
        $validated = $request->validate([
            'role' => 'required|string|max:255',
            'allocation_percentage' => 'required|integer|min:1|max:100',
            'hourly_rate' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'responsibilities' => 'nullable|string',
            'status' => 'required|in:active,inactive,completed',
        ]);

        $resource->update($validated);

        return redirect()->back()->with('success', 'Resource updated successfully');
    }

    /**
     * Remove resource from project
     */
    public function destroy(Project $project, ProjectResource $resource)
    {
        $resource->delete();

        return redirect()->back()->with('success', 'Resource removed from project');
    }

    /**
     * Get resource utilization
     */
    public function utilization(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $resources = ProjectResource::with(['user', 'project'])
            ->whereBetween('start_date', [$startDate, $endDate])
            ->orWhereBetween('end_date', [$startDate, $endDate])
            ->get();

        $utilization = $resources->groupBy('user_id')->map(function ($userResources) {
            $totalAllocation = $userResources->sum('allocation_percentage');
            $user = $userResources->first()->user;

            return [
                'user' => $user,
                'total_allocation' => min($totalAllocation, 100), // Cap at 100%
                'project_count' => $userResources->count(),
                'projects' => $userResources->map(function ($resource) {
                    return [
                        'project' => $resource->project,
                        'allocation' => $resource->allocation_percentage,
                        'role' => $resource->role,
                    ];
                }),
                'utilization_status' => $totalAllocation > 100 ? 'overallocated' : ($totalAllocation > 80 ? 'high' : ($totalAllocation > 50 ? 'medium' : 'low')),
            ];
        });

        return response()->json($utilization);
    }

    /**
     * Get resource statistics for a project
     */
    private function getResourceStats(Project $project)
    {
        $resources = ProjectResource::where('project_id', $project->id)->get();

        return [
            'total_resources' => $resources->count(),
            'active_resources' => $resources->where('status', 'active')->count(),
            'total_allocation' => $resources->where('status', 'active')->sum('allocation_percentage'),
            'estimated_cost' => $resources->sum(function ($resource) {
                $hours = $resource->allocation_percentage / 100 * 40; // Assuming 40 hours per week

                return $hours * ($resource->hourly_rate ?? 0);
            }),
            'roles' => $resources->groupBy('role')->map->count(),
        ];
    }

    /**
     * Display all resources across projects
     */
    public function globalIndex()
    {
        $resources = ProjectResource::with(['user', 'project'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ProjectManagement/Resources/GlobalIndex', [
            'resources' => $resources,
        ]);
    }
}
