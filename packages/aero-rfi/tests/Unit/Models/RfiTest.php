<?php

namespace Aero\Rfi\Tests\Unit\Models;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Models\WorkLayer;
use Aero\Rfi\Models\ChainageProgress;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * RfiTest - Test RFI model behavior
 * 
 * Tests model relationships, scopes, and business logic:
 * - Model relationships (workLocation, workLayer, progress)
 * - Status scopes (pending, approved, rejected)
 * - Chainage validation
 */
class RfiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_belongs_to_work_location()
    {
        $rfi = Rfi::factory()->create();

        $this->assertInstanceOf(WorkLocation::class, $rfi->workLocation);
    }

    /** @test */
    public function it_belongs_to_work_layer()
    {
        $rfi = Rfi::factory()->create();

        $this->assertInstanceOf(WorkLayer::class, $rfi->workLayer);
    }

    /** @test */
    public function it_has_many_chainage_progress_records()
    {
        $rfi = Rfi::factory()->create();
        ChainageProgress::factory()->count(3)->create(['rfi_id' => $rfi->id]);

        $this->assertCount(3, $rfi->chainageProgress);
    }

    /** @test */
    public function it_scopes_pending_rfis()
    {
        Rfi::factory()->count(3)->create(['status' => 'pending']);
        Rfi::factory()->count(2)->create(['status' => 'approved']);

        $pending = Rfi::pending()->get();

        $this->assertCount(3, $pending);
    }

    /** @test */
    public function it_scopes_approved_rfis()
    {
        Rfi::factory()->count(2)->create(['status' => 'approved']);
        Rfi::factory()->count(3)->create(['status' => 'pending']);

        $approved = Rfi::approved()->get();

        $this->assertCount(2, $approved);
    }

    /** @test */
    public function it_validates_chainage_start_less_than_end()
    {
        $rfi = Rfi::factory()->make([
            'chainage_start' => 1200.0,
            'chainage_end' => 1000.0,
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $rfi->save();
    }

    /** @test */
    public function it_formats_chainage_display()
    {
        $rfi = Rfi::factory()->create([
            'chainage_start' => 1000.5,
            'chainage_end' => 1250.75,
        ]);

        $this->assertEquals('1000.5 - 1250.75', $rfi->chainage_display);
    }
}
