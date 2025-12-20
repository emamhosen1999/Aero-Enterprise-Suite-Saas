<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\DailyWork;
use Illuminate\Http\UploadedFile;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * DailyWorkFileService
 *
 * Service for managing Daily Work file uploads.
 */
class DailyWorkFileService
{
    /**
     * Upload multiple RFI files for a daily work task.
     * Does NOT clear existing files - supports multiple files per task.
     */
    public function uploadRfiFiles(DailyWork $dailyWork, array $files): array
    {
        $uploadedFiles = [];
        $errors = [];

        \Log::info('DailyWorkFileService: uploadRfiFiles called', [
            'daily_work_id' => $dailyWork->id,
            'files_count' => count($files),
        ]);

        foreach ($files as $index => $file) {
            \Log::info("Processing file {$index}", [
                'is_uploaded_file' => $file instanceof UploadedFile,
                'type' => gettype($file),
                'class' => is_object($file) ? get_class($file) : 'not_object',
            ]);

            if (! $file instanceof UploadedFile) {
                \Log::warning("File {$index} is not an UploadedFile instance");

                continue;
            }

            try {
                $media = $dailyWork
                    ->addMedia($file)
                    ->usingFileName($this->generateUniqueFileName($file))
                    ->toMediaCollection('rfi_files');

                \Log::info("File {$index} uploaded successfully", ['media_id' => $media->id]);

                $uploadedFiles[] = [
                    'id' => $media->id,
                    'name' => $media->file_name,
                    'url' => $media->getUrl(),
                    'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'human_size' => $this->formatBytes($media->size),
                    'is_image' => str_starts_with($media->mime_type, 'image/'),
                    'is_pdf' => $media->mime_type === 'application/pdf',
                ];
            } catch (\Exception $e) {
                \Log::error("Error uploading file {$index}", [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ]);
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'uploaded' => $uploadedFiles,
            'errors' => $errors,
            'total_files' => $dailyWork->getMedia('rfi_files')->count(),
        ];
    }

    /**
     * Get all RFI files for a daily work task.
     */
    public function getRfiFiles(DailyWork $dailyWork): array
    {
        return $dailyWork->getMedia('rfi_files')->map(function ($media) {
            return [
                'id' => $media->id,
                'name' => $media->file_name,
                'original_name' => $media->name,
                'url' => $media->getUrl(),
                'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $this->formatBytes($media->size),
                'is_image' => str_starts_with($media->mime_type, 'image/'),
                'is_pdf' => $media->mime_type === 'application/pdf',
                'created_at' => $media->created_at->toISOString(),
            ];
        })->toArray();
    }

    /**
     * Delete a specific RFI file.
     */
    public function deleteRfiFile(DailyWork $dailyWork, int $mediaId): bool
    {
        $media = $dailyWork->getMedia('rfi_files')->where('id', $mediaId)->first();

        if (! $media) {
            return false;
        }

        $media->delete();

        return true;
    }

    /**
     * Get a specific RFI file media object.
     */
    public function getRfiFile(DailyWork $dailyWork, int $mediaId): ?Media
    {
        return $dailyWork->getMedia('rfi_files')->where('id', $mediaId)->first();
    }

    /**
     * Generate a unique filename for uploaded file.
     */
    private function generateUniqueFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalName);

        return $sanitizedName.'_'.uniqid().'.'.$extension;
    }

    /**
     * Format bytes to human readable size.
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }
}
