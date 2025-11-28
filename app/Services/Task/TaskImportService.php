<?php

namespace App\Services\Task;

use App\Imports\TaskImport;
use App\Models\Tasks;
use App\Models\WorkLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class TaskImportService
{
    private TaskValidationService $validationService;

    public function __construct(TaskValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Process Excel/CSV import
     */
    public function processImport(Request $request): array
    {
        $this->validationService->validateImportFile($request);

        $path = $request->file('file')->store('temp');
        $importedSheets = Excel::toArray(new TaskImport, $path);

        // First pass: Validate all sheets
        foreach ($importedSheets as $sheetIndex => $importedTasks) {
            if (empty($importedTasks)) {
                continue;
            }

            $this->validationService->validateImportedData($importedTasks, $sheetIndex);
        }

        // Second pass: Process the data
        $results = [];
        foreach ($importedSheets as $sheetIndex => $importedTasks) {
            if (empty($importedTasks)) {
                continue;
            }

            $result = $this->processSheet($importedTasks, $sheetIndex);
            $results[] = $result;
        }

        return $results;
    }

    /**
     * Process a single sheet of tasks
     */
    private function processSheet(array $importedTasks, int $sheetIndex): array
    {
        $date = $importedTasks[0][0];
        $processedCount = 0;

        foreach ($importedTasks as $importedTask) {
            $result = $this->processTaskRow($importedTask, $date);

            if ($result['processed']) {
                $processedCount++;
            }
        }

        return [
            'sheet' => $sheetIndex + 1,
            'date' => $date,
            'processed_count' => $processedCount,
        ];
    }

    /**
     * Process a single task row
     */
    private function processTaskRow(array $importedTask, string $date): array
    {
        // Find work location for the task location
        $workLocation = $this->findWorkLocationForTask($importedTask[4]);

        if (! $workLocation) {
            Log::warning('No work location found for task location: '.$importedTask[4]);

            return ['processed' => false];
        }

        $inchargeName = $workLocation->incharge;

        // Check if task already exists
        $existingTask = Tasks::where('number', $importedTask[1])->first();

        if ($existingTask) {
            $this->handleTaskResubmission($existingTask, $importedTask, $inchargeName);
        } else {
            $this->createNewTask($importedTask, $inchargeName);
        }

        return ['processed' => true];
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
     * Handle resubmission of existing task
     */
    private function handleTaskResubmission(Tasks $existingTask, array $importedTask, string $inchargeName): void
    {
        $resubmissionCount = $existingTask->resubmission_count ?? 0;
        $resubmissionCount++;

        Tasks::create([
            'date' => ($existingTask->status === 'completed' ? $existingTask->date : $importedTask[0]),
            'number' => $importedTask[1],
            'status' => ($existingTask->status === 'completed' ? 'completed' : 'resubmission'),
            'type' => $importedTask[2],
            'description' => $importedTask[3],
            'location' => $importedTask[4],
            'side' => $importedTask[5] ?? null,
            'qty_layer' => $importedTask[6] ?? null,
            'planned_time' => $importedTask[7] ?? null,
            'incharge' => $inchargeName,
            'resubmission_count' => $resubmissionCount,
        ]);

        // Delete old record
        $existingTask->delete();
    }

    /**
     * Create new task
     */
    private function createNewTask(array $importedTask, string $inchargeName): void
    {
        Tasks::create([
            'date' => $importedTask[0],
            'number' => $importedTask[1],
            'status' => 'pending',
            'type' => $importedTask[2],
            'description' => $importedTask[3],
            'location' => $importedTask[4],
            'side' => $importedTask[5] ?? null,
            'qty_layer' => $importedTask[6] ?? null,
            'planned_time' => $importedTask[7] ?? null,
            'incharge' => $inchargeName,
        ]);
    }
}
