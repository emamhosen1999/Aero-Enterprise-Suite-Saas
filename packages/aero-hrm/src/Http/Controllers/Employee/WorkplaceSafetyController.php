<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\SafetyInspection;
use Aero\HRM\Models\SafetyTraining;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WorkplaceSafetyController extends Controller
{
    /**
     * Display the safety dashboard.
     */
    public function index()
    {
        $this->authorize('viewAny', SafetyInspection::class);

        // Get summary data for dashboard
        $inspectionCount = SafetyInspection::count();
        $incidentCount = DB::table('safety_incidents')->count();
        $trainingCount = SafetyTraining::count();

        // Get recent inspections
        $recentInspections = SafetyInspection::with('department')
            ->orderBy('inspection_date', 'desc')
            ->limit(5)
            ->get();

        // Get recent incidents
        $recentIncidents = DB::table('safety_incidents')
            ->join('departments', 'safety_incidents.department_id', '=', 'departments.id')
            ->join('users', 'safety_incidents.reported_by', '=', 'users.id')
            ->select('safety_incidents.*', 'departments.name as department_name', 'users.name as reporter_name')
            ->orderBy('safety_incidents.created_at', 'desc')
            ->limit(5)
            ->get();

        // Get upcoming trainings
        $upcomingTrainings = SafetyTraining::where('training_date', '>=', now())
            ->orderBy('training_date')
            ->limit(5)
            ->get();

        return Inertia::render('Pages/HRM/Safety/Index', [
            'title' => 'Workplace Safety',
            'summary' => [
                'inspections' => $inspectionCount,
                'incidents' => $incidentCount,
                'trainings' => $trainingCount,
            ],
            'recentInspections' => $recentInspections,
            'recentIncidents' => $recentIncidents,
            'upcomingTrainings' => $upcomingTrainings,
        ]);
    }

    /**
     * Display a listing of safety inspections.
     */
    public function inspections()
    {
        $this->authorize('viewAny', SafetyInspection::class);

        $inspections = SafetyInspection::with(['department', 'inspector'])
            ->orderBy('inspection_date', 'desc')
            ->paginate(10);

        return Inertia::render('Pages/HRM/Safety/Inspections/Index', [
            'title' => 'Safety Inspections',
            'inspections' => $inspections,
        ]);
    }

    /**
     * Show the form for creating a new safety inspection.
     */
    public function createInspection()
    {
        $this->authorize('create', SafetyInspection::class);

        $departments = Department::select('id', 'name')
            ->orderBy('name')
            ->get();

        $inspectors = User::select('id', 'name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Pages/HRM/Safety/Inspections/Create', [
            'title' => 'Create Safety Inspection',
            'departments' => $departments,
            'inspectors' => $inspectors,
        ]);
    }

    /**
     * Store a newly created safety inspection.
     */
    public function storeInspection(Request $request)
    {
        $this->authorize('create', SafetyInspection::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'inspection_date' => 'required|date',
            'location' => 'required|string|max:255',
            'inspector_id' => 'required|exists:users,id',
            'findings' => 'required|string',
            'recommendations' => 'required|string',
            'action_items' => 'nullable|string',
            'status' => 'required|in:scheduled,in-progress,completed,cancelled',
            'follow_up_date' => 'nullable|date|after_or_equal:inspection_date',
        ]);

        try {
            $inspection = SafetyInspection::create([
                'title' => $validated['title'],
                'department_id' => $validated['department_id'],
                'inspection_date' => $validated['inspection_date'],
                'location' => $validated['location'],
                'inspector_id' => $validated['inspector_id'],
                'findings' => $validated['findings'],
                'recommendations' => $validated['recommendations'],
                'action_items' => $validated['action_items'] ?? null,
                'status' => $validated['status'],
                'follow_up_date' => $validated['follow_up_date'] ?? null,
                'created_by' => Auth::id(),
            ]);

            return redirect()->route('hr.safety.inspections.show', $inspection->id)
                ->with('success', 'Safety inspection created successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to create safety inspection: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to create safety inspection. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display the specified safety inspection.
     */
    public function showInspection($id)
    {
        $inspection = SafetyInspection::with(['department', 'inspector', 'creator'])
            ->findOrFail($id);

        $this->authorize('view', $inspection);

        return Inertia::render('Pages/HRM/Safety/Inspections/Show', [
            'title' => 'Safety Inspection Details',
            'inspection' => $inspection,
        ]);
    }

    /**
     * Show the form for editing the specified safety inspection.
     */
    public function editInspection($id)
    {
        $inspection = SafetyInspection::findOrFail($id);

        $this->authorize('update', $inspection);

        $departments = Department::select('id', 'name')
            ->orderBy('name')
            ->get();

        $inspectors = User::select('id', 'name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Pages/HRM/Safety/Inspections/Edit', [
            'title' => 'Edit Safety Inspection',
            'inspection' => $inspection,
            'departments' => $departments,
            'inspectors' => $inspectors,
        ]);
    }

    /**
     * Update the specified safety inspection.
     */
    public function updateInspection(Request $request, $id)
    {
        $inspection = SafetyInspection::findOrFail($id);

        $this->authorize('update', $inspection);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'inspection_date' => 'required|date',
            'location' => 'required|string|max:255',
            'inspector_id' => 'required|exists:users,id',
            'findings' => 'required|string',
            'recommendations' => 'required|string',
            'action_items' => 'nullable|string',
            'status' => 'required|in:scheduled,in-progress,completed,cancelled',
            'follow_up_date' => 'nullable|date|after_or_equal:inspection_date',
        ]);

        try {
            $inspection->update([
                'title' => $validated['title'],
                'department_id' => $validated['department_id'],
                'inspection_date' => $validated['inspection_date'],
                'location' => $validated['location'],
                'inspector_id' => $validated['inspector_id'],
                'findings' => $validated['findings'],
                'recommendations' => $validated['recommendations'],
                'action_items' => $validated['action_items'] ?? null,
                'status' => $validated['status'],
                'follow_up_date' => $validated['follow_up_date'] ?? null,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->route('hr.safety.inspections.show', $inspection->id)
                ->with('success', 'Safety inspection updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update safety inspection: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to update safety inspection. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display a listing of safety trainings.
     */
    public function training()
    {
        $this->authorize('viewAny', SafetyTraining::class);

        $trainings = SafetyTraining::with(['department', 'trainer'])
            ->orderBy('training_date', 'desc')
            ->paginate(10);

        return Inertia::render('Pages/HRM/Safety/Training/Index', [
            'title' => 'Safety Training',
            'trainings' => $trainings,
        ]);
    }

    /**
     * Show the form for creating a new safety training.
     */
    public function createTraining()
    {
        $this->authorize('create', SafetyTraining::class);

        $departments = Department::select('id', 'name')
            ->orderBy('name')
            ->get();

        $trainers = User::select('id', 'name')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Pages/HRM/Safety/Training/Create', [
            'title' => 'Schedule Safety Training',
            'departments' => $departments,
            'trainers' => $trainers,
        ]);
    }

    /**
     * Store a newly created safety training.
     */
    public function storeTraining(Request $request)
    {
        $this->authorize('create', SafetyTraining::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'training_date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'location' => 'required|string|max:255',
            'trainer_id' => 'required|exists:users,id',
            'max_participants' => 'nullable|integer|min:1',
            'status' => 'required|in:scheduled,in-progress,completed,cancelled',
            'materials' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        try {
            $training = SafetyTraining::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'department_id' => $validated['department_id'],
                'training_date' => $validated['training_date'],
                'duration' => $validated['duration'],
                'location' => $validated['location'],
                'trainer_id' => $validated['trainer_id'],
                'max_participants' => $validated['max_participants'] ?? null,
                'status' => $validated['status'],
                'materials' => $validated['materials'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            return redirect()->route('hr.safety.training.show', $training->id)
                ->with('success', 'Safety training scheduled successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to schedule safety training: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to schedule safety training. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display the specified safety training.
     */
    public function showTraining($id)
    {
        $training = SafetyTraining::with(['department', 'trainer', 'participants.user'])
            ->findOrFail($id);

        $this->authorize('view', $training);

        return Inertia::render('Pages/HRM/Safety/Training/Show', [
            'title' => 'Safety Training Details',
            'training' => $training,
        ]);
    }

    /**
     * Update the specified safety training.
     */
    public function updateTraining(Request $request, $id)
    {
        $training = SafetyTraining::findOrFail($id);

        $this->authorize('update', $training);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'training_date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'location' => 'required|string|max:255',
            'trainer_id' => 'required|exists:users,id',
            'max_participants' => 'nullable|integer|min:1',
            'status' => 'required|in:scheduled,in-progress,completed,cancelled',
            'materials' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        try {
            $training->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'department_id' => $validated['department_id'],
                'training_date' => $validated['training_date'],
                'duration' => $validated['duration'],
                'location' => $validated['location'],
                'trainer_id' => $validated['trainer_id'],
                'max_participants' => $validated['max_participants'] ?? null,
                'status' => $validated['status'],
                'materials' => $validated['materials'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->route('hr.safety.training.show', $training->id)
                ->with('success', 'Safety training updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update safety training: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to update safety training. Please try again.')
                ->withInput();
        }
    }
}
