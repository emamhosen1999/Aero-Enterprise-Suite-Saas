<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Models\CmsMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    /**
     * Display the media library.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = CmsMedia::query()->orderByDesc('created_at');

        if ($folder = $request->input('folder')) {
            $query->where('folder', $folder);
        }

        if ($type = $request->input('type')) {
            $query->where('mime_type', 'like', $type . '/%');
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                    ->orWhere('alt_text', 'like', "%{$search}%");
            });
        }

        $media = $query->paginate($request->input('per_page', 24));

        // For API requests (modal picker)
        if ($request->wantsJson()) {
            return response()->json([
                'media' => $media,
                'folders' => $this->getFolders(),
            ]);
        }

        return Inertia::render('Platform/Admin/Cms/Media/Index', [
            'title' => 'Media Library',
            'media' => $media,
            'folders' => $this->getFolders(),
            'filters' => $request->only(['folder', 'type', 'search']),
            'stats' => [
                'total' => CmsMedia::count(),
                'images' => CmsMedia::where('mime_type', 'like', 'image/%')->count(),
                'documents' => CmsMedia::where('mime_type', 'like', 'application/%')->count(),
                'storage_used' => $this->formatBytes(CmsMedia::sum('size')),
            ],
        ]);
    }

    /**
     * Upload media files.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:10240|mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,mp4,webm',
            'folder' => 'nullable|string|max:100',
        ]);

        $folder = $request->input('folder', 'uploads');
        $uploaded = [];

        foreach ($request->file('files') as $file) {
            $filename = $this->generateUniqueFilename($file->getClientOriginalName());
            $path = $file->storeAs("cms/{$folder}", $filename, 'public');

            $media = CmsMedia::create([
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'path' => $path,
                'url' => Storage::url($path),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'folder' => $folder,
                'metadata' => $this->extractMetadata($file),
                'uploaded_by' => Auth::guard('landlord')->id(),
            ]);

            $uploaded[] = $media;
        }

        return response()->json([
            'success' => true,
            'message' => count($uploaded) . ' file(s) uploaded successfully.',
            'media' => $uploaded,
        ]);
    }

    /**
     * Update media metadata.
     */
    public function update(Request $request, CmsMedia $media): JsonResponse
    {
        $validated = $request->validate([
            'alt_text' => 'nullable|string|max:255',
            'folder' => 'nullable|string|max:100',
            'metadata' => 'nullable|array',
        ]);

        // If folder changed, move the file
        if (isset($validated['folder']) && $validated['folder'] !== $media->folder) {
            $newPath = "cms/{$validated['folder']}/{$media->filename}";
            Storage::disk('public')->move($media->path, $newPath);
            $validated['path'] = $newPath;
            $validated['url'] = Storage::url($newPath);
        }

        $media->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Media updated successfully.',
            'media' => $media,
        ]);
    }

    /**
     * Delete media.
     */
    public function destroy(CmsMedia $media): JsonResponse
    {
        // Delete the file from storage
        Storage::disk('public')->delete($media->path);

        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Media deleted successfully.',
        ]);
    }

    /**
     * Bulk delete media.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:cms_media,id',
        ]);

        $mediaItems = CmsMedia::whereIn('id', $validated['ids'])->get();

        foreach ($mediaItems as $media) {
            Storage::disk('public')->delete($media->path);
            $media->delete();
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']) . ' item(s) deleted successfully.',
        ]);
    }

    /**
     * Create a new folder.
     */
    public function createFolder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|regex:/^[a-zA-Z0-9\-_]+$/',
        ]);

        $folderPath = "cms/{$validated['name']}";
        
        if (!Storage::disk('public')->exists($folderPath)) {
            Storage::disk('public')->makeDirectory($folderPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'Folder created successfully.',
            'folder' => $validated['name'],
        ]);
    }

    /**
     * Get all folders.
     */
    protected function getFolders(): array
    {
        $folders = CmsMedia::select('folder')
            ->distinct()
            ->orderBy('folder')
            ->pluck('folder')
            ->toArray();

        // Ensure 'uploads' is always present
        if (!in_array('uploads', $folders)) {
            array_unshift($folders, 'uploads');
        }

        return $folders;
    }

    /**
     * Generate a unique filename.
     */
    protected function generateUniqueFilename(string $original): string
    {
        $extension = pathinfo($original, PATHINFO_EXTENSION);
        $name = Str::slug(pathinfo($original, PATHINFO_FILENAME));
        
        return $name . '-' . Str::random(8) . '.' . $extension;
    }

    /**
     * Extract metadata from file.
     */
    protected function extractMetadata($file): array
    {
        $metadata = [];

        if (str_starts_with($file->getMimeType(), 'image/')) {
            $imageInfo = @getimagesize($file->getRealPath());
            if ($imageInfo) {
                $metadata['width'] = $imageInfo[0];
                $metadata['height'] = $imageInfo[1];
            }
        }

        return $metadata;
    }

    /**
     * Format bytes to human readable.
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
