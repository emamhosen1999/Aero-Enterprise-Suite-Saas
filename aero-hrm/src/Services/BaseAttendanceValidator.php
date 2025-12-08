<?php

namespace Aero\HRM\Services;

use Illuminate\Http\Request;

/**
 * Base class for attendance validation services
 */
abstract class BaseAttendanceValidator
{
    protected $attendanceType;

    protected $request;

    public function __construct($attendanceType, Request $request)
    {
        $this->attendanceType = $attendanceType;
        $this->request = $request;
    }

    /**
     * Validate attendance based on the specific type
     */
    abstract public function validate(): array;

    /**
     * Calculate distance between two points in meters
     */
    protected function calculateDistance($lat1, $lng1, $lat2, $lng2): float
    {
        $earthRadius = 6371000; // Earth's radius in meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Format location data from request
     */
    protected function formatLocation(): ?array
    {
        $lat = $this->request->input('lat');
        $lng = $this->request->input('lng');

        if (! $lat || ! $lng) {
            return null;
        }

        return [
            'lat' => $lat,
            'lng' => $lng,
            'address' => $this->request->input('address', ''),
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Create success response
     */
    protected function successResponse(string $message = 'Validation successful', array $data = []): array
    {
        return [
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ];
    }

    /**
     * Create error response
     */
    protected function errorResponse(string $message, int $code = 422): array
    {
        return [
            'status' => 'error',
            'message' => $message,
            'code' => $code,
        ];
    }
}
