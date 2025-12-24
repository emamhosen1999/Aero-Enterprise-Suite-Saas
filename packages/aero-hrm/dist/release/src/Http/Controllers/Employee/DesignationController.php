<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DesignationController extends Controller
{
    public function __construct()
    {
        // Apply authorization middleware or policies
        $this->middleware('can:manage-designations');
    }

    /**
     * Render the Designations page with dropdown data and stats.
     */
    public function index(Request $request): \Inertia\Response
    {
        $managers = User::whereHas('roles', function ($q) {
            $q->where('name', 'like', '%Manager%')
                ->orWhere('name', 'like', '%Director%')
                ->orWhere('name', 'like', '%Head%');
        })->get(['id', 'name']);

        $parentDesignations = Designation::whereNull('parent_id')
            ->orWhere('parent_id', 0)
            ->get(['id', 'title']);

        $stats = [
            'total' => Designation::count(),
            'active' => Designation::where('is_active', true)->count(),
            'inactive' => Designation::where('is_active', false)->count(),
            'parent_designations' => Designation::whereNull('parent_id')->orWhere('parent_id', 0)->count(),
        ];
        $departments = Department::all(['id', 'name']);
        $allDesignations = Designation::with('department')->orderBy('hierarchy_level', 'asc')->get();

        return Inertia::render('Designations', [
            'title' => 'Designation Management',
            'designations' => [], // Loaded via frontend API
            'allDesignations' => $allDesignations,
            'departments' => $departments,
            'managers' => $managers,
            'parentDesignations' => $parentDesignations,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'department', 'parent_designation']),
        ]);
    }

    /**
     * Fetch paginated designations with filters applied.
     */
    public function getDesignations(Request $request)
    {
        $query = Designation::with(['department', 'users']);

        // Apply search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%");
        }

        // Filter by department
        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department_id', $request->department);
        }

        // Filter by active/inactive
        if ($request->status && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        // Filter by parent designation
        if ($request->parent_designation && $request->parent_designation !== 'all') {
            $query->where(function ($q) use ($request) {
                if ($request->parent_designation === 'none') {
                    $q->whereNull('parent_id')->orWhere('parent_id', 0);
                } else {
                    $q->where('parent_id', $request->parent_designation);
                }
            });
        }

        $designations = $query->paginate($request->input('per_page', 10));

        $designations->getCollection()->transform(function ($designation) {
            return [
                'id' => $designation->id,
                'title' => $designation->title,
                'department_id' => $designation->department_id,
                'department_name' => optional($designation->department)->name,
                'parent_id' => $designation->parent_id,
                'hierarchy_level' => $designation->hierarchy_level,
                'employee_count' => $designation->employee_count,
                'is_active' => $designation->is_active,
            ];
        });

        Log::info('Fetched designations:', $designations->toArray());

        return response()->json(['designations' => $designations]);
    }

    /**
     * Update a user's designation.
     */
    public function updateUserDesignation(Request $request, $id)
    {
        $request->validate([
            'designation_id' => 'required|exists:designations,id',
        ]);

        $user = User::findOrFail($id);
        $employee = $user->employee;

        if (! $employee) {
            return response()->json(['errors' => ['user' => 'User is not an employee. Please onboard them first.']], 422);
        }

        $employee->designation_id = $request->input('designation_id');
        $employee->save();

        return response()->json(['messages' => ['Designation updated successfully']], 200);
    }

    /**
     * Create a new designation.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'hierarchy_level' => 'required|integer|min:1|max:10',
            'parent_id' => 'nullable|exists:designations,id',
            'is_active' => 'boolean',
        ]);

        $designation = Designation::create([
            ...$validated,
            // Optionally track who created it
            // 'created_by' => Auth::id(),
        ]);

        return response()->json(['designation' => $designation, 'message' => 'Designation created successfully'], 201);
    }

    /**
     * Show a single designation.
     */
    public function show($id)
    {
        $designation = Designation::with('department')->findOrFail($id);

        return response()->json(['designation' => $designation]);
    }

    /**
     * Update an existing designation.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'hierarchy_level' => 'required|integer|min:1|max:10',
            'parent_id' => 'nullable|exists:designations,id',
            'is_active' => 'boolean',
        ]);

        $designation = Designation::findOrFail($id);
        $designation->update([
            ...$validated,
            // 'updated_by' => Auth::id(),
        ]);

        return response()->json(['designation' => $designation, 'message' => 'Designation updated successfully']);
    }

    /**
     * Delete a designation (if no employees assigned).
     */
    public function destroy($id)
    {
        $designation = Designation::findOrFail($id);

        if ($designation->employee_count > 0) {
            return response()->json(['error' => 'Cannot delete designation with assigned employees.'], 400);
        }

        $designation->delete(); // Soft delete if using SoftDeletes

        return response()->json(['message' => 'Designation deleted successfully.']);
    }

    /**
     * Get list of active designations for dropdowns.
     */
    public function list()
    {
        return response()->json(
            Designation::select('id', 'title')
                ->where('is_active', true)
                ->get()
        );
    }

    /**
     * Get designation statistics for frontend analytics.
     */
    public function stats()
    {
        $stats = [
            'total' => Designation::count(),
            'active' => Designation::where('is_active', true)->count(),
            'inactive' => Designation::where('is_active', false)->count(),
            'parent_designations' => Designation::whereNull('parent_id')->orWhere('parent_id', 0)->count(),
        ];

        return response()->json(['stats' => $stats]);
    }
}
