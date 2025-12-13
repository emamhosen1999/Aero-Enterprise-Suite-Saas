<?php

namespace Aero\Platform\Http\Controllers\Upload;

use Aero\Platform\Services\Shared\Upload\ChunkedUploadService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChunkedUploadController extends Controller
{
    public function __construct(
        protected ChunkedUploadService $uploadService
    ) {}

    /**
     * Initialize a new chunked upload.
     */
    public function initialize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filename' => 'required|string|max:255',
            'total_size' => 'required|integer|min:1',
            'total_chunks' => 'required|integer|min:1|max:10000',
            'mime_type' => 'nullable|string',
            'folder' => 'nullable|string|max:255',
        ]);

        try {
            $result = $this->uploadService->initializeUpload(
                $validated['filename'],
                $validated['total_size'],
                $validated['total_chunks'],
                [
                    'mime_type' => $validated['mime_type'] ?? null,
                    'folder' => $validated['folder'] ?? null,
                    'user_id' => auth()->id(),
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Upload a single chunk.
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'upload_id' => 'required|string|uuid',
            'chunk_index' => 'required|integer|min:0',
            'chunk' => 'required|file',
        ]);

        try {
            $result = $this->uploadService->uploadChunk(
                $validated['upload_id'],
                $validated['chunk_index'],
                $request->file('chunk')
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Assemble all chunks into final file.
     */
    public function assemble(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'upload_id' => 'required|string|uuid',
            'destination_path' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->uploadService->assembleChunks(
                $validated['upload_id'],
                $validated['destination_path'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get upload status.
     */
    public function status(string $uploadId): JsonResponse
    {
        $status = $this->uploadService->getUploadStatus($uploadId);

        if (! $status) {
            return response()->json([
                'success' => false,
                'message' => 'Upload not found or expired',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    /**
     * Resume an upload.
     */
    public function resume(string $uploadId): JsonResponse
    {
        $result = $this->uploadService->resumeUpload($uploadId);

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => 'Upload not found or expired',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Cancel an upload.
     */
    public function cancel(string $uploadId): JsonResponse
    {
        $result = $this->uploadService->cancelUpload($uploadId);

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => 'Upload not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Upload cancelled successfully',
        ]);
    }
}
