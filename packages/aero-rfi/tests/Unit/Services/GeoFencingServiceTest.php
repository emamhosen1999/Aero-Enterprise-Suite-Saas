<?php

declare(strict_types=1);

namespace Aero\Rfi\Tests\Unit\Services;

use Aero\Rfi\Services\GeoFencingService;
use Aero\Rfi\Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * GPS GeoFencing Service Tests
 *
 * Tests the patentable GPS validation algorithm that prevents fraudulent
 * RFI submissions from remote locations using Haversine distance calculation.
 */
class GeoFencingServiceTest extends TestCase
{
    protected GeoFencingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GeoFencingService();
    }

    /** @test */
    public function it_validates_location_within_tolerance(): void
    {
        // Mock alignment data in database
        DB::table('project_alignment_points')->insert([
            'project_id' => 1,
            'chainage' => 1000.0,
            'latitude' => 25.2048,
            'longitude' => 55.2708,
            'elevation' => 10.0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // User location within 30m of chainage 1000 (well within 50m tolerance)
        $result = $this->service->validateLocation(
            userLat: 25.20485,  // ~5m from expected
            userLng: 55.27085,  // ~5m from expected
            claimedChainage: 1000.0,
            projectId: 1
        );

        $this->assertTrue($result['valid']);
        $this->assertLessThan(50, $result['distance']);
        $this->assertStringContainsString('verified', $result['message']);
        $this->assertArrayHasKey('expected_location', $result);
    }

    /** @test */
    public function it_rejects_location_outside_tolerance(): void
    {
        // Mock alignment data
        DB::table('project_alignment_points')->insert([
            'project_id' => 1,
            'chainage' => 1000.0,
            'latitude' => 25.2048,
            'longitude' => 55.2708,
            'elevation' => 10.0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // User location 100m away (beyond 50m tolerance)
        $result = $this->service->validateLocation(
            userLat: 25.2058,   // ~100m from expected
            userLng: 55.2718,   // ~100m from expected
            claimedChainage: 1000.0,
            projectId: 1
        );

        $this->assertFalse($result['valid']);
        $this->assertGreaterThan(50, $result['distance']);
        $this->assertStringContainsString('beyond allowed zone', $result['message']);
        $this->assertEquals('outside_geofence', $result['reason']);
    }

    /** @test */
    public function it_calculates_haversine_distance_accurately(): void
    {
        // Use reflection to test private haversineDistance method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('haversineDistance');
        $method->setAccessible(true);

        // Test 1: New York to Los Angeles (known distance ~3944 km)
        $distance = $method->invoke(
            $this->service,
            40.7128, // NYC lat
            -74.0060, // NYC lng
            34.0522, // LA lat
            -118.2437 // LA lng
        );

        // Allow 1% tolerance (±39km) due to Earth's ellipsoid shape
        $this->assertGreaterThan(3900000, $distance); // > 3900 km
        $this->assertLessThan(4000000, $distance); // < 4000 km

        // Test 2: Short distance (Dubai Marina - 2km apart)
        $shortDistance = $method->invoke(
            $this->service,
            25.0800, 
            55.1400,
            25.0980, 
            55.1400
        );

        // Should be ~2km (2000m)
        $this->assertGreaterThan(1900, $shortDistance);
        $this->assertLessThan(2100, $shortDistance);
    }

    /** @test */
    public function it_handles_missing_alignment_data_gracefully(): void
    {
        // Project with no alignment points in database
        $result = $this->service->validateLocation(
            userLat: 25.2048,
            userLng: 55.2708,
            claimedChainage: 1000.0,
            projectId: 999 // Non-existent project
        );

        $this->assertFalse($result['valid']);
        $this->assertNull($result['distance']);
        $this->assertNull($result['expected_location']);
        $this->assertEquals('missing_alignment_data', $result['reason']);
        $this->assertStringContainsString('Unable to determine GPS coordinates', $result['message']);
    }

    /** @test */
    public function it_supports_custom_tolerance_override(): void
    {
        // Mock alignment data
        DB::table('project_alignment_points')->insert([
            'project_id' => 1,
            'chainage' => 1000.0,
            'latitude' => 25.2048,
            'longitude' => 55.2708,
            'elevation' => 10.0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // User location 75m away
        $userLat = 25.2055;
        $userLng = 55.2715;

        // With default 50m tolerance - should fail
        $resultDefault = $this->service->validateLocation(
            userLat: $userLat,
            userLng: $userLng,
            claimedChainage: 1000.0,
            projectId: 1
        );
        $this->assertFalse($resultDefault['valid']);

        // With custom 100m tolerance - should pass
        $resultCustom = $this->service->validateLocation(
            userLat: $userLat,
            userLng: $userLng,
            claimedChainage: 1000.0,
            projectId: 1,
            toleranceMeters: 100
        );
        $this->assertTrue($resultCustom['valid']);
        $this->assertEquals(100, $resultCustom['tolerance']);
    }

    /** @test */
    public function it_logs_validation_attempts_for_audit(): void
    {
        // Mock alignment data
        DB::table('project_alignment_points')->insert([
            'project_id' => 1,
            'chainage' => 1000.0,
            'latitude' => 25.2048,
            'longitude' => 55.2708,
            'elevation' => 10.0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Expect log to be written
        Log::shouldReceive('channel')
            ->once()
            ->with('geofence')
            ->andReturnSelf();
        
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Geofence validation'
                    && isset($context['project_id'])
                    && isset($context['claimed_chainage'])
                    && isset($context['distance_meters'])
                    && isset($context['valid']);
            });

        $this->service->validateLocation(
            userLat: 25.2048,
            userLng: 55.2708,
            claimedChainage: 1000.0,
            projectId: 1
        );
    }

    /** @test */
    public function it_interpolates_chainage_to_gps_correctly(): void
    {
        // Set up two control points 1000m apart
        DB::table('project_alignment_points')->insert([
            [
                'project_id' => 1,
                'chainage' => 0.0,
                'latitude' => 25.2000,
                'longitude' => 55.2000,
                'elevation' => 0.0,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'project_id' => 1,
                'chainage' => 1000.0,
                'latitude' => 25.2100,
                'longitude' => 55.2100,
                'elevation' => 10.0,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Request validation at Ch 500 (midpoint)
        $result = $this->service->validateLocation(
            userLat: 25.2050, // Exact midpoint
            userLng: 55.2050, // Exact midpoint
            claimedChainage: 500.0,
            projectId: 1
        );

        $this->assertTrue($result['valid']);
        $this->assertLessThan(10, $result['distance']); // Should be < 10m (near perfect)
        
        // Verify interpolated coordinates
        $expected = $result['expected_location'];
        $this->assertEquals(25.2050, $expected['lat'], '', 0.0001); // 0.0001 degree tolerance
        $this->assertEquals(55.2050, $expected['lng'], '', 0.0001);
        $this->assertEquals(5.0, $expected['elevation'], '', 0.1); // Elevation also interpolated
    }

    /** @test */
    public function it_handles_curved_alignment_segments(): void
    {
        // Set up multiple control points to form a curve
        DB::table('project_alignment_points')->insert([
            [
                'project_id' => 1,
                'chainage' => 0.0,
                'latitude' => 25.2000,
                'longitude' => 55.2000,
                'elevation' => 0.0,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'project_id' => 1,
                'chainage' => 250.0,
                'latitude' => 25.2025,
                'longitude' => 55.2025,
                'elevation' => 2.5,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'project_id' => 1,
                'chainage' => 500.0,
                'latitude' => 25.2050,
                'longitude' => 55.2040, // Curved path
                'elevation' => 5.0,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'project_id' => 1,
                'chainage' => 1000.0,
                'latitude' => 25.2100,
                'longitude' => 55.2050,
                'elevation' => 10.0,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Validate at Ch 750 (between Ch 500 and Ch 1000)
        // The service should use linear interpolation between the two nearest points
        $result = $this->service->validateLocation(
            userLat: 25.2075,  // Interpolated position
            userLng: 55.2045,  // Following the curve
            claimedChainage: 750.0,
            projectId: 1
        );

        $this->assertTrue($result['valid']);
        
        // Expected location should be interpolated between Ch 500 and Ch 1000
        $expected = $result['expected_location'];
        $this->assertGreaterThan(25.2050, $expected['lat']); // Between point at 500
        $this->assertLessThan(25.2100, $expected['lat']); // And point at 1000
    }
}
