<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Service for handling attendance punch operations
 */
class AttendancePunchService
{
    /**
     * Process punch in/out for a user
     */
    public function processPunch($user, Request $request): array
    {
        try {
            $today = Carbon::today();

            $existingAttendance = $this->getExistingAttendance($user->id, $today);

            if ($existingAttendance && ! $existingAttendance->punchout) {
                return $this->punchOut($existingAttendance, $request, $user);
            } else {
                return $this->punchIn($user, $today, $request);
            }

        } catch (\Exception $e) {
            Log::error('Attendance punch error: '.$e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'status' => 'error',
                'message' => 'Failed to record attendance. Please try again.',
                'code' => 500,
            ];
        }
    }

    /**
     * Get existing attendance for user and date
     */
    private function getExistingAttendance(int $userId, Carbon $date): ?Attendance
    {
        return Attendance::where('user_id', $userId)
            ->whereDate('date', $date)
            ->latest()
            ->first();
    }

    /**
     * Process punch out
     */
    private function punchOut(Attendance $attendance, Request $request, $user): array
    {
        $attendance->update([
            'punchout' => Carbon::now(),
            'punchout_location' => $this->formatLocation($request),
        ]);

        // Handle photo upload for polygon/route types
        $this->handlePhotoUpload($attendance, $request, 'punchout_photo', $user);

        return [
            'status' => 'success',
            'message' => 'Successfully punched out!',
            'action' => 'punch_out',
            'attendance_id' => $attendance->id,
        ];
    }

    /**
     * Process punch in
     */
    private function punchIn($user, Carbon $date, Request $request): array
    {
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'date' => $date,
            'punchin' => Carbon::now(),
            'punchin_location' => $this->formatLocation($request),
        ]);

        // Handle photo upload for polygon/route types
        $this->handlePhotoUpload($attendance, $request, 'punchin_photo', $user);

        return [
            'status' => 'success',
            'message' => 'Successfully punched in!',
            'action' => 'punch_in',
            'attendance_id' => $attendance->id,
        ];
    }

    /**
     * Handle photo upload using Media Library
     */
    private function handlePhotoUpload(Attendance $attendance, Request $request, string $collection, $user): void
    {
        $photoData = $request->input('photo');

        if (! $photoData) {
            return;
        }

        try {
            // Check if user's attendance type requires photo (polygon or route)
            $attendanceType = $user->attendanceType;
            if (! $attendanceType) {
                return;
            }

            $baseSlug = preg_replace('/_\d+$/', '', $attendanceType->slug);
            if (! in_array($baseSlug, ['geo_polygon', 'route_waypoint'])) {
                return;
            }

            // Decode base64 image
            if (preg_match('/^data:image\/(\w+);base64,/', $photoData, $matches)) {
                $extension = $matches[1];
                $photoData = substr($photoData, strpos($photoData, ',') + 1);
                $photoData = base64_decode($photoData);

                if ($photoData === false) {
                    Log::warning('Failed to decode base64 photo data');

                    return;
                }

                // Generate unique filename
                $filename = 'attendance_'.$attendance->id.'_'.$collection.'_'.time().'.'.$extension;
                $tempPath = storage_path('app/temp/'.$filename);

                // Ensure temp directory exists
                if (! file_exists(storage_path('app/temp'))) {
                    mkdir(storage_path('app/temp'), 0755, true);
                }

                // Save temporarily
                file_put_contents($tempPath, $photoData);

                // Add to media collection
                $attendance->addMedia($tempPath)
                    ->usingFileName($filename)
                    ->toMediaCollection($collection);

                Log::info('Photo uploaded successfully', [
                    'attendance_id' => $attendance->id,
                    'collection' => $collection,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Photo upload failed: '.$e->getMessage(), [
                'attendance_id' => $attendance->id,
                'collection' => $collection,
            ]);
        }
    }

    /**
     * Format location data from request
     */
    private function formatLocation(Request $request): ?string
    {
        $lat = $request->input('lat');
        $lng = $request->input('lng');

        if (! $lat || ! $lng) {
            return null;
        }

        $locationData = [
            'lat' => $lat,
            'lng' => $lng,
            'address' => $request->input('address', ''),
            'timestamp' => now()->toISOString(),
        ];

        return json_encode($locationData);
    }
}
