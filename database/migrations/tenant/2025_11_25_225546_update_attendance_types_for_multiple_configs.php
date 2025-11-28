<?php

use Illuminate\Database\Migrations\Migration;

/**
 * Migration to enhance attendance types for multiple configurations
 *
 * Changes:
 * 1. Migrate single configurations to array-based multiple configurations
 * 2. Add support for multiple routes, IP ranges, polygons, and QR codes
 * 3. Add validation mode (any, all) to specify how multiple configs are validated
 * 4. Add allow_without_location flag for graceful fallback
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing attendance type configs to new multi-config structure
        $types = \App\Models\HRM\AttendanceType::all();

        foreach ($types as $type) {
            $config = $type->config ?? [];
            $newConfig = [];

            switch ($type->slug) {
                case 'geo_polygon':
                    // Migrate single polygon to polygons array
                    if (isset($config['polygon']) && ! empty($config['polygon'])) {
                        $newConfig = [
                            'polygons' => [
                                [
                                    'id' => 'polygon_1',
                                    'name' => 'Primary Location',
                                    'points' => $config['polygon'],
                                    'is_active' => true,
                                ],
                            ],
                            'validation_mode' => 'any', // User can be in ANY of the polygons
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                    } elseif (isset($config['polygons']) && is_array($config['polygons'])) {
                        // Already has polygons array, migrate old format if needed
                        $polygons = [];
                        foreach ($config['polygons'] as $index => $polygon) {
                            if (is_array($polygon) && isset($polygon[0]) && is_array($polygon[0]) && isset($polygon[0][0])) {
                                // Old format: [[lat, lng], [lat, lng], ...]
                                $polygons[] = [
                                    'id' => 'polygon_'.($index + 1),
                                    'name' => 'Location '.($index + 1),
                                    'points' => array_map(fn ($p) => ['lat' => $p[0], 'lng' => $p[1]], $polygon),
                                    'is_active' => true,
                                ];
                            } elseif (is_array($polygon) && isset($polygon['points'])) {
                                // New format already
                                $polygons[] = $polygon;
                            }
                        }
                        $newConfig = [
                            'polygons' => $polygons,
                            'validation_mode' => $config['validation_mode'] ?? 'any',
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                    } else {
                        $newConfig = [
                            'polygons' => [],
                            'validation_mode' => 'any',
                            'allow_without_location' => false,
                        ];
                    }
                    break;

                case 'wifi_ip':
                    // Migrate to ip_locations array for multiple office IPs
                    $allowedIps = $config['allowed_ips'] ?? [];
                    $allowedRanges = $config['allowed_ranges'] ?? [];

                    if (! empty($allowedIps) || ! empty($allowedRanges)) {
                        $newConfig = [
                            'ip_locations' => [
                                [
                                    'id' => 'office_1',
                                    'name' => 'Primary Office',
                                    'allowed_ips' => $allowedIps,
                                    'allowed_ranges' => $allowedRanges,
                                    'is_active' => true,
                                ],
                            ],
                            'validation_mode' => 'any',
                            'allow_without_network' => $config['allow_without_network'] ?? false,
                        ];
                    } else {
                        $newConfig = [
                            'ip_locations' => [],
                            'validation_mode' => 'any',
                            'allow_without_network' => false,
                        ];
                    }
                    break;

                case 'route_waypoint':
                case 'route-waypoint':
                    // Migrate to routes array for multiple routes
                    $waypoints = $config['waypoints'] ?? [];
                    $tolerance = $config['tolerance'] ?? 300;

                    if (! empty($waypoints)) {
                        $newConfig = [
                            'routes' => [
                                [
                                    'id' => 'route_1',
                                    'name' => 'Primary Route',
                                    'waypoints' => $waypoints,
                                    'tolerance' => $tolerance,
                                    'is_active' => true,
                                ],
                            ],
                            'validation_mode' => 'any',
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                    } else {
                        $newConfig = [
                            'routes' => [],
                            'validation_mode' => 'any',
                            'allow_without_location' => false,
                        ];
                    }
                    break;

                case 'qr_code':
                    // Ensure QR code config is complete
                    $qrCodes = $config['qr_codes'] ?? [];
                    $newConfig = [
                        'qr_codes' => $qrCodes,
                        'code_expiry_hours' => $config['code_expiry_hours'] ?? 24,
                        'one_time_use' => $config['one_time_use'] ?? false,
                        'require_location' => $config['require_location'] ?? false,
                        'max_distance' => $config['max_distance'] ?? 100,
                    ];
                    break;

                default:
                    $newConfig = $config;
            }

            $type->update(['config' => $newConfig]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to single configuration format
        $types = \App\Models\HRM\AttendanceType::all();

        foreach ($types as $type) {
            $config = $type->config ?? [];
            $oldConfig = [];

            switch ($type->slug) {
                case 'geo_polygon':
                    if (isset($config['polygons'][0]['points'])) {
                        $oldConfig = [
                            'polygon' => $config['polygons'][0]['points'],
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                    }
                    break;

                case 'wifi_ip':
                    if (isset($config['ip_locations'][0])) {
                        $oldConfig = [
                            'allowed_ips' => $config['ip_locations'][0]['allowed_ips'] ?? [],
                            'allowed_ranges' => $config['ip_locations'][0]['allowed_ranges'] ?? [],
                        ];
                    }
                    break;

                case 'route_waypoint':
                case 'route-waypoint':
                    if (isset($config['routes'][0])) {
                        $oldConfig = [
                            'waypoints' => $config['routes'][0]['waypoints'] ?? [],
                            'tolerance' => $config['routes'][0]['tolerance'] ?? 300,
                            'allow_without_location' => $config['allow_without_location'] ?? false,
                        ];
                    }
                    break;

                case 'qr_code':
                    $oldConfig = $config;
                    break;

                default:
                    $oldConfig = $config;
            }

            $type->update(['config' => $oldConfig]);
        }
    }
};
