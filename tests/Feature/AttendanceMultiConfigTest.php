<?php

namespace Tests\Feature;

use App\Models\HRM\AttendanceType;
use App\Models\User;
use App\Services\Attendance\IpLocationValidator;
use App\Services\Attendance\PolygonLocationValidator;
use App\Services\Attendance\QrCodeValidator;
use App\Services\Attendance\RouteWaypointValidator;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Tests\TestCase;

class AttendanceMultiConfigTest extends TestCase
{
    use DatabaseTransactions;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user for testing
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    /**
     * Test polygon validator with multiple polygons - any mode
     */
    public function test_polygon_validator_any_mode_validates_in_any_polygon(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test Polygon',
            'slug' => 'geo_polygon_test_'.uniqid(),
            'config' => [
                'polygons' => [
                    [
                        'id' => 'polygon_1',
                        'name' => 'Office A',
                        'points' => [
                            ['lat' => 23.0, 'lng' => 90.0],
                            ['lat' => 23.0, 'lng' => 90.1],
                            ['lat' => 23.1, 'lng' => 90.1],
                            ['lat' => 23.1, 'lng' => 90.0],
                        ],
                        'is_active' => true,
                    ],
                    [
                        'id' => 'polygon_2',
                        'name' => 'Office B',
                        'points' => [
                            ['lat' => 24.0, 'lng' => 91.0],
                            ['lat' => 24.0, 'lng' => 91.1],
                            ['lat' => 24.1, 'lng' => 91.1],
                            ['lat' => 24.1, 'lng' => 91.0],
                        ],
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'any',
                'allow_without_location' => false,
            ],
        ]);

        // Test user in first polygon
        $request = Request::create('/punch', 'POST', [
            'lat' => 23.05,
            'lng' => 90.05,
        ]);

        $validator = new PolygonLocationValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
        $this->assertStringContainsString('Office A', $result['message']);
    }

    /**
     * Test IP validator with multiple office locations
     */
    public function test_ip_validator_validates_any_office(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test IP',
            'slug' => 'wifi_ip_test_'.uniqid(),
            'config' => [
                'ip_locations' => [
                    [
                        'id' => 'office_1',
                        'name' => 'Head Office',
                        'allowed_ips' => ['192.168.1.100', '192.168.1.101'],
                        'allowed_ranges' => [],
                        'is_active' => true,
                    ],
                    [
                        'id' => 'office_2',
                        'name' => 'Branch Office',
                        'allowed_ips' => ['10.0.0.50'],
                        'allowed_ranges' => ['10.0.1.0/24'],
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'any',
                'allow_without_network' => false,
            ],
        ]);

        // Test user from head office IP
        $request = Request::create('/punch', 'POST', [], [], [], [
            'REMOTE_ADDR' => '192.168.1.100',
        ]);

        $validator = new IpLocationValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
        $this->assertStringContainsString('Head Office', $result['message']);
    }

    /**
     * Test IP validator with CIDR range
     */
    public function test_ip_validator_validates_cidr_range(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test CIDR',
            'slug' => 'wifi_ip_cidr_'.uniqid(),
            'config' => [
                'ip_locations' => [
                    [
                        'id' => 'office_1',
                        'name' => 'Branch Office',
                        'allowed_ips' => [],
                        'allowed_ranges' => ['10.0.1.0/24'],
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'any',
                'allow_without_network' => false,
            ],
        ]);

        // Test user from IP within range
        $request = Request::create('/punch', 'POST', [], [], [], [
            'REMOTE_ADDR' => '10.0.1.55',
        ]);

        $validator = new IpLocationValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
    }

    /**
     * Test route validator with multiple routes
     */
    public function test_route_validator_validates_any_route(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test Route',
            'slug' => 'route_waypoint_test_'.uniqid(),
            'config' => [
                'routes' => [
                    [
                        'id' => 'route_1',
                        'name' => 'Route A',
                        'waypoints' => [
                            ['lat' => 23.0, 'lng' => 90.0],
                            ['lat' => 23.1, 'lng' => 90.1],
                        ],
                        'tolerance' => 500,
                        'is_active' => true,
                    ],
                    [
                        'id' => 'route_2',
                        'name' => 'Route B',
                        'waypoints' => [
                            ['lat' => 24.0, 'lng' => 91.0],
                            ['lat' => 24.1, 'lng' => 91.1],
                        ],
                        'tolerance' => 500,
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'any',
                'allow_without_location' => false,
            ],
        ]);

        // Test user near first route waypoint
        $request = Request::create('/punch', 'POST', [
            'lat' => 23.0,
            'lng' => 90.0,
        ]);

        $validator = new RouteWaypointValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
    }

    /**
     * Test QR code validator
     */
    public function test_qr_code_validator_validates_code(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test QR',
            'slug' => 'qr_code_test_'.uniqid(),
            'config' => [
                'qr_codes' => [
                    [
                        'id' => 'qr_1',
                        'code' => 'TEST123ABC',
                        'name' => 'Reception QR',
                        'is_active' => true,
                        'location' => null,
                        'require_location' => false,
                    ],
                ],
                'code_expiry_hours' => 24,
                'one_time_use' => false,
                'require_location' => false,
                'max_distance' => 100,
            ],
        ]);

        $request = Request::create('/punch', 'POST', [
            'qr_code' => 'TEST123ABC',
        ]);

        $validator = new QrCodeValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
        $this->assertStringContainsString('validated successfully', $result['message']);
    }

    /**
     * Test QR code validator rejects invalid code
     */
    public function test_qr_code_validator_rejects_invalid_code(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test QR Invalid',
            'slug' => 'qr_code_invalid_'.uniqid(),
            'config' => [
                'qr_codes' => [
                    [
                        'id' => 'qr_1',
                        'code' => 'TEST123ABC',
                        'name' => 'Reception QR',
                        'is_active' => true,
                    ],
                ],
                'code_expiry_hours' => 24,
                'one_time_use' => false,
            ],
        ]);

        $request = Request::create('/punch', 'POST', [
            'qr_code' => 'INVALID_CODE',
        ]);

        $validator = new QrCodeValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('error', $result['status']);
        $this->assertEquals(403, $result['code']);
    }

    /**
     * Test QR code generation
     */
    public function test_qr_code_generation(): void
    {
        $qrCode = QrCodeValidator::generateQrCode([
            'name' => 'Test QR',
            'location' => ['lat' => 23.0, 'lng' => 90.0],
            'max_distance' => 50,
            'require_location' => true,
        ]);

        $this->assertArrayHasKey('id', $qrCode);
        $this->assertArrayHasKey('code', $qrCode);
        $this->assertArrayHasKey('qr_image_url', $qrCode);
        $this->assertEquals('Test QR', $qrCode['name']);
        $this->assertEquals(50, $qrCode['max_distance']);
        $this->assertTrue($qrCode['require_location']);
    }

    /**
     * Test allow_without_location fallback for polygon
     */
    public function test_polygon_allows_without_location_when_configured(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test Polygon Fallback',
            'slug' => 'geo_polygon_fallback_'.uniqid(),
            'config' => [
                'polygons' => [
                    [
                        'id' => 'polygon_1',
                        'name' => 'Office',
                        'points' => [
                            ['lat' => 23.0, 'lng' => 90.0],
                            ['lat' => 23.0, 'lng' => 90.1],
                            ['lat' => 23.1, 'lng' => 90.1],
                        ],
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'any',
                'allow_without_location' => true,
            ],
        ]);

        // Request without location
        $request = Request::create('/punch', 'POST');

        $validator = new PolygonLocationValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
        $this->assertStringContainsString('without location', $result['message']);
    }

    /**
     * Test IP validator allows without network when configured
     */
    public function test_ip_validator_allows_without_network_when_configured(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test IP Fallback',
            'slug' => 'wifi_ip_fallback_'.uniqid(),
            'config' => [
                'ip_locations' => [
                    [
                        'id' => 'office_1',
                        'name' => 'Main Office',
                        'allowed_ips' => ['192.168.1.100'],
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'any',
                'allow_without_network' => true,
            ],
        ]);

        // Test with a different IP
        $request = Request::create('/punch', 'POST', [], [], [], [
            'REMOTE_ADDR' => '203.0.113.50',
        ]);

        $validator = new IpLocationValidator($type, $request);
        $result = $validator->validate();

        $this->assertEquals('success', $result['status']);
        $this->assertStringContainsString('attendance allowed', $result['message']);
    }

    /**
     * Test multiple polygon validation with 'all' mode
     */
    public function test_polygon_all_mode_requires_all_polygons(): void
    {
        $type = AttendanceType::factory()->create([
            'name' => 'Test Polygon All',
            'slug' => 'geo_polygon_all_'.uniqid(),
            'config' => [
                'polygons' => [
                    [
                        'id' => 'polygon_1',
                        'name' => 'Zone A',
                        'points' => [
                            ['lat' => 23.0, 'lng' => 90.0],
                            ['lat' => 23.0, 'lng' => 90.1],
                            ['lat' => 23.1, 'lng' => 90.1],
                            ['lat' => 23.1, 'lng' => 90.0],
                        ],
                        'is_active' => true,
                    ],
                    [
                        'id' => 'polygon_2',
                        'name' => 'Zone B',
                        'points' => [
                            ['lat' => 24.0, 'lng' => 91.0],
                            ['lat' => 24.0, 'lng' => 91.1],
                            ['lat' => 24.1, 'lng' => 91.1],
                            ['lat' => 24.1, 'lng' => 91.0],
                        ],
                        'is_active' => true,
                    ],
                ],
                'validation_mode' => 'all',
                'allow_without_location' => false,
            ],
        ]);

        // Test user in only first polygon (should fail with 'all' mode)
        $request = Request::create('/punch', 'POST', [
            'lat' => 23.05,
            'lng' => 90.05,
        ]);

        $validator = new PolygonLocationValidator($type, $request);
        $result = $validator->validate();

        // With 'all' mode, user must be in all zones - which is impossible for distant polygons
        // So this should fail
        $this->assertEquals('error', $result['status']);
    }
}
