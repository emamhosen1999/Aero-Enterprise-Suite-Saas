<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Http\Requests\HR\StoreOffboardingRequest;
use App\Http\Requests\HR\StoreOnboardingRequest;
use App\Http\Requests\HR\UpdateOffboardingRequest;
use App\Http\Requests\HR\UpdateOnboardingRequest;
use App\Models\Checklist;
use App\Models\HRM\Offboarding;
use App\Models\HRM\OffboardingTask;
use App\Models\HRM\Onboarding;
use App\Models\HRM\OnboardingTask;
use App\Models\OffboardingStep;
use App\Models\OnboardingStep;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    /**
     * Display a listing of onboarding processes.
     */
    public function index()
    {
        $this->authorize('viewAny', Onboarding::class);

        $onboardings = Onboarding::with('employee')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('HR/Onboarding/Index', [
            'title' => 'Employee Onboarding',
            'onboardings' => $onboardings,
        ]);
    }

    /**
     * Show the form for creating a new onboarding process.
     */
    public function create()
    {
        $this->authorize('create', Onboarding::class);

        $employees = User::select('id', 'name')
            ->where('active', true) // replaced status check
            ->orderBy('name')
            ->get();

        return Inertia::render('HR/Onboarding/Create', [
            'title' => 'Create Onboarding Process',
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created onboarding process.
     */
    public function store(StoreOnboardingRequest $request)
    {
        $this->authorize('create', Onboarding::class);

        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $onboarding = Onboarding::create([
                'employee_id' => $validated['employee_id'],
                'start_date' => $validated['start_date'],
                'expected_completion_date' => $validated['expected_completion_date'],
                'status' => Onboarding::STATUS_PENDING,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['tasks'] as $taskData) {
                OnboardingTask::create([
                    'onboarding_id' => $onboarding->id,
                    'task' => $taskData['task'],
                    'description' => $taskData['description'] ?? null,
                    'due_date' => $taskData['due_date'] ?? null,
                    'assigned_to' => $taskData['assigned_to'] ?? null,
                    'status' => OnboardingTask::STATUS_PENDING,
                ]);
            }

            DB::commit();

            return redirect()->route('hr.onboarding.show', $onboarding->id)
                ->with('success', 'Onboarding process created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create onboarding process', ['error' => $e->getMessage()]);

            return redirect()->back()
                ->with('error', 'Failed to create onboarding process. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display the specified onboarding process.
     */
    public function show($id)
    {
        $onboarding = Onboarding::with(['employee', 'tasks.assignee'])
            ->findOrFail($id);

        $this->authorize('view', $onboarding);

        return Inertia::render('HR/Onboarding/Show', [
            'title' => 'Onboarding Details',
            'onboarding' => $onboarding,
        ]);
    }

    /**
     * Show the form for editing the specified onboarding process.
     */
    public function edit($id)
    {
        $onboarding = Onboarding::with(['employee', 'tasks'])
            ->findOrFail($id);

        $this->authorize('update', $onboarding);

        $employees = User::select('id', 'name')
            ->orderBy('name')
            ->get();

        $assignees = User::select('id', 'name')
            ->where('active', true) // replaced status check
            ->orderBy('name')
            ->get();

        return Inertia::render('HR/Onboarding/Edit', [
            'title' => 'Edit Onboarding Process',
            'onboarding' => $onboarding,
            'employees' => $employees,
            'assignees' => $assignees,
        ]);
    }

    /**
     * Update the specified onboarding process.
     */
    public function update(UpdateOnboardingRequest $request, $id)
    {
        $onboarding = Onboarding::with('tasks')->findOrFail($id);

        $this->authorize('update', $onboarding);

        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $onboarding->update([
                'start_date' => $validated['start_date'],
                'expected_completion_date' => $validated['expected_completion_date'],
                'actual_completion_date' => $validated['actual_completion_date'] ?? null,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $existingTaskIds = $onboarding->tasks->pluck('id')->toArray();
            $updatedTaskIds = [];

            foreach ($validated['tasks'] as $taskData) {
                if (! empty($taskData['id'])) {
                    $task = OnboardingTask::findOrFail($taskData['id']);
                    $task->update([
                        'task' => $taskData['task'],
                        'description' => $taskData['description'] ?? null,
                        'due_date' => $taskData['due_date'] ?? null,
                        'completed_date' => $taskData['completed_date'] ?? null,
                        'status' => $taskData['status'],
                        'assigned_to' => $taskData['assigned_to'] ?? null,
                        'notes' => $taskData['notes'] ?? null,
                    ]);
                    $updatedTaskIds[] = $task->id;
                } else {
                    $task = OnboardingTask::create([
                        'onboarding_id' => $onboarding->id,
                        'task' => $taskData['task'],
                        'description' => $taskData['description'] ?? null,
                        'due_date' => $taskData['due_date'] ?? null,
                        'completed_date' => $taskData['completed_date'] ?? null,
                        'status' => $taskData['status'],
                        'assigned_to' => $taskData['assigned_to'] ?? null,
                        'notes' => $taskData['notes'] ?? null,
                    ]);
                    $updatedTaskIds[] = $task->id;
                }
            }

            $tasksToDelete = array_diff($existingTaskIds, $updatedTaskIds);
            if ($tasksToDelete) {
                OnboardingTask::whereIn('id', $tasksToDelete)->delete();
            }

            DB::commit();

            return redirect()->route('hr.onboarding.show', $onboarding->id)
                ->with('success', 'Onboarding process updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update onboarding process', ['error' => $e->getMessage(), 'onboarding_id' => $onboarding->id]);

            return redirect()->back()
                ->with('error', 'Failed to update onboarding process. Please try again.')
                ->withInput();
        }
    }

    /**
     * Remove the specified onboarding process.
     */
    public function destroy($id)
    {
        $onboarding = Onboarding::findOrFail($id);

        $this->authorize('delete', $onboarding);

        try {
            $onboarding->delete();

            return redirect()->route('hr.onboarding.index')
                ->with('success', 'Onboarding process deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to delete onboarding process: '.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to delete onboarding process.');
        }
    }

    /**
     * Display a listing of offboarding processes.
     */
    public function offboardingIndex()
    {
        $this->authorize('viewAny', Offboarding::class);

        $offboardings = Offboarding::with('employee')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('HR/Offboarding/Index', [
            'title' => 'Employee Offboarding',
            'offboardings' => $offboardings,
        ]);
    }

    /**
     * Show the form for creating a new offboarding process.
     */
    public function createOffboarding()
    {
        $this->authorize('create', Offboarding::class);

        $employees = User::select('id', 'name')
            ->where('active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('HR/Offboarding/Create', [
            'title' => 'Create Offboarding Process',
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created offboarding process.
     */
    public function storeOffboarding(StoreOffboardingRequest $request)
    {
        $this->authorize('create', Offboarding::class);

        $validated = $request->validated();

        DB::beginTransaction();
        try {
            $offboarding = Offboarding::create([
                'employee_id' => $validated['employee_id'],
                'initiation_date' => $validated['initiation_date'],
                'last_working_date' => $validated['last_working_date'],
                'exit_interview_date' => $validated['exit_interview_date'] ?? null,
                'reason' => $validated['reason'],
                'status' => $validated['status'] ?? Offboarding::STATUS_PENDING,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['tasks'] as $taskData) {
                OffboardingTask::create([
                    'offboarding_id' => $offboarding->id,
                    'task' => $taskData['task'],
                    'description' => $taskData['description'] ?? null,
                    'due_date' => $taskData['due_date'] ?? null,
                    'assigned_to' => $taskData['assigned_to'] ?? null,
                    'status' => OffboardingTask::STATUS_PENDING,
                ]);
            }

            DB::commit();

            return redirect()->route('hr.offboarding.show', $offboarding->id)
                ->with('success', 'Offboarding process created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create offboarding process', ['error' => $e->getMessage()]);

            return redirect()->back()
                ->with('error', 'Failed to create offboarding process. Please try again.')
                ->withInput();
        }
    }

    /**
     * Display the specified offboarding process.
     */
    public function showOffboarding($id)
    {
        $offboarding = Offboarding::with(['employee', 'tasks.assignee'])->findOrFail($id);
        $this->authorize('view', $offboarding);

        return Inertia::render('HR/Offboarding/Show', [
            'title' => 'Offboarding Details',
            'offboarding' => $offboarding,
        ]);
    }

    /**
     * Update the specified offboarding process.
     */
    public function updateOffboarding(UpdateOffboardingRequest $request, $id)
    {
        $offboarding = Offboarding::with('tasks')->findOrFail($id);
        $this->authorize('update', $offboarding);

        $validated = $request->validated();

        DB::beginTransaction();
        try {
            $offboarding->update([
                'initiation_date' => $validated['initiation_date'],
                'last_working_date' => $validated['last_working_date'],
                'exit_interview_date' => $validated['exit_interview_date'] ?? null,
                'reason' => $validated['reason'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $existingTaskIds = $offboarding->tasks->pluck('id')->toArray();
            $updatedTaskIds = [];
            foreach ($validated['tasks'] as $taskData) {
                if (! empty($taskData['id'])) {
                    $task = OffboardingTask::findOrFail($taskData['id']);
                    $task->update([
                        'task' => $taskData['task'],
                        'description' => $taskData['description'] ?? null,
                        'due_date' => $taskData['due_date'] ?? null,
                        'completed_date' => $taskData['completed_date'] ?? null,
                        'status' => $taskData['status'],
                        'assigned_to' => $taskData['assigned_to'] ?? null,
                        'notes' => $taskData['notes'] ?? null,
                    ]);
                    $updatedTaskIds[] = $task->id;
                } else {
                    $task = OffboardingTask::create([
                        'offboarding_id' => $offboarding->id,
                        'task' => $taskData['task'],
                        'description' => $taskData['description'] ?? null,
                        'due_date' => $taskData['due_date'] ?? null,
                        'completed_date' => $taskData['completed_date'] ?? null,
                        'status' => $taskData['status'],
                        'assigned_to' => $taskData['assigned_to'] ?? null,
                        'notes' => $taskData['notes'] ?? null,
                    ]);
                    $updatedTaskIds[] = $task->id;
                }
            }
            $tasksToDelete = array_diff($existingTaskIds, $updatedTaskIds);
            if ($tasksToDelete) {
                OffboardingTask::whereIn('id', $tasksToDelete)->delete();
            }
            DB::commit();

            return redirect()->route('hr.offboarding.show', $offboarding->id)
                ->with('success', 'Offboarding process updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update offboarding process', ['error' => $e->getMessage(), 'offboarding_id' => $offboarding->id]);

            return redirect()->back()
                ->with('error', 'Failed to update offboarding process. Please try again.')
                ->withInput();
        }
    }

    /**
     * Remove the specified offboarding process.
     */
    public function destroyOffboarding($id)
    {
        $offboarding = Offboarding::findOrFail($id);
        $this->authorize('delete', $offboarding);

        try {
            $offboarding->delete();

            return redirect()->route('hr.offboarding.index')
                ->with('success', 'Offboarding process deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to delete offboarding process', [
                'error' => $e->getMessage(),
                'offboarding_id' => $id,
            ]);

            return redirect()->back()
                ->with('error', 'Failed to delete offboarding process.');
        }
    }

    /**
     * Show checklist templates.
     */
    public function checklists()
    {
        $this->authorize('viewAny', Checklist::class);
        $onboardingSteps = OnboardingStep::orderBy('order')->get();
        $offboardingSteps = OffboardingStep::orderBy('order')->get();
        $checklists = Checklist::orderBy('name')->get();

        return Inertia::render('HR/Checklists/Index', [
            'title' => 'Onboarding & Offboarding Checklists',
            'onboardingSteps' => $onboardingSteps,
            'offboardingSteps' => $offboardingSteps,
            'checklists' => $checklists,
        ]);
    }

    /**
     * Store a checklist template.
     */
    public function storeChecklist(\Illuminate\Http\Request $request)
    {
        $this->authorize('create', Checklist::class);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:onboarding,offboarding',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.label' => 'required_with:items|string|max:255',
        ]);
        $checklist = Checklist::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'description' => $data['description'] ?? null,
            'items' => $data['items'] ?? [],
            'active' => true,
        ]);

        return redirect()->back()->with('success', 'Checklist created.');
    }

    /**
     * Update a checklist template.
     */
    public function updateChecklist(\Illuminate\Http\Request $request, $id)
    {
        $checklist = Checklist::findOrFail($id);
        $this->authorize('update', $checklist);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.label' => 'required_with:items|string|max:255',
            'active' => 'sometimes|boolean',
        ]);
        $checklist->update($data);

        return redirect()->back()->with('success', 'Checklist updated.');
    }

    /**
     * Delete a checklist template.
     */
    public function destroyChecklist($id)
    {
        $checklist = Checklist::findOrFail($id);
        $this->authorize('delete', $checklist);
        $checklist->delete();

        return redirect()->back()->with('success', 'Checklist deleted.');
    }
}
