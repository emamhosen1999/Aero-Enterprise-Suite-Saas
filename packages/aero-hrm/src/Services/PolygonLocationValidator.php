<?php

namespace Aero\HRM\Services;

/**
 * Polygon-based location validation service
 * Supports multiple polygon geofences
 */
class PolygonLocationValidator extends BaseAttendanceValidator
{
    public function validate(): array
    {
        $config = $this->attendanceType->config ?? [];
        $lat = $this->request->input('lat');
        $lng = $this->request->input('lng');

        // Check for new multi-polygon format first, fallback to legacy
        $polygons = $config['polygons'] ?? [];
        $validationMode = $config['validation_mode'] ?? 'any';
        $allowWithoutLocation = $config['allow_without_location'] ?? false;

        // Legacy support: single polygon format
        if (empty($polygons) && isset($config['polygon'])) {
            $polygons = [
                [
                    'id' => 'legacy_polygon',
                    'name' => 'Primary Location',
                    'points' => $config['polygon'],
                    'is_active' => true,
                ],
            ];
        }

        // Check if location data is missing
        if (! $lat || ! $lng) {
            if ($allowWithoutLocation) {
                return $this->successResponse('Attendance recorded without location validation (location access denied).');
            } else {
                return $this->errorResponse('Location coordinates are required for polygon validation. Please enable location access and try again.');
            }
        }

        // Filter active polygons
        $activePolygons = array_filter($polygons, fn ($p) => ($p['is_active'] ?? true));

        if (empty($activePolygons)) {
            return $this->errorResponse('No polygon boundaries configured for this attendance type.');
        }

        // Validate against all active polygons
        $validPolygons = [];
        $checkedPolygons = [];

        foreach ($activePolygons as $polygon) {
            $polygonPoints = $polygon['points'] ?? [];
            if (empty($polygonPoints)) {
                continue;
            }

            $isInside = $this->isPointInPolygon($lat, $lng, $polygonPoints);
            $checkedPolygons[] = [
                'id' => $polygon['id'] ?? 'unknown',
                'name' => $polygon['name'] ?? 'Unnamed',
                'is_valid' => $isInside,
            ];

            if ($isInside) {
                $validPolygons[] = $polygon;
            }
        }

        // Apply validation mode
        $isValid = $validationMode === 'all'
            ? count($validPolygons) === count($activePolygons)
            : count($validPolygons) > 0;

        if (! $isValid) {
            return $this->errorResponse('You are not within any allowed location boundary.', 403);
        }

        return $this->successResponse(
            'Location verified within polygon boundary: '.($validPolygons[0]['name'] ?? 'Valid location'),
            [
                'matched_polygon' => $validPolygons[0] ?? null,
                'validation_mode' => $validationMode,
                'checked_polygons' => $checkedPolygons,
            ]
        );
    }

    /**
     * Check if a point is inside a polygon using ray casting algorithm
     */
    private function isPointInPolygon($lat, $lng, $polygon): bool
    {
        $x = $lng;
        $y = $lat;
        $inside = false;

        $count = count($polygon);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $pointLat = $polygon[$i]['lat'] ?? null;
            $pointLng = $polygon[$i]['lng'] ?? null;
            $prevLat = $polygon[$j]['lat'] ?? null;
            $prevLng = $polygon[$j]['lng'] ?? null;

            if ($pointLat === null || $pointLng === null || $prevLat === null || $prevLng === null) {
                continue;
            }

            if ((($pointLat > $y) !== ($prevLat > $y)) &&
                ($x < ($prevLng - $pointLng) * ($y - $pointLat) / ($prevLat - $pointLat) + $pointLng)) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }
}
