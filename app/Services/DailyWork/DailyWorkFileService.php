<?php

namespace App\Services\DailyWork;

use App\Models\DailyWork;
use App\Models\NCR;
use App\Models\Objection;
use App\Models\Tasks;
use Illuminate\Http\Request;

class DailyWorkFileService
{
    /**
     * Upload RFI file for a daily work task
     */
    public function uploadRfiFile(Request $request): array
    {
        $this->validateRfiFileRequest($request);

        $task = DailyWork::find($request->taskId);

        if (! $request->hasFile('file')) {
            throw new \Exception('No file uploaded');
        }

        $newRfiFile = $request->file('file');

        // Clear old file from 'rfi_files' collection if it exists
        $task->clearMediaCollection('rfi_files');

        // Add the new RFI file to the 'rfi_files' collection
        $task->addMediaFromRequest('file')->toMediaCollection('rfi_files');

        // Get the new file URL
        $newRfiFileUrl = $task->getFirstMediaUrl('rfi_files');

        // Store the URL in the task
        $task->file = $newRfiFileUrl;
        $task->save();

        return [
            'message' => 'RFI file uploaded successfully',
            'url' => $newRfiFileUrl,
        ];
    }

    /**
     * Attach report (NCR or Objection) to a task
     */
    public function attachReport(Request $request): array
    {
        $taskId = $request->input('task_id');
        $selectedReport = $request->input('selected_report');

        $task = Tasks::findOrFail($taskId);

        // Split the selected option into type and id
        [$type, $id] = explode('_', $selectedReport);

        $attachmentResult = $this->processReportAttachment($task, $type, $id);

        // Update the timestamp of the task
        $task->touch();

        // Retrieve the updated task data
        $updatedTask = Tasks::with('ncrs', 'objections')->findOrFail($taskId);

        return [
            'message' => $attachmentResult['message'],
            'updatedRowData' => $updatedTask,
        ];
    }

    /**
     * Detach reports from a task
     */
    public function detachReport(Request $request): array
    {
        $taskId = $request->input('task_id');
        $task = Tasks::findOrFail($taskId);

        $detachmentResult = $this->processReportDetachment($task);

        // Update the timestamp of the task
        $task->touch();

        // Retrieve the updated task data
        $updatedTask = Tasks::with('ncrs', 'objections')->findOrFail($taskId);

        return [
            'message' => $detachmentResult['message'],
            'updatedRowData' => $updatedTask,
        ];
    }

    /**
     * Validate RFI file upload request
     */
    private function validateRfiFileRequest(Request $request): void
    {
        $request->validate([
            'taskId' => 'required|exists:daily_works,id',
            'file' => 'required|mimes:pdf|max:5120', // PDF file up to 5 MB
        ]);
    }

    /**
     * Process report attachment based on type
     */
    private function processReportAttachment(Tasks $task, string $type, string $id): array
    {
        if ($type === 'ncr') {
            return $this->attachNcr($task, $id);
        } elseif ($type === 'obj') {
            return $this->attachObjection($task, $id);
        }

        throw new \Exception('Invalid report type');
    }

    /**
     * Attach NCR to task
     */
    private function attachNcr(Tasks $task, string $ncrNo): array
    {
        $ncr = NCR::where('ncr_no', $ncrNo)->firstOrFail();

        // Check if the NCR is already attached to the task
        if (! $task->ncrs()->where('ncr_no', $ncr->ncr_no)->exists()) {
            $task->ncrs()->attach($ncr->id);
        }

        return [
            'message' => "NCR {$ncrNo} attached to {$task->number} successfully.",
        ];
    }

    /**
     * Attach Objection to task
     */
    private function attachObjection(Tasks $task, string $objNo): array
    {
        $objection = Objection::where('obj_no', $objNo)->firstOrFail();

        // Check if the Objection is already attached to the task
        if (! $task->objections()->where('obj_no', $objection->obj_no)->exists()) {
            $task->objections()->attach($objection->id);
        }

        return [
            'message' => "Objection {$objNo} attached to {$task->number} successfully.",
        ];
    }

    /**
     * Process report detachment
     */
    private function processReportDetachment(Tasks $task): array
    {
        // If task has NCRs, detach them
        if ($task->ncrs->count() > 0) {
            $detachedNCRs = $task->ncrs()->detach();
            $message = $detachedNCRs > 0
                ? "NCR detached from task {$task->number} successfully."
                : "No NCRs were attached to task {$task->number}.";

            return ['message' => $message];
        }

        // If task has Objections, detach them
        if ($task->objections->count() > 0) {
            $detachedObjections = $task->objections()->detach();
            $message = $detachedObjections > 0
                ? "Objection detached from task {$task->number} successfully."
                : "No Objections were attached to task {$task->number}.";

            return ['message' => $message];
        }

        return ['message' => 'No reports attached to this task.'];
    }
}
