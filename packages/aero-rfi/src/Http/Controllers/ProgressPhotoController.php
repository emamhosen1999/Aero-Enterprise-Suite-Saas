<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\ProgressPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProgressPhotoController extends Controller
{
    /**
     * Display a listing of progress photos.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = ProgressPhoto::query()
            ->with(['rfi', 'workLayer', 'chainageProgress', 'uploader', 'approver'])
            ->orderBy('captured_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('file_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('captured_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('captured_at', '<=', $request->date_to);
        }

        // Pagination
        $perPage = $request->get('perPage', 30);
        $photos = $query->paginate($perPage);

        // If JSON request (for API), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'items' => $photos->items(),
                'total' => $photos->total(),
                'currentPage' => $photos->currentPage(),
                'lastPage' => $photos->lastPage(),
            ]);
        }

        // Otherwise return Inertia page
        return Inertia::render('RFI/ProgressPhotos/Index', [
            'photos' => $photos,
            'filters' => $request->only(['search', 'category', 'approval_status', 'date_from', 'date_to']),
            'stats' => $this->getPhotoStats(),
        ]);
    }

    /**
     * Store a newly created progress photo.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'required|exists:daily_works,id',
            'work_layer_id' => 'nullable|exists:work_layers,id',
            'chainage_progress_id' => 'nullable|exists:chainage_progress,id',
            'file' => 'required|image|max:10240', // 10MB max
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:progress,issue,completion,before,after,quality_check',
            'chainage_m' => 'nullable|numeric',
            'gps_latitude' => 'nullable|numeric',
            'gps_longitude' => 'nullable|numeric',
            'gps_accuracy_m' => 'nullable|numeric',
            'captured_at' => 'required|date',
        ]);

        // Upload file
        $file = $request->file('file');
        $path = $file->store('progress-photos', 'public');

        // Extract EXIF data if available
        $exifData = $this->extractExifData($file);

        // Create photo record
        $photo = ProgressPhoto::create([
            ...$validated,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size_bytes' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'exif_camera_make' => $exifData['make'] ?? null,
            'exif_camera_model' => $exifData['model'] ?? null,
            'exif_timestamp' => $exifData['timestamp'] ?? null,
            'uploaded_by' => Auth::id(),
            'approval_status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'data' => $photo->load(['rfi', 'workLayer', 'uploader']),
        ], 201);
    }

    /**
     * Display the specified progress photo.
     */
    public function show(ProgressPhoto $progressPhoto): JsonResponse
    {
        return response()->json([
            'data' => $progressPhoto->load(['rfi', 'workLayer', 'chainageProgress', 'uploader', 'approver']),
        ]);
    }

    /**
     * Update the specified progress photo.
     */
    public function update(Request $request, ProgressPhoto $progressPhoto): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|in:progress,issue,completion,before,after,quality_check',
            'chainage_m' => 'nullable|numeric',
            'gps_latitude' => 'nullable|numeric',
            'gps_longitude' => 'nullable|numeric',
            'captured_at' => 'sometimes|required|date',
        ]);

        $progressPhoto->update($validated);

        return response()->json([
            'message' => 'Photo updated successfully',
            'data' => $progressPhoto->fresh(['rfi', 'workLayer', 'uploader']),
        ]);
    }

    /**
     * Remove the specified progress photo.
     */
    public function destroy(ProgressPhoto $progressPhoto): JsonResponse
    {
        // Delete file from storage
        if ($progressPhoto->file_path) {
            Storage::disk('public')->delete($progressPhoto->file_path);
        }

        $progressPhoto->delete();

        return response()->json([
            'message' => 'Photo deleted successfully',
        ]);
    }

    /**
     * Submit photo for approval.
     */
    public function submit(ProgressPhoto $progressPhoto): JsonResponse
    {
        if ($progressPhoto->approval_status !== 'draft') {
            return response()->json([
                'message' => 'Photo cannot be submitted in its current status',
            ], 400);
        }

        $progressPhoto->update([
            'approval_status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json([
            'message' => 'Photo submitted for approval',
            'data' => $progressPhoto->fresh(),
        ]);
    }

    /**
     * Approve or reject a photo.
     */
    public function approve(Request $request, ProgressPhoto $progressPhoto): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'approval_remarks' => 'nullable|string',
        ]);

        if ($progressPhoto->approval_status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted photos can be approved/rejected',
            ], 400);
        }

        $progressPhoto->update([
            'approval_status' => $validated['status'],
            'approval_remarks' => $validated['approval_remarks'] ?? null,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => "Photo {$validated['status']} successfully",
            'data' => $progressPhoto->fresh(['approver']),
        ]);
    }

    /**
     * Get photo statistics.
     */
    public function getPhotoStats(): array
    {
        return [
            'total_photos' => ProgressPhoto::count(),
            'approved' => ProgressPhoto::where('approval_status', 'approved')->count(),
            'pending' => ProgressPhoto::where('approval_status', 'submitted')->count(),
            'draft' => ProgressPhoto::where('approval_status', 'draft')->count(),
            'with_gps' => ProgressPhoto::whereNotNull('gps_latitude')->whereNotNull('gps_longitude')->count(),
            'total_size_mb' => round(ProgressPhoto::sum('file_size_bytes') / 1048576, 2),
        ];
    }

    /**
     * Get photos by chainage range.
     */
    public function byChainage(Request $request): JsonResponse
    {
        $request->validate([
            'start_chainage' => 'required|numeric',
            'end_chainage' => 'required|numeric|gte:start_chainage',
        ]);

        $photos = ProgressPhoto::query()
            ->whereBetween('chainage_m', [$request->start_chainage, $request->end_chainage])
            ->with(['rfi', 'workLayer', 'uploader'])
            ->orderBy('chainage_m')
            ->get();

        return response()->json(['data' => $photos]);
    }

    /**
     * Get photo timeline.
     */
    public function timeline(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $timeline = ProgressPhoto::query()
            ->whereBetween('captured_at', [$request->date_from, $request->date_to])
            ->select(
                DB::raw('DATE(captured_at) as date'),
                'category',
                DB::raw('COUNT(*) as photo_count')
            )
            ->groupBy(DB::raw('DATE(captured_at)'), 'category')
            ->orderBy('date')
            ->get()
            ->groupBy('date');

        return response()->json(['data' => $timeline]);
    }

    /**
     * Extract EXIF data from uploaded image.
     */
    private function extractExifData($file): array
    {
        $exifData = [];

        try {
            if (function_exists('exif_read_data')) {
                $exif = @exif_read_data($file->getPathname());

                if ($exif) {
                    $exifData['make'] = $exif['Make'] ?? null;
                    $exifData['model'] = $exif['Model'] ?? null;
                    $exifData['timestamp'] = $exif['DateTimeOriginal'] ?? $exif['DateTime'] ?? null;
                }
            }
        } catch (\Exception $e) {
            // Silently fail EXIF extraction
        }

        return $exifData;
    }
}
