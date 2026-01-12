<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Contracts\UserResolverContract;
use Aero\Project\Services\Task\TaskCrudService;
use Aero\Project\Services\Task\TaskImportService;
use Aero\Project\Services\Task\TaskNotificationService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function __construct(
        protected TaskCrudService $crudService,
        protected TaskImportService $importService,
        protected TaskNotificationService $notificationService,
        protected UserResolverContract $userResolver
    ) {}

    /**
     * Display a listing of the tasks.
     */
    public function tasks()
    {
        // Note: Report model reference removed as it should be in its own package
        // $reports = Report::all();
        // $reports_with_tasks = Report::with('tasks')->has('tasks')->get();
        
        $incharges = User::role('Supervision Engineer')->get();
        $users = User::with('roles')->get();

        // Loop through each user and add a new field 'role' with the role name
        $users->transform(function ($user) {
            $user->role = $user->roles->first()->name;

            return $user;
        });

        return Inertia::render('Project/Rfis/Index', [
            'users' => $users,
            'allincharges' => $incharges,
            'title' => 'Tasks',
            // 'reports' => $reports,
            // 'reports_with_tasks' => $reports_with_tasks,
        ]);
    }

    public function getLatestTimestamp()
    {
        $latestTimestamp = \Aero\Rfi\Models\Rfi::max('updated_at');

        return response()->json(['timestamp' => $latestTimestamp]);
    }

    public function allTasks(Request $request)
    {
        try {
            $result = $this->crudService->getAllTasks($request);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function addTask(Request $request)
    {
        try {
            $result = $this->crudService->create($request);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateTask(Request $request)
    {
        try {
            $result = $this->crudService->update($request);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteTask(Request $request)
    {
        try {
            $result = $this->crudService->delete($request);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function importTasks(Request $request)
    {
        try {
            $results = $this->importService->processImport($request);

            return response()->json([
                'message' => 'Import completed successfully',
                'results' => $results,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
