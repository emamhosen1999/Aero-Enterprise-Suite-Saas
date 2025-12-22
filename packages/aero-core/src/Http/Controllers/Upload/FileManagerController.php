<?php

namespace Aero\Core\Http\Controllers\Upload;

use Aero\Core\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FileManagerController extends Controller
{
    /**
     * Display the file manager page.
     */
    public function index(): Response
    {
        return Inertia::render('Pages/Core/FileManager/Index', [
            'title' => 'File Manager',
        ]);
    }

    /**
     * Browse files in a directory.
     */
    public function browse(Request $request)
    {
        $path = $request->get('path', '');
        $disk = $request->get('disk', 'public');
        $perPage = $request->get('per_page', 50);

        try {
            $storage = Storage::disk($disk);
            
            // Get directories and files
            $directories = collect($storage->directories($path))
                ->map(fn ($dir) => [
                    'name' => basename($dir),
                    'path' => $dir,
                    'type' => 'directory',
                    'size' => null,
                    'last_modified' => null,
                ]);

            $files = collect($storage->files($path))
                ->map(fn ($file) => [
                    'name' => basename($file),
                    'path' => $file,
                    'type' => 'file',
                    'size' => $storage->size($file),
                    'last_modified' => $storage->lastModified($file),
                    'url' => $storage->url($file),
                    'mime_type' => $storage->mimeType($file),
                ]);

            $items = $directories->concat($files)->values();

            return response()->json([
                'data' => $items,
                'current_path' => $path,
                'parent_path' => dirname($path) !== '.' ? dirname($path) : null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to browse directory',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload a file.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:102400', // 100MB max
            'path' => 'nullable|string',
        ]);

        $disk = $request->get('disk', 'public');
        $path = $request->get('path', 'uploads');

        try {
            $file = $request->file('file');
            $filename = $file->getClientOriginalName();
            
            // Ensure unique filename
            $storage = Storage::disk($disk);
            $fullPath = $path . '/' . $filename;
            
            if ($storage->exists($fullPath)) {
                $filename = pathinfo($filename, PATHINFO_FILENAME) 
                    . '_' . time() 
                    . '.' . $file->getClientOriginalExtension();
                $fullPath = $path . '/' . $filename;
            }

            $storedPath = $file->storeAs($path, $filename, $disk);

            return response()->json([
                'message' => 'File uploaded successfully',
                'file' => [
                    'name' => $filename,
                    'path' => $storedPath,
                    'url' => $storage->url($storedPath),
                    'size' => $storage->size($storedPath),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to upload file',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a file or directory.
     */
    public function destroy(Request $request, string $id)
    {
        $path = base64_decode($id);
        $disk = $request->get('disk', 'public');

        try {
            $storage = Storage::disk($disk);

            if ($storage->exists($path)) {
                // Check if it's a directory
                if (empty(pathinfo($path, PATHINFO_EXTENSION))) {
                    $storage->deleteDirectory($path);
                } else {
                    $storage->delete($path);
                }

                return response()->json([
                    'message' => 'File deleted successfully',
                ]);
            }

            return response()->json([
                'error' => 'File not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete file',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get storage statistics.
     */
    public function stats(Request $request)
    {
        $disk = $request->get('disk', 'public');

        try {
            $storage = Storage::disk($disk);
            
            // Count files and calculate total size
            $totalSize = 0;
            $fileCount = 0;
            $directoryCount = 0;

            $allFiles = $storage->allFiles();
            $allDirectories = $storage->allDirectories();

            foreach ($allFiles as $file) {
                try {
                    $totalSize += $storage->size($file);
                    $fileCount++;
                } catch (\Exception $e) {
                    // Skip files that can't be read
                }
            }

            $directoryCount = count($allDirectories);

            return response()->json([
                'total_size' => $totalSize,
                'total_size_formatted' => $this->formatBytes($totalSize),
                'file_count' => $fileCount,
                'directory_count' => $directoryCount,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get storage stats',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
