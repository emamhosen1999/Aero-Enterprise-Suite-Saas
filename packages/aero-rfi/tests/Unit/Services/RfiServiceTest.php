<?php

namespace Aero\Rfi\Tests\Unit\Services;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Services\RfiService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

/**
 * RfiServiceTest - Test CRUD operations for RFI service
 * 
 * Tests basic RFI management functionality:
 * - Creating RFIs with auto-generated numbers
 * - Updating RFI status and details
 * - Filtering RFIs by various criteria
 * - Fetching RFI details with relationships
 */
class RfiServiceTest extends TestCase
{
    use RefreshDatabase;

    protected RfiService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(RfiService::class);
    }

    /** @test */
    public function it_creates_rfi_with_auto_generated_number()
    {
        $data = [
            'work_location_id' => 1,
            'work_layer_id' => 1,
            'chainage_start' => 1000.0,
            'chainage_end' => 1100.0,
            'description' => 'Test RFI',
            'inspection_date' => now()->toDateString(),
        ];

        $rfi = $this->service->create($data);

        $this->assertInstanceOf(Rfi::class, $rfi);
        $this->assertNotNull($rfi->rfi_number);
        $this->assertStringStartsWith('RFI-', $rfi->rfi_number);
        $this->assertEquals('pending', $rfi->status);
        $this->assertEquals($data['description'], $rfi->description);
    }

    /** @test */
    public function it_updates_rfi_status()
    {
        $rfi = Rfi::factory()->create(['status' => 'pending']);

        $updated = $this->service->updateStatus($rfi->id, 'approved', 'Quality check passed');

        $this->assertEquals('approved', $updated->status);
        $this->assertEquals('Quality check passed', $updated->approval_remarks);
    }

    /** @test */
    public function it_filters_rfis_by_status()
    {
        Rfi::factory()->count(3)->create(['status' => 'pending']);
        Rfi::factory()->count(2)->create(['status' => 'approved']);
        Rfi::factory()->count(1)->create(['status' => 'rejected']);

        $pending = $this->service->getByStatus('pending');
        $approved = $this->service->getByStatus('approved');

        $this->assertCount(3, $pending);
        $this->assertCount(2, $approved);
    }

    /** @test */
    public function it_filters_rfis_by_chainage_range()
    {
        Rfi::factory()->create(['chainage_start' => 1000, 'chainage_end' => 1200]);
        Rfi::factory()->create(['chainage_start' => 1100, 'chainage_end' => 1300]);
        Rfi::factory()->create(['chainage_start' => 2000, 'chainage_end' => 2200]);

        $rfis = $this->service->getByChainageRange(1050, 1250);

        $this->assertCount(2, $rfis);
    }

    /** @test */
    public function it_fetches_rfi_with_relationships()
    {
        $rfi = Rfi::factory()->create();

        $loaded = $this->service->findWithRelations($rfi->id);

        $this->assertInstanceOf(Rfi::class, $loaded);
        $this->assertTrue($loaded->relationLoaded('workLocation'));
        $this->assertTrue($loaded->relationLoaded('workLayer'));
    }

    /** @test */
    public function it_calculates_rfi_statistics()
    {
        Rfi::factory()->count(5)->create(['status' => 'pending']);
        Rfi::factory()->count(3)->create(['status' => 'approved']);
        Rfi::factory()->count(2)->create(['status' => 'rejected']);

        $stats = $this->service->getStatistics();

        $this->assertEquals(10, $stats['total']);
        $this->assertEquals(5, $stats['pending']);
        $this->assertEquals(3, $stats['approved']);
        $this->assertEquals(2, $stats['rejected']);
    }

    /** @test */
    public function it_validates_gps_coordinates_if_provided()
    {
        $data = [
            'work_location_id' => 1,
            'work_layer_id' => 1,
            'chainage_start' => 1000.0,
            'chainage_end' => 1100.0,
            'gps_latitude' => 25.2048,
            'gps_longitude' => 55.2708,
            'description' => 'Test RFI with GPS',
            'inspection_date' => now()->toDateString(),
        ];

        $rfi = $this->service->create($data);

        $this->assertEquals(25.2048, $rfi->gps_latitude);
        $this->assertEquals(55.2708, $rfi->gps_longitude);
    }

    /** @test */
    public function it_deletes_rfi_with_dependencies()
    {
        $rfi = Rfi::factory()->create();
        $rfiId = $rfi->id;

        $deleted = $this->service->delete($rfiId);

        $this->assertTrue($deleted);
        $this->assertDatabaseMissing('rfis', ['id' => $rfiId]);
    }
}
