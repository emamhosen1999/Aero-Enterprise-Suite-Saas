<?php

namespace Aero\HRM\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Route waypoint validation service using OSRM
 * Supports multiple routes
 */
class RouteWaypointValidator extends BaseAttendanceValidator
{
    public function validate(): array
    {
        $config = $this->attendanceType->config ?? [];
        $userLat = $this->request->input('lat');
        $userLng = $this->request->input('lng');

        // Check for new multi-route format first, fallback to legacy
        $routes = $config['routes'] ?? [];
        $validationMode = $config['validation_mode'] ?? 'any';
        $allowWithoutLocation = $config['allow_without_location'] ?? false;

        // Legacy support: single waypoints array format
        if (empty($routes) && isset($config['waypoints'])) {
            $routes = [
                [
                    'id' => 'legacy_route',
                    'name' => 'Primary Route',
                    'waypoints' => $config['waypoints'],
                    'tolerance' => $config['tolerance'] ?? 300,
                    'is_active' => true,
                ],
            ];
        }

        // Check if location data is missing
        if (! $userLat || ! $userLng) {
            if ($allowWithoutLocation) {
                return $this->successResponse('Attendance recorded without location validation (location access denied).');
            } else {
                return $this->errorResponse('Location data is required for route waypoint validation. Please enable location access and try again.');
            }
        }

        // Filter active routes
        $activeRoutes = array_filter($routes, fn ($r) => ($r['is_active'] ?? true));

        if (empty($activeRoutes)) {
            return $this->errorResponse('No routes configured for this attendance type.');
        }

        // Validate against all active routes
        $validRoutes = [];
        $checkedRoutes = [];

        foreach ($activeRoutes as $route) {
            $waypoints = $route['waypoints'] ?? [];
            $tolerance = $route['tolerance'] ?? 300;

            if (empty($waypoints)) {
                continue;
            }

            $validation = $this->validateUserLocationWithRoute($userLat, $userLng, $waypoints, $tolerance);

            $checkedRoutes[] = [
                'id' => $route['id'] ?? 'unknown',
                'name' => $route['name'] ?? 'Unnamed',
                'is_valid' => $validation['is_valid'],
                'distance' => $validation['route_data']['distance_to_route'] ?? null,
            ];

            if ($validation['is_valid']) {
                $validRoutes[] = [
                    'route' => $route,
                    'validation' => $validation,
                ];
            }
        }

        // Apply validation mode
        $isValid = $validationMode === 'all'
            ? count($validRoutes) === count($activeRoutes)
            : count($validRoutes) > 0;

        if (! $isValid) {
            // Find closest route for error message
            $closestRoute = null;
            $minDistance = PHP_FLOAT_MAX;

            foreach ($checkedRoutes as $checked) {
                if ($checked['distance'] !== null && $checked['distance'] < $minDistance) {
                    $minDistance = $checked['distance'];
                    $closestRoute = $checked;
                }
            }

            $message = $closestRoute
                ? "You are {$minDistance}m away from the nearest route ({$closestRoute['name']}). Please move closer to an authorized route."
                : 'You are not on any authorized route.';

            return $this->errorResponse($message, 403);
        }

        $matchedRoute = $validRoutes[0];

        return $this->successResponse(
            $matchedRoute['validation']['message'] ?? 'Location verified on route: '.($matchedRoute['route']['name'] ?? 'Valid route'),
            [
                'matched_route' => $matchedRoute['route'],
                'route_data' => $matchedRoute['validation']['route_data'] ?? [],
                'validation_mode' => $validationMode,
                'checked_routes' => $checkedRoutes,
            ]
        );
    }

    /**
     * Validate user location against route waypoints using OSRM
     */
    private function validateUserLocationWithRoute($userLat, $userLng, $waypoints, $tolerance): array
    {
        try {
            $coordinates = $this->buildCoordinatesArray($waypoints);

            if (count($coordinates) < 2) {
                return [
                    'is_valid' => false,
                    'message' => 'At least 2 waypoints are required for route validation.',
                ];
            }

            $routeData = $this->getRouteFromOSRM($coordinates);

            if (! $routeData) {
                return $this->fallbackDistanceValidation($userLat, $userLng, $waypoints, $tolerance);
            }

            $routeCoordinates = $routeData['routes'][0]['geometry']['coordinates'] ?? [];

            if (empty($routeCoordinates)) {
                return $this->fallbackDistanceValidation($userLat, $userLng, $waypoints, $tolerance);
            }

            $minDistance = $this->calculateMinDistanceToRoute($userLat, $userLng, $routeCoordinates);
            $isValid = $minDistance <= $tolerance;

            return [
                'is_valid' => $isValid,
                'message' => $isValid
                    ? "Location verified within {$tolerance}m of the route (distance: ".round($minDistance, 2).'m).'
                    : 'You are '.round($minDistance, 2)."m away from the route. Maximum distance: {$tolerance}m.",
                'route_data' => [
                    'distance_to_route' => round($minDistance, 2),
                    'tolerance' => $tolerance,
                    'route_distance' => $routeData['routes'][0]['distance'] ?? null,
                    'route_duration' => $routeData['routes'][0]['duration'] ?? null,
                ],
            ];

        } catch (\Exception $e) {
            Log::error('OSRM validation error: '.$e->getMessage());

            return $this->fallbackDistanceValidation($userLat, $userLng, $waypoints, $tolerance);
        }
    }

    /**
     * Build coordinates array for OSRM API
     */
    private function buildCoordinatesArray(array $waypoints): array
    {
        $coordinates = [];
        foreach ($waypoints as $waypoint) {
            if (isset($waypoint['lat']) && isset($waypoint['lng'])) {
                $coordinates[] = $waypoint['lng'].','.$waypoint['lat'];
            }
        }

        return $coordinates;
    }

    /**
     * Get route data from OSRM API
     */
    private function getRouteFromOSRM(array $coordinates): ?array
    {
        $osrmBaseUrl = config('services.osrm.url', 'http://router.project-osrm.org');
        $coordinatesString = implode(';', $coordinates);
        $routeUrl = "{$osrmBaseUrl}/route/v1/driving/{$coordinatesString}?overview=full&geometries=geojson";

        $routeResponse = Http::timeout(10)->get($routeUrl);

        if (! $routeResponse->successful()) {
            Log::warning('OSRM route request failed', [
                'url' => $routeUrl,
                'status' => $routeResponse->status(),
                'response' => $routeResponse->body(),
            ]);

            return null;
        }

        return $routeResponse->json();
    }

    /**
     * Calculate minimum distance from user to route
     */
    private function calculateMinDistanceToRoute($userLat, $userLng, $routeCoordinates): float
    {
        $minDistance = PHP_FLOAT_MAX;

        foreach ($routeCoordinates as $coordinate) {
            $routeLng = $coordinate[0];
            $routeLat = $coordinate[1];

            $distance = $this->calculateDistance($userLat, $userLng, $routeLat, $routeLng);

            if ($distance < $minDistance) {
                $minDistance = $distance;
            }
        }

        return $minDistance;
    }

    /**
     * Fallback validation using simple distance to waypoints
     */
    private function fallbackDistanceValidation($userLat, $userLng, $waypoints, $tolerance): array
    {
        $minDistance = null;
        $nearestWaypoint = null;

        foreach ($waypoints as $index => $waypoint) {
            if (isset($waypoint['lat']) && isset($waypoint['lng'])) {
                $distance = $this->calculateDistance(
                    $userLat,
                    $userLng,
                    $waypoint['lat'],
                    $waypoint['lng']
                );

                if ($minDistance === null || $distance < $minDistance) {
                    $minDistance = $distance;
                    $nearestWaypoint = $index + 1;
                }
            }
        }

        $isValid = $minDistance !== null && $minDistance <= $tolerance;

        return [
            'is_valid' => $isValid,
            'message' => $isValid
                ? "Location verified within {$tolerance}m of waypoint {$nearestWaypoint} (distance: ".round($minDistance, 2).'m).'
                : 'You are '.round($minDistance, 2)."m away from the nearest waypoint. Maximum distance: {$tolerance}m.",
            'route_data' => [
                'distance_to_route' => round($minDistance ?? 0, 2),
                'distance_to_nearest_waypoint' => round($minDistance ?? 0, 2),
                'nearest_waypoint' => $nearestWaypoint,
                'tolerance' => $tolerance,
                'fallback_used' => true,
            ],
        ];
    }
}
