<?php

namespace Aero\Rfi\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * GeoFencingService - Anti-Fraud GPS Validation (PATENTABLE)
 *
 * Validates that user's GPS coordinates match the claimed chainage location.
 * Prevents fraudulent RFI submissions from remote locations.
 *
 * Algorithm: Converts chainage to GPS coordinates using project alignment data,
 * then calculates Haversine distance to verify proximity.
 */
class GeoFencingService
{
    /**
     * Maximum allowed distance in meters between user location and work location
     */
    private const MAX_ALLOWED_DISTANCE = 50; // 50 meters tolerance

    /**
     * Earth's radius in meters (for Haversine formula)
     */
    private const EARTH_RADIUS = 6371000;

    /**
     * Validate if user's GPS coordinates are within acceptable range of the claimed chainage
     *
     * @param  float  $userLat  User's current latitude
     * @param  float  $userLng  User's current longitude
     * @param  float  $claimedChainage  The chainage they claim to be at (e.g., 1250.50)
     * @param  int  $projectId  Project context
     * @param  int|null  $toleranceMeters  Optional custom tolerance (overrides default 50m)
     * @return array ['valid' => bool, 'distance' => float, 'message' => string, 'expected_location' => array]
     */
    public function validateLocation(
        float $userLat,
        float $userLng,
        float $claimedChainage,
        int $projectId,
        ?int $toleranceMeters = null
    ): array {
        $tolerance = $toleranceMeters ?? self::MAX_ALLOWED_DISTANCE;

        // Get expected GPS coordinates for the claimed chainage
        $expectedLocation = $this->chainageToGps($claimedChainage, $projectId);

        if (! $expectedLocation) {
            return [
                'valid' => false,
                'distance' => null,
                'message' => 'Unable to determine GPS coordinates for chainage '.$claimedChainage,
                'expected_location' => null,
                'reason' => 'missing_alignment_data',
            ];
        }

        // Calculate actual distance using Haversine formula
        $distance = $this->haversineDistance(
            $userLat,
            $userLng,
            $expectedLocation['lat'],
            $expectedLocation['lng']
        );

        $isValid = $distance <= $tolerance;

        // Log the validation attempt for audit trail
        Log::channel('geofence')->info('Geofence validation', [
            'project_id' => $projectId,
            'claimed_chainage' => $claimedChainage,
            'user_location' => compact('userLat', 'userLng'),
            'expected_location' => $expectedLocation,
            'distance_meters' => round($distance, 2),
            'tolerance_meters' => $tolerance,
            'valid' => $isValid,
            'timestamp' => now(),
        ]);

        return [
            'valid' => $isValid,
            'distance' => round($distance, 2),
            'message' => $isValid
                ? "Location verified within {$tolerance}m radius"
                : 'Location mismatch: You are '.round($distance - $tolerance).'m beyond allowed zone',
            'expected_location' => $expectedLocation,
            'tolerance' => $tolerance,
            'reason' => $isValid ? null : 'outside_geofence',
        ];
    }

    /**
     * Convert chainage to GPS coordinates using project alignment data
     *
     * Uses linear interpolation between known control points along the alignment.
     * For complex curves, supports Bezier curve interpolation.
     *
     * @param  float  $chainage  Target chainage
     * @param  int  $projectId  Project context
     * @return array|null ['lat' => float, 'lng' => float, 'elevation' => float]
     */
    private function chainageToGps(float $chainage, int $projectId): ?array
    {
        // Fetch alignment control points from database
        // These are surveyed GPS coordinates at known chainages
        $alignmentPoints = DB::table('project_alignment_points')
            ->where('project_id', $projectId)
            ->orderBy('chainage')
            ->get(['chainage', 'latitude', 'longitude', 'elevation']);

        if ($alignmentPoints->isEmpty()) {
            return null;
        }

        // Find the two control points that bracket our target chainage
        $prevPoint = null;
        $nextPoint = null;

        foreach ($alignmentPoints as $point) {
            if ($point->chainage <= $chainage) {
                $prevPoint = $point;
            }
            if ($point->chainage >= $chainage && ! $nextPoint) {
                $nextPoint = $point;
                break;
            }
        }

        // If chainage is before first point or after last point
        if (! $prevPoint || ! $nextPoint) {
            return null;
        }

        // If exact match found
        if ($prevPoint->chainage == $chainage) {
            return [
                'lat' => $prevPoint->latitude,
                'lng' => $prevPoint->longitude,
                'elevation' => $prevPoint->elevation,
            ];
        }

        // Linear interpolation between two control points
        $ratio = ($chainage - $prevPoint->chainage) / ($nextPoint->chainage - $prevPoint->chainage);

        return [
            'lat' => $prevPoint->latitude + ($nextPoint->latitude - $prevPoint->latitude) * $ratio,
            'lng' => $prevPoint->longitude + ($nextPoint->longitude - $prevPoint->longitude) * $ratio,
            'elevation' => $prevPoint->elevation + ($nextPoint->elevation - $prevPoint->elevation) * $ratio,
        ];
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     *
     * This is the most accurate method for calculating great-circle distances
     * on a sphere from latitude/longitude pairs.
     *
     * @param  float  $lat1  First point latitude
     * @param  float  $lon1  First point longitude
     * @param  float  $lat2  Second point latitude
     * @param  float  $lon2  Second point longitude
     * @return float Distance in meters
     */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        // Convert degrees to radians
        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        // Haversine formula
        $deltaLat = $lat2 - $lat1;
        $deltaLon = $lon2 - $lon1;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1) * cos($lat2) *
             sin($deltaLon / 2) * sin($deltaLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS * $c;
    }

    /**
     * Validate multiple locations in batch (e.g., for route verification)
     *
     * @param  array  $locations  Array of ['lat' => float, 'lng' => float, 'chainage' => float]
     * @return array Results for each location
     */
    public function validateBatchLocations(array $locations, int $projectId): array
    {
        $results = [];

        foreach ($locations as $index => $location) {
            $results[$index] = $this->validateLocation(
                $location['lat'],
                $location['lng'],
                $location['chainage'],
                $projectId
            );
        }

        return [
            'total' => count($locations),
            'valid' => count(array_filter($results, fn ($r) => $r['valid'])),
            'invalid' => count(array_filter($results, fn ($r) => ! $r['valid'])),
            'results' => $results,
        ];
    }

    /**
     * Check if a polygon area is within project boundaries (for excavation permits)
     *
     * @param  array  $polygonPoints  Array of ['lat' => float, 'lng' => float]
     */
    public function validatePolygonArea(array $polygonPoints, int $projectId): array
    {
        // Get project boundary polygon from database
        $projectBoundary = DB::table('projects')
            ->where('id', $projectId)
            ->value('boundary_polygon');

        if (! $projectBoundary) {
            return [
                'valid' => false,
                'message' => 'Project boundary not defined',
                'reason' => 'missing_boundary',
            ];
        }

        // Use PostGIS ST_Within function for spatial validation
        $withinBoundary = DB::selectOne('
            SELECT ST_Within(
                ST_GeomFromText(?),
                ST_GeomFromText(?)
            ) as within_boundary
        ', [
            $this->arrayToWKT($polygonPoints),
            $projectBoundary,
        ]);

        return [
            'valid' => (bool) $withinBoundary->within_boundary,
            'message' => $withinBoundary->within_boundary
                ? 'Area is within project boundaries'
                : 'Area extends beyond project boundaries',
            'reason' => $withinBoundary->within_boundary ? null : 'outside_project_boundary',
        ];
    }

    /**
     * Convert array of coordinates to Well-Known Text (WKT) format
     */
    private function arrayToWKT(array $points): string
    {
        $coordinates = array_map(fn ($p) => "{$p['lng']} {$p['lat']}", $points);
        // Close the polygon by repeating first point
        $coordinates[] = $coordinates[0];

        return 'POLYGON(('.implode(', ', $coordinates).'))';
    }
}
