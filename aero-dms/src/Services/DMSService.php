<?php

namespace Aero\Dms\Services;

use App\Models\Tenant\DMS$1
use App\Models\Tenant\DMS$1
use App\Models\Tenant\DMS$1
use App\Models\Tenant\DMS$1
use App\Models\Tenant\DMS$1
use App\Models\Shared\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DMSService
{
    /**
     * Create a new document.
     */
    public function createDocument(array $data, UploadedFile $file, User $user): Document
    {
        // Generate unique document number
        $documentNumber = 'DOC-'.date('Y').'-'.str_pad(Document::count() + 1, 6, '0', STR_PAD_LEFT);

        // Store file
        $fileName = $documentNumber.'_'.Str::slug($data['title']).'.'.$file->getClientOriginalExtension();
        $filePath = $file->storeAs('documents', $fileName, 'public');

        // Create document
        $document = Document::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'document_number' => $documentNumber,
            'category_id' => $data['category_id'],
            'folder_id' => $data['folder_id'] ?? null,
            'file_path' => $filePath,
            'original_file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'visibility' => $data['visibility'],
            'tags' => $data['tags'] ?? [],
            'expires_at' => $data['expires_at'] ?? null,
            'created_by' => $user->id,
            'status' => 'active',
        ]);

        // Log the creation
        $this->logAccess($document, $user, 'created');

        return $document;
    }

    /**
     * Update a document.
     */
    public function updateDocument(Document $document, array $data, User $user): Document
    {
        $document->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? $document->description,
            'category_id' => $data['category_id'],
            'folder_id' => $data['folder_id'] ?? $document->folder_id,
            'visibility' => $data['visibility'],
            'tags' => $data['tags'] ?? $document->tags,
            'expires_at' => $data['expires_at'] ?? $document->expires_at,
        ]);

        // Log the update
        $this->logAccess($document, $user, 'updated');

        return $document->fresh();
    }

    /**
     * Share a document with users.
     */
    public function shareDocument(Document $document, array $userIds, User $sharedBy, array $permissions = []): void
    {
        foreach ($userIds as $userId) {
            DocumentShare::create([
                'document_id' => $document->id,
                'shared_with' => $userId,
                'shared_by' => $sharedBy->id,
                'permissions' => $permissions,
                'expires_at' => null,
                'is_active' => true,
            ]);
        }

        // Log the sharing
        $this->logAccess($document, $sharedBy, 'shared');
    }

    /**
     * Log document access.
     */
    public function logAccess(Document $document, User $user, string $action, array $metadata = []): DocumentAccessLog
    {
        return DocumentAccessLog::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'action' => $action,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Get documents accessible by user.
     */
    public function getAccessibleDocuments(User $user, array $filters = [])
    {
        $query = Document::query()->with(['category', 'creator', 'folder']);

        // Apply filters
        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%')
                    ->orWhere('document_number', 'like', '%'.$filters['search'].'%');
            });
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        // Filter by user access
        $userRoles = $user->roles->pluck('name')->toArray();
        if (! in_array('Super Administrator', $userRoles) && ! in_array('Administrator', $userRoles)) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhere('visibility', 'public')
                    ->orWhere('visibility', 'internal')
                    ->orWhereHas('shares', function ($shareQuery) use ($user) {
                        $shareQuery->where('shared_with', $user->id)->active();
                    });
            });
        }

        return $query;
    }

    /**
     * Get document statistics.
     */
    public function getStatistics(User $user): array
    {
        return [
            'total_documents' => Document::count(),
            'my_documents' => Document::where('created_by', $user->id)->count(),
            'shared_with_me' => DocumentShare::where('shared_with', $user->id)->active()->count(),
            'pending_approval' => Document::where('status', 'pending_review')->count(),
            'categories_count' => Category::active()->count(),
            'folders_count' => Folder::count(),
            'total_file_size' => Document::sum('file_size'),
        ];
    }

    /**
     * Get recent activity.
     */
    public function getRecentActivity(int $limit = 20)
    {
        return DocumentAccessLog::with(['document', 'user'])
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Delete a document.
     */
    public function deleteDocument(Document $document, User $user): bool
    {
        // Log the deletion before actual deletion
        $this->logAccess($document, $user, 'deleted');

        // Delete the file from storage
        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        // Delete the document record
        return $document->delete();
    }

    /**
     * Create a new category.
     */
    public function createCategory(array $data, User $user): Category
    {
        return Category::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#3B82F6',
            'is_active' => true,
            'created_by' => $user->id,
        ]);
    }

    /**
     * Create a new folder.
     */
    public function createFolder(array $data, User $user): Folder
    {
        return Folder::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
            'created_by' => $user->id,
        ]);
    }

    /**
     * Upload a new version of an existing document.
     */
    public function uploadNewVersion(Document $document, UploadedFile $file, User $user, ?string $changeSummary = null): \App\Models\DMS\DocumentVersion
    {
        // Get the next version number
        $currentVersion = $document->version ?? 1;
        $newVersion = $currentVersion + 1;

        // Store the current version in version history if not already done
        if ($currentVersion === 1 && $document->versionHistory()->count() === 0) {
            \App\Models\DMS\DocumentVersion::create([
                'document_id' => $document->id,
                'version' => 1,
                'change_summary' => 'Initial version',
                'file_path' => $document->file_path,
                'file_size' => $document->file_size,
                'checksum' => hash_file('sha256', Storage::disk('public')->path($document->file_path)),
                'created_by' => $document->created_by,
            ]);
        }

        // Store the new file
        $fileName = $document->document_number.'_v'.$newVersion.'_'.Str::slug($document->title).'.'.$file->getClientOriginalExtension();
        $filePath = $file->storeAs('documents/versions', $fileName, 'public');

        // Create version record
        $version = \App\Models\DMS\DocumentVersion::create([
            'document_id' => $document->id,
            'version' => $newVersion,
            'change_summary' => $changeSummary ?? 'Version '.$newVersion.' uploaded',
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'checksum' => hash_file('sha256', $file->getRealPath()),
            'created_by' => $user->id,
        ]);

        // Update the document with new file info
        $document->update([
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'version' => $newVersion,
            'is_latest_version' => true,
        ]);

        // Log the version upload
        $this->logAccess($document, $user, 'version_uploaded', [
            'version' => $newVersion,
            'change_summary' => $changeSummary,
        ]);

        return $version;
    }

    /**
     * Get version history for a document.
     */
    public function getVersionHistory(Document $document): \Illuminate\Database\Eloquent\Collection
    {
        return $document->versionHistory()
            ->with('creator')
            ->orderByDesc('version')
            ->get();
    }

    /**
     * Rollback to a specific version.
     */
    public function rollbackToVersion(Document $document, int $versionId, User $user): Document
    {
        $targetVersion = $document->versionHistory()->findOrFail($versionId);

        // Store current as a new version first
        $currentVersion = $document->version + 1;
        \App\Models\DMS\DocumentVersion::create([
            'document_id' => $document->id,
            'version' => $currentVersion,
            'change_summary' => "Rolled back to version {$targetVersion->version}",
            'file_path' => $document->file_path,
            'file_size' => $document->file_size,
            'checksum' => hash_file('sha256', Storage::disk('public')->path($document->file_path)),
            'created_by' => $user->id,
        ]);

        // Copy the target version file to a new location
        $extension = pathinfo($targetVersion->file_path, PATHINFO_EXTENSION);
        $newFileName = $document->document_number.'_v'.$currentVersion.'_rollback.'.$extension;
        $newFilePath = 'documents/versions/'.$newFileName;

        Storage::disk('public')->copy($targetVersion->file_path, $newFilePath);

        // Update document to use the rolled back file
        $document->update([
            'file_path' => $newFilePath,
            'file_size' => $targetVersion->file_size,
            'version' => $currentVersion,
        ]);

        // Log the rollback
        $this->logAccess($document, $user, 'version_rollback', [
            'target_version' => $targetVersion->version,
            'new_version' => $currentVersion,
        ]);

        return $document->fresh();
    }

    /**
     * Download a specific version of a document.
     */
    public function getVersionFile(Document $document, int $versionId): ?array
    {
        // If versionId matches current version, return current file
        if ($versionId === $document->version || ! $document->versionHistory()->exists()) {
            return [
                'path' => Storage::disk('public')->path($document->file_path),
                'name' => $document->original_file_name ?? $document->title,
                'mime_type' => $document->mime_type,
            ];
        }

        $version = $document->versionHistory()->find($versionId);
        if (! $version) {
            return null;
        }

        $extension = pathinfo($version->file_path, PATHINFO_EXTENSION);

        return [
            'path' => Storage::disk('public')->path($version->file_path),
            'name' => "{$document->title}_v{$version->version}.{$extension}",
            'mime_type' => $document->mime_type,
        ];
    }

    /**
     * Compare two versions of a document.
     */
    public function compareVersions(Document $document, int $version1Id, int $version2Id): array
    {
        $version1 = $document->versionHistory()->with('creator')->find($version1Id);
        $version2 = $document->versionHistory()->with('creator')->find($version2Id);

        return [
            'version1' => $version1 ? [
                'id' => $version1->id,
                'version' => $version1->version,
                'change_summary' => $version1->change_summary,
                'file_size' => $version1->file_size,
                'checksum' => $version1->checksum,
                'created_at' => $version1->created_at,
                'creator' => $version1->creator ? [
                    'id' => $version1->creator->id,
                    'name' => $version1->creator->name,
                ] : null,
            ] : null,
            'version2' => $version2 ? [
                'id' => $version2->id,
                'version' => $version2->version,
                'change_summary' => $version2->change_summary,
                'file_size' => $version2->file_size,
                'checksum' => $version2->checksum,
                'created_at' => $version2->created_at,
                'creator' => $version2->creator ? [
                    'id' => $version2->creator->id,
                    'name' => $version2->creator->name,
                ] : null,
            ] : null,
            'size_difference' => $version1 && $version2 ? $version2->file_size - $version1->file_size : 0,
            'same_content' => $version1 && $version2 ? $version1->checksum === $version2->checksum : false,
        ];
    }
}
