<?php

declare(strict_types=1);

namespace Aero\Project\Http\Controllers;

use Aero\Project\Http\Requests\UploadProjectAttachmentRequest;
use Aero\Project\Models\Project;
use Aero\Project\Models\ProjectAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * ProjectAttachmentController
 *
 * Handles file upload/download for project attachments.
 * Supports polymorphic attachments on projects, tasks, risks, milestones.
 */
class ProjectAttachmentController extends Controller
{
    /**
     * List attachments for a project or specific entity.
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $query = ProjectAttachment::query();

        // Filter by attachable type/id if provided
        if ($request->filled('attachable_type') && $request->filled('attachable_id')) {
            $query->where('attachable_type', $request->attachable_type)
                ->where('attachable_id', $request->attachable_id);
        } else {
            // Get all project-level attachments
            $query->where('attachable_type', Project::class)
                ->where('attachable_id', $project->id);
        }

        // Filter by type
        if ($request->filled('filter')) {
            match ($request->filter) {
                'images' => $query->images(),
                'documents' => $query->documents(),
                default => null,
            };
        }

        $attachments = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'attachments' => $attachments,
        ]);
    }

    /**
     * Upload attachment(s).
     */
    public function store(UploadProjectAttachmentRequest $request, Project $project): JsonResponse
    {
        $validated = $request->validated();

        $attachments = [];
        $disk = config('filesystems.default', 'local');

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $name = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)).'-'.Str::random(8);
            $extension = $file->getClientOriginalExtension();
            $fullName = $name.'.'.$extension;

            // Store in project-specific folder
            $path = $file->storeAs(
                "projects/{$project->id}/attachments",
                $fullName,
                $disk
            );

            $attachment = ProjectAttachment::create([
                'attachable_type' => $validated['attachable_type'],
                'attachable_id' => $validated['attachable_id'],
                'uploaded_by' => Auth::id(),
                'name' => $fullName,
                'original_name' => $originalName,
                'path' => $path,
                'disk' => $disk,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'metadata' => $validated['metadata'] ?? null,
            ]);

            $attachments[] = $attachment;
        }

        return response()->json([
            'message' => count($attachments) > 1
                ? count($attachments).' files uploaded successfully.'
                : 'File uploaded successfully.',
            'attachments' => $attachments,
        ]);
    }

    /**
     * Download an attachment.
     */
    public function download(Project $project, ProjectAttachment $attachment): StreamedResponse
    {
        if (! $attachment->exists()) {
            abort(404, 'File not found.');
        }

        return $attachment->download();
    }

    /**
     * Get attachment details.
     */
    public function show(Project $project, ProjectAttachment $attachment): JsonResponse
    {
        return response()->json([
            'attachment' => $attachment,
        ]);
    }

    /**
     * Update attachment metadata.
     */
    public function update(Request $request, Project $project, ProjectAttachment $attachment): JsonResponse
    {
        $validated = $request->validate([
            'metadata' => 'nullable|array',
        ]);

        $attachment->update($validated);

        return response()->json([
            'message' => 'Attachment updated.',
            'attachment' => $attachment->fresh(),
        ]);
    }

    /**
     * Delete an attachment.
     */
    public function destroy(Project $project, ProjectAttachment $attachment): JsonResponse
    {
        // Check if user owns the attachment or has permission
        if ($attachment->uploaded_by !== Auth::id()) {
            // Allow project managers to delete any attachment
            $isMember = $project->members()
                ->where('user_id', Auth::id())
                ->whereIn('role', ['project_manager', 'lead'])
                ->exists();

            if (! $isMember) {
                return response()->json([
                    'message' => 'You do not have permission to delete this attachment.',
                ], 403);
            }
        }

        // Force delete to also remove the file
        $attachment->forceDelete();

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }

    /**
     * Bulk delete attachments.
     */
    public function bulkDestroy(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'attachment_ids' => 'required|array',
            'attachment_ids.*' => 'exists:project_attachments,id',
        ]);

        $count = 0;
        $attachments = ProjectAttachment::whereIn('id', $validated['attachment_ids'])->get();

        foreach ($attachments as $attachment) {
            // Only delete if user owns or is project manager
            if ($attachment->uploaded_by === Auth::id() ||
                $project->members()
                    ->where('user_id', Auth::id())
                    ->whereIn('role', ['project_manager', 'lead'])
                    ->exists()
            ) {
                $attachment->forceDelete();
                $count++;
            }
        }

        return response()->json([
            'message' => "{$count} attachment(s) deleted.",
        ]);
    }

    /**
     * Get storage usage for a project.
     */
    public function storageUsage(Project $project): JsonResponse
    {
        // Get all attachments for the project (direct and nested)
        $projectAttachments = ProjectAttachment::where('attachable_type', Project::class)
            ->where('attachable_id', $project->id)
            ->sum('size');

        $taskAttachments = ProjectAttachment::where('attachable_type', 'Aero\\Project\\Models\\ProjectTask')
            ->whereIn('attachable_id', $project->tasks()->pluck('id'))
            ->sum('size');

        $riskAttachments = ProjectAttachment::where('attachable_type', 'Aero\\Project\\Models\\ProjectRisk')
            ->whereIn('attachable_id', $project->risksAndIssues()->pluck('id'))
            ->sum('size');

        $totalBytes = $projectAttachments + $taskAttachments + $riskAttachments;

        return response()->json([
            'total_bytes' => $totalBytes,
            'total_formatted' => $this->formatBytes($totalBytes),
            'breakdown' => [
                'project' => $this->formatBytes($projectAttachments),
                'tasks' => $this->formatBytes($taskAttachments),
                'risks' => $this->formatBytes($riskAttachments),
            ],
            'file_count' => ProjectAttachment::where(function ($q) use ($project) {
                $q->where(function ($q2) use ($project) {
                    $q2->where('attachable_type', Project::class)
                        ->where('attachable_id', $project->id);
                });
            })->count(),
        ]);
    }

    /**
     * Format bytes to human-readable string.
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' bytes';
    }
}
