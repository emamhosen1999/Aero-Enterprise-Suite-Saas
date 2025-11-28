<?php

namespace App\Services;

use App\Models\DMS\Category;
use App\Models\DMS\Document;
use App\Models\DMS\DocumentAccessLog;
use App\Models\DMS\DocumentShare;
use App\Models\DMS\Folder;
use App\Models\User;
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
}
