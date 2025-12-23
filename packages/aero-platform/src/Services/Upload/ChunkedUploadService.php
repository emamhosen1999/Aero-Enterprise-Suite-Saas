<?php

namespace Aero\Platform\Services\Upload;

use Illuminate\Http\UploadedFile;
use Aero\Core\Support\TenantCache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChunkedUploadService
{
    protected string $disk = 'local';

    protected string $chunksFolder = 'chunks';

    protected int $chunkExpiration = 24; // hours

    /**
     * Initialize a new chunked upload.
     *
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    public function initializeUpload(string $filename, int $totalSize, int $totalChunks, array $metadata = []): array
    {
        $uploadId = Str::uuid()->toString();
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $safeFilename = Str::slug(pathinfo($filename, PATHINFO_FILENAME));

        $uploadData = [
            'upload_id' => $uploadId,
            'original_filename' => $filename,
            'safe_filename' => "{$safeFilename}_{$uploadId}.{$extension}",
            'total_size' => $totalSize,
            'total_chunks' => $totalChunks,
            'uploaded_chunks' => [],
            'uploaded_size' => 0,
            'status' => 'pending',
            'created_at' => now()->toIso8601String(),
            'expires_at' => now()->addHours($this->chunkExpiration)->toIso8601String(),
            'metadata' => $metadata,
        ];

        // Store upload state in cache
        TenantCache::put(
            "chunked_upload:{$uploadId}",
            $uploadData,
            now()->addHours($this->chunkExpiration)
        );

        // Create chunks directory
        Storage::disk($this->disk)->makeDirectory("{$this->chunksFolder}/{$uploadId}");

        Log::info('Chunked upload initialized', [
            'upload_id' => $uploadId,
            'filename' => $filename,
            'total_size' => $totalSize,
            'total_chunks' => $totalChunks,
        ]);

        return [
            'upload_id' => $uploadId,
            'chunk_size' => $this->getRecommendedChunkSize($totalSize),
            'expires_at' => $uploadData['expires_at'],
        ];
    }

    /**
     * Upload a single chunk.
     *
     * @return array<string, mixed>
     */
    public function uploadChunk(string $uploadId, int $chunkIndex, UploadedFile $chunk): array
    {
        $uploadData = $this->getUploadData($uploadId);

        if (! $uploadData) {
            throw new \Exception('Upload session not found or expired');
        }

        if ($uploadData['status'] === 'completed') {
            throw new \Exception('Upload already completed');
        }

        if (in_array($chunkIndex, $uploadData['uploaded_chunks'])) {
            // Chunk already uploaded - idempotent
            return [
                'chunk_index' => $chunkIndex,
                'status' => 'already_uploaded',
                'progress' => $this->calculateProgress($uploadData),
            ];
        }

        if ($chunkIndex < 0 || $chunkIndex >= $uploadData['total_chunks']) {
            throw new \Exception("Invalid chunk index: {$chunkIndex}");
        }

        // Store chunk
        $chunkPath = "{$this->chunksFolder}/{$uploadId}/chunk_{$chunkIndex}";
        Storage::disk($this->disk)->put($chunkPath, file_get_contents($chunk->getRealPath()));

        // Update state
        $uploadData['uploaded_chunks'][] = $chunkIndex;
        $uploadData['uploaded_size'] += $chunk->getSize();
        $uploadData['status'] = 'uploading';

        // Check if all chunks uploaded
        if (count($uploadData['uploaded_chunks']) === $uploadData['total_chunks']) {
            $uploadData['status'] = 'pending_assembly';
        }

        // Update cache
        TenantCache::put(
            "chunked_upload:{$uploadId}",
            $uploadData,
            now()->addHours($this->chunkExpiration)
        );

        $progress = $this->calculateProgress($uploadData);

        Log::debug('Chunk uploaded', [
            'upload_id' => $uploadId,
            'chunk_index' => $chunkIndex,
            'progress' => $progress,
        ]);

        return [
            'chunk_index' => $chunkIndex,
            'status' => 'uploaded',
            'progress' => $progress,
            'uploaded_chunks' => count($uploadData['uploaded_chunks']),
            'total_chunks' => $uploadData['total_chunks'],
            'ready_to_assemble' => $uploadData['status'] === 'pending_assembly',
        ];
    }

    /**
     * Assemble all chunks into the final file.
     *
     * @return array<string, mixed>
     */
    public function assembleChunks(string $uploadId, ?string $destinationPath = null): array
    {
        $uploadData = $this->getUploadData($uploadId);

        if (! $uploadData) {
            throw new \Exception('Upload session not found or expired');
        }

        if (count($uploadData['uploaded_chunks']) !== $uploadData['total_chunks']) {
            $missing = array_diff(
                range(0, $uploadData['total_chunks'] - 1),
                $uploadData['uploaded_chunks']
            );
            throw new \Exception('Missing chunks: '.implode(', ', $missing));
        }

        $uploadData['status'] = 'assembling';
        TenantCache::put("chunked_upload:{$uploadId}", $uploadData, now()->addHours($this->chunkExpiration));

        // Determine final path
        $finalPath = $destinationPath ?? "uploads/{$uploadData['safe_filename']}";

        // Create temporary file for assembly
        $tempPath = storage_path("app/temp_{$uploadId}");
        $tempFile = fopen($tempPath, 'wb');

        if (! $tempFile) {
            throw new \Exception('Failed to create temporary file for assembly');
        }

        try {
            // Sort chunks and write sequentially
            sort($uploadData['uploaded_chunks']);

            foreach ($uploadData['uploaded_chunks'] as $chunkIndex) {
                $chunkPath = "{$this->chunksFolder}/{$uploadId}/chunk_{$chunkIndex}";
                $chunkContent = Storage::disk($this->disk)->get($chunkPath);

                if ($chunkContent === false) {
                    throw new \Exception("Failed to read chunk {$chunkIndex}");
                }

                fwrite($tempFile, $chunkContent);
            }

            fclose($tempFile);

            // Move assembled file to final destination
            Storage::disk($this->disk)->put($finalPath, file_get_contents($tempPath));

            // Cleanup
            unlink($tempPath);
            $this->cleanupChunks($uploadId);

            // Update status
            $uploadData['status'] = 'completed';
            $uploadData['completed_at'] = now()->toIso8601String();
            $uploadData['final_path'] = $finalPath;
            TenantCache::put("chunked_upload:{$uploadId}", $uploadData, now()->addHours(1));

            Log::info('Chunked upload assembled', [
                'upload_id' => $uploadId,
                'final_path' => $finalPath,
                'total_size' => $uploadData['total_size'],
            ]);

            return [
                'status' => 'completed',
                'path' => $finalPath,
                'size' => $uploadData['total_size'],
                'filename' => $uploadData['original_filename'],
            ];
        } catch (\Exception $e) {
            if (isset($tempFile) && is_resource($tempFile)) {
                fclose($tempFile);
            }

            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            $uploadData['status'] = 'failed';
            $uploadData['error'] = $e->getMessage();
            TenantCache::put("chunked_upload:{$uploadId}", $uploadData, now()->addHours(1));

            throw $e;
        }
    }

    /**
     * Get upload status and progress.
     *
     * @return array<string, mixed>|null
     */
    public function getUploadStatus(string $uploadId): ?array
    {
        $uploadData = $this->getUploadData($uploadId);

        if (! $uploadData) {
            return null;
        }

        return [
            'upload_id' => $uploadId,
            'status' => $uploadData['status'],
            'progress' => $this->calculateProgress($uploadData),
            'uploaded_chunks' => count($uploadData['uploaded_chunks']),
            'total_chunks' => $uploadData['total_chunks'],
            'uploaded_size' => $uploadData['uploaded_size'],
            'total_size' => $uploadData['total_size'],
            'created_at' => $uploadData['created_at'],
            'expires_at' => $uploadData['expires_at'],
            'missing_chunks' => array_values(array_diff(
                range(0, $uploadData['total_chunks'] - 1),
                $uploadData['uploaded_chunks']
            )),
        ];
    }

    /**
     * Resume an upload by getting missing chunks.
     *
     * @return array<string, mixed>|null
     */
    public function resumeUpload(string $uploadId): ?array
    {
        $status = $this->getUploadStatus($uploadId);

        if (! $status) {
            return null;
        }

        if ($status['status'] === 'completed') {
            return [
                'status' => 'already_completed',
                'message' => 'This upload has already been completed',
            ];
        }

        return [
            'status' => 'resumable',
            'upload_id' => $uploadId,
            'missing_chunks' => $status['missing_chunks'],
            'progress' => $status['progress'],
            'chunk_size' => $this->getRecommendedChunkSize($status['total_size']),
        ];
    }

    /**
     * Cancel and cleanup an upload.
     */
    public function cancelUpload(string $uploadId): bool
    {
        $uploadData = $this->getUploadData($uploadId);

        if (! $uploadData) {
            return false;
        }

        $this->cleanupChunks($uploadId);
        TenantCache::forget("chunked_upload:{$uploadId}");

        Log::info('Chunked upload cancelled', ['upload_id' => $uploadId]);

        return true;
    }

    /**
     * Clean up expired uploads.
     */
    public function cleanupExpiredUploads(): int
    {
        $cleaned = 0;
        $chunksBasePath = $this->chunksFolder;

        // Get all upload directories
        $directories = Storage::disk($this->disk)->directories($chunksBasePath);

        foreach ($directories as $dir) {
            $uploadId = basename($dir);
            $uploadData = $this->getUploadData($uploadId);

            // If no data or expired
            if (! $uploadData || now()->isAfter($uploadData['expires_at'])) {
                $this->cleanupChunks($uploadId);
                TenantCache::forget("chunked_upload:{$uploadId}");
                $cleaned++;
            }
        }

        if ($cleaned > 0) {
            Log::info('Cleaned up expired chunked uploads', ['count' => $cleaned]);
        }

        return $cleaned;
    }

    /**
     * Get upload data from cache.
     *
     * @return array<string, mixed>|null
     */
    protected function getUploadData(string $uploadId): ?array
    {
        return TenantCache::get("chunked_upload:{$uploadId}");
    }

    /**
     * Calculate upload progress percentage.
     *
     * @param  array<string, mixed>  $uploadData
     */
    protected function calculateProgress(array $uploadData): float
    {
        if ($uploadData['total_chunks'] === 0) {
            return 0;
        }

        return round(
            (count($uploadData['uploaded_chunks']) / $uploadData['total_chunks']) * 100,
            2
        );
    }

    /**
     * Get recommended chunk size based on file size.
     */
    protected function getRecommendedChunkSize(int $fileSize): int
    {
        // 1MB for files < 50MB
        if ($fileSize < 50 * 1024 * 1024) {
            return 1024 * 1024;
        }

        // 2MB for files < 200MB
        if ($fileSize < 200 * 1024 * 1024) {
            return 2 * 1024 * 1024;
        }

        // 5MB for files < 1GB
        if ($fileSize < 1024 * 1024 * 1024) {
            return 5 * 1024 * 1024;
        }

        // 10MB for larger files
        return 10 * 1024 * 1024;
    }

    /**
     * Clean up chunk files for an upload.
     */
    protected function cleanupChunks(string $uploadId): void
    {
        $chunksPath = "{$this->chunksFolder}/{$uploadId}";

        if (Storage::disk($this->disk)->exists($chunksPath)) {
            Storage::disk($this->disk)->deleteDirectory($chunksPath);
        }
    }

    /**
     * Set storage disk.
     */
    public function setDisk(string $disk): self
    {
        $this->disk = $disk;

        return $this;
    }
}
