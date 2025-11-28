<?php

namespace Database\Factories;

use App\Models\HRM\AttendanceType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\HRM\AttendanceType>
 */
class AttendanceTypeFactory extends Factory
{
    protected $model = AttendanceType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['geo_polygon', 'wifi_ip', 'route_waypoint', 'qr_code'];
        $type = $this->faker->randomElement($types);

        return [
            'name' => ucfirst(str_replace('_', ' ', $type)),
            'slug' => $type.'_'.$this->faker->unique()->randomNumber(5),
            'is_active' => true,
            'config' => $this->getDefaultConfig($type),
        ];
    }

    /**
     * Get default config for a type.
     */
    protected function getDefaultConfig(string $type): array
    {
        return match ($type) {
            'geo_polygon' => [
                'polygons' => [],
                'validation_mode' => 'any',
                'allow_without_location' => false,
            ],
            'wifi_ip' => [
                'ip_locations' => [],
                'validation_mode' => 'any',
                'allow_without_network' => false,
            ],
            'route_waypoint' => [
                'routes' => [],
                'validation_mode' => 'any',
                'tolerance' => 150,
            ],
            'qr_code' => [
                'qr_codes' => [],
                'code_expiry_hours' => 24,
                'one_time_use' => false,
                'require_location' => false,
            ],
            default => [],
        };
    }

    /**
     * Configure as geo_polygon type.
     */
    public function geoPolygon(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Geo Polygon',
            'slug' => 'geo_polygon_'.$this->faker->unique()->randomNumber(5),
            'config' => [
                'polygons' => [],
                'validation_mode' => 'any',
                'allow_without_location' => false,
            ],
        ]);
    }

    /**
     * Configure as wifi_ip type.
     */
    public function wifiIp(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'WiFi IP',
            'slug' => 'wifi_ip_'.$this->faker->unique()->randomNumber(5),
            'config' => [
                'ip_locations' => [],
                'validation_mode' => 'any',
                'allow_without_network' => false,
            ],
        ]);
    }

    /**
     * Configure as route_waypoint type.
     */
    public function routeWaypoint(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Route Waypoint',
            'slug' => 'route_waypoint_'.$this->faker->unique()->randomNumber(5),
            'config' => [
                'routes' => [],
                'validation_mode' => 'any',
                'tolerance' => 150,
            ],
        ]);
    }

    /**
     * Configure as qr_code type.
     */
    public function qrCode(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'QR Code',
            'slug' => 'qr_code_'.$this->faker->unique()->randomNumber(5),
            'config' => [
                'qr_codes' => [],
                'code_expiry_hours' => 24,
                'one_time_use' => false,
                'require_location' => false,
            ],
        ]);
    }

    /**
     * With sample polygons.
     */
    public function withPolygons(?array $polygons = null): static
    {
        $polygons ??= [
            [
                'id' => 'polygon_1',
                'name' => 'Main Office',
                'coordinates' => [
                    ['lat' => 23.8103, 'lng' => 90.4125],
                    ['lat' => 23.8110, 'lng' => 90.4130],
                    ['lat' => 23.8115, 'lng' => 90.4120],
                    ['lat' => 23.8108, 'lng' => 90.4115],
                ],
            ],
        ];

        return $this->state(fn (array $attributes) => [
            'slug' => 'geo_polygon_'.$this->faker->unique()->randomNumber(5),
            'config' => array_merge($attributes['config'] ?? [], [
                'polygons' => $polygons,
            ]),
        ]);
    }

    /**
     * With sample IP locations.
     */
    public function withIpLocations(?array $ipLocations = null): static
    {
        $ipLocations ??= [
            [
                'id' => 'ip_1',
                'name' => 'Main Office',
                'ip_addresses' => ['192.168.1.0/24', '10.0.0.1'],
            ],
        ];

        return $this->state(fn (array $attributes) => [
            'slug' => 'wifi_ip_'.$this->faker->unique()->randomNumber(5),
            'config' => array_merge($attributes['config'] ?? [], [
                'ip_locations' => $ipLocations,
            ]),
        ]);
    }

    /**
     * With sample routes.
     */
    public function withRoutes(?array $routes = null): static
    {
        $routes ??= [
            [
                'id' => 'route_1',
                'name' => 'Route A',
                'waypoints' => [
                    ['lat' => 23.8103, 'lng' => 90.4125, 'name' => 'Start'],
                    ['lat' => 23.8203, 'lng' => 90.4225, 'name' => 'End'],
                ],
                'tolerance' => 150,
            ],
        ];

        return $this->state(fn (array $attributes) => [
            'slug' => 'route_waypoint_'.$this->faker->unique()->randomNumber(5),
            'config' => array_merge($attributes['config'] ?? [], [
                'routes' => $routes,
            ]),
        ]);
    }

    /**
     * With sample QR codes.
     */
    public function withQrCodes(?array $qrCodes = null): static
    {
        $qrCodes ??= [
            [
                'id' => 'qr_1',
                'name' => 'Main Entrance',
                'code' => 'AERO-'.strtoupper(bin2hex(random_bytes(8))),
                'created_at' => now()->toIso8601String(),
            ],
        ];

        return $this->state(fn (array $attributes) => [
            'slug' => 'qr_code_'.$this->faker->unique()->randomNumber(5),
            'config' => array_merge($attributes['config'] ?? [], [
                'qr_codes' => $qrCodes,
            ]),
        ]);
    }

    /**
     * Inactive state.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
