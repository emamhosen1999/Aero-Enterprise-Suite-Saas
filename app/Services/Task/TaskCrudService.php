<?php

namespace App\Services\Task;

use App\Models\Tasks;
use App\Models\User;
use App\Models\WorkLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskCrudService
{
    private TaskValidationService $validationService;

    private TaskNotificationService $notificationService;

    public function __construct(
        TaskValidationService $validationService,
        TaskNotificationService $notificationService
    ) {
        $this->validationService = $validationService;
        $this->notificationService = $notificationService;
    }

    /**
     * Create a new task
     */
    public function create(Request $request): array
    {
        $validatedData = $this->validationService->validateAddRequest($request);

        // Check if task with same number already exists
        $existingTask = Tasks::where('number', $validatedData['number'])->first();
        if ($existingTask) {
            throw new \Exception('A task with the same RFI number already exists.');
        }

        $workLocation = $this->findWorkLocationForTask($validatedData['location']);

        if (! $workLocation) {
            throw new \Exception('No work location found for the specified location');
        }

        $task = new Tasks;
        $task->date = $validatedData['date'];
        $task->number = $validatedData['number'];
        $task->planned_time = $validatedData['time'];
        $task->status = $validatedData['status'];
        $task->type = $validatedData['type'];
        $task->description = $validatedData['description'];
        $task->location = $validatedData['location'];
        $task->side = $validatedData['side'];
        $task->qty_layer = $validatedData['qty_layer'] ?? null;
        $task->completion_time = $validatedData['completion_time'] ?? null;
        $task->inspection_details = $validatedData['inspection_details'] ?? null;
        $task->incharge = $workLocation->incharge;
        $task->save();

        return [
            'message' => 'Task added successfully',
            'task' => $task,
        ];
    }

    /**
     * Update an existing task
     */
    public function update(Request $request): array
    {
        $validatedData = $this->validationService->validateUpdateRequest($request);

        $task = Tasks::find($validatedData['id']);

        if (! $task) {
            throw new \Exception('Task not found');
        }

        $oldStatus = $task->status;
        $messages = [];

        // Update basic fields
        $messages = array_merge($messages, $this->updateBasicFields($task, $validatedData));

        // Update additional fields
        $messages = array_merge($messages, $this->updateAdditionalFields($task, $request));

        $task->save();

        // Send notifications if status changed
        if ($oldStatus !== $task->status) {
            $this->notificationService->sendTaskStatusUpdateNotification($task, $oldStatus, $task->status);

            if ($task->status === 'completed') {
                $this->notificationService->sendTaskCompletionNotification($task);
            }
        }

        return [
            'messages' => $messages,
            'task' => $task,
        ];
    }

    /**
     * Delete a task
     */
    public function delete(Request $request): array
    {
        $request->validate([
            'id' => 'required|exists:tasks,id',
        ]);

        $task = Tasks::find($request->id);

        if (! $task) {
            throw new \Exception('Task not found');
        }

        $task->delete();

        return ['message' => 'Task deleted successfully'];
    }

    /**
     * Get all tasks based on user role
     */
    public function getAllTasks(Request $request): array
    {
        $user = Auth::user();

        $tasks = $this->buildTaskQuery($user)->get();

        return [
            'tasks' => $tasks,
            'userInfo' => $this->getUserInfo($user),
        ];
    }

    /**
     * Find work location for a task based on location
     */
    private function findWorkLocationForTask(string $location): ?WorkLocation
    {
        $k = intval(substr($location, 1)); // Extracting the numeric part after 'K'

        return WorkLocation::where('start_chainage', '<=', $k)
            ->where('end_chainage', '>=', $k)
            ->first();
    }

    /**
     * Build task query based on user designation
     */
    private function buildTaskQuery(User $user)
    {
        $userWithDesignation = User::with('designation')->find($user->id);
        $userDesignationTitle = $userWithDesignation->designation?->title;

        if ($userDesignationTitle === 'Supervision Engineer') {
            return Tasks::with('reports')->where('incharge', $user->user_name);
        }

        if (in_array($userDesignationTitle, ['Quality Control Inspector', 'Asst. Quality Control Inspector'])) {
            return Tasks::with('reports')->where('assigned', $user->user_name);
        }

        if ($user->hasRole('Administrator')) {
            return Tasks::with('reports');
        }

        return Tasks::query();
    }

    /**
     * Get user info for response based on designation
     */
    private function getUserInfo(User $user): array
    {
        $userWithDesignation = User::with('designation')->find($user->id);
        $userDesignationTitle = $userWithDesignation->designation?->title;

        if ($userDesignationTitle === 'Supervision Engineer') {
            return [
                'incharges' => [],
                'juniors' => User::where('incharge', $user->user_name)->get(),
            ];
        }

        if ($user->hasRole('Administrator')) {
            return [
                'incharges' => User::role('Supervision Engineer')->get(),
                'juniors' => [],
            ];
        }

        return [];
    }

    /**
     * Update basic fields of task
     */
    private function updateBasicFields(Tasks $task, array $validatedData): array
    {
        $messages = [];
        $fields = [
            'date' => 'Date',
            'number' => 'Number',
            'planned_time' => 'Planned Time',
            'status' => 'Status',
            'type' => 'Type',
            'description' => 'Description',
            'location' => 'Location',
            'side' => 'Side',
            'qty_layer' => 'Quantity Layer',
            'completion_time' => 'Completion Time',
            'inspection_details' => 'Inspection Details',
        ];

        foreach ($fields as $key => $label) {
            if (array_key_exists($key, $validatedData) && $validatedData[$key] !== $task->$key) {
                $task->$key = $validatedData[$key];
                $messages[] = "{$label} updated successfully to '{$validatedData[$key]}'";
            }
        }

        return $messages;
    }

    /**
     * Update additional fields of task
     */
    private function updateAdditionalFields(Tasks $task, Request $request): array
    {
        $messages = [];

        if ($request->has('assigned')) {
            if (! empty($request->assigned)) {
                $request->validate(['assigned' => 'required|exists:users,id']);
                $task->assigned = $request->assigned;
                $messages[] = 'Task assigned to '.User::find($request->assigned)->name;

                // Send assignment notification
                $this->notificationService->sendTaskAssignmentNotification($task, $request->assigned);
            } else {
                $task->assigned = null;
                $messages[] = 'Task assignee removed';
            }
        }

        if ($request->has('incharge')) {
            $request->validate(['incharge' => 'required|exists:users,id']);
            $task->incharge = $request->incharge;
            $messages[] = 'Task incharge updated to '.User::find($request->incharge)->name;
        }

        return $messages;
    }
}
