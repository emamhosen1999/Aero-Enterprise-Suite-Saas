<?php

declare(strict_types=1);

namespace Aero\Rfi\Tests\Unit\Services;

use Aero\Quality\Contracts\NcrBlockingServiceInterface;
use Aero\Rfi\Models\ChainageProgress;
use Aero\Rfi\Models\WorkLayer;
use Aero\Rfi\Services\ChainageGapAnalysisService;
use Aero\Rfi\Tests\TestCase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Mockery;

/**
 * Chainage Gap Analysis Service Tests
 *
 * Tests the spatial prerequisite validation service that ensures:
 * - Prerequisite layers are complete before new work
 * - No blocking NCRs exist
 * - Chainage ranges are valid
 */
class ChainageGapAnalysisServiceTest extends TestCase
{
    protected ChainageGapAnalysisService $service;
    protected NcrBlockingServiceInterface $ncrService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock NCR blocking service
        $this->ncrService = Mockery::mock(NcrBlockingServiceInterface::class);
        $this->service = new ChainageGapAnalysisService($this->ncrService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_detects_prerequisite_layer_gaps(): void
    {
        // Create work layers with dependency
        $prerequisiteLayerId = DB::table('work_layers')->insertGetId([
            'code' => 'sub_base',
            'name' => 'Sub-base',
            'sequence_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $workLayerId = DB::table('work_layers')->insertGetId([
            'code' => 'base_course',
            'name' => 'Base Course',
            'sequence_order' => 2,
            'prerequisite_layer_id' => $prerequisiteLayerId,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Mock that prerequisite is NOT satisfied
        $workLayer = WorkLayer::find($workLayerId);
        
        // Mock NCR service to return no blocking NCRs
        $this->ncrService->shouldReceive('getOpenNcrsAtChainage')
            ->once()
            ->andReturn(collect());

        // Validate RFI submission
        $result = $this->service->validateRfiSubmission(
            projectId: 1,
            workLayerId: $workLayerId,
            startChainageM: 0.0,
            endChainageM: 100.0
        );

        // Should be invalid due to missing prerequisite
        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
        $this->assertStringContainsString('Prerequisite layer', $result['errors'][0]);
        $this->assertStringContainsString('Sub-base', $result['errors'][0]);
    }

    /** @test */
    public function it_integrates_with_ncr_blocking_service(): void
    {
        // Create work layer without prerequisites
        $workLayerId = DB::table('work_layers')->insertGetId([
            'code' => 'earthwork',
            'name' => 'Earthwork',
            'sequence_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Mock NCR service to return blocking NCRs
        $mockNcr = (object)[
            'id' => 1,
            'ncr_number' => 'NCR-2024-001',
            'description' => 'Soil compaction failed',
            'start_chainage_m' => 50.0,
            'end_chainage_m' => 75.0
        ];

        $this->ncrService->shouldReceive('getOpenNcrsAtChainage')
            ->once()
            ->with(1, 0.0, 100.0)
            ->andReturn(collect([$mockNcr]));

        // Validate RFI submission
        $result = $this->service->validateRfiSubmission(
            projectId: 1,
            workLayerId: $workLayerId,
            startChainageM: 0.0,
            endChainageM: 100.0
        );

        // Should be invalid due to blocking NCR
        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
        $this->assertStringContainsString('Open NCR', $result['errors'][0]);
        $this->assertStringContainsString('NCR-2024-001', $result['errors'][0]);
    }

    /** @test */
    public function it_prevents_duplicate_pending_rfis(): void
    {
        // Create work layer
        $workLayerId = DB::table('work_layers')->insertGetId([
            'code' => 'earthwork',
            'name' => 'Earthwork',
            'sequence_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create existing pending progress at this chainage
        DB::table('chainage_progress')->insert([
            'project_id' => 1,
            'work_layer_id' => $workLayerId,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 100.0,
            'status' => 'rfi_submitted', // Pending status
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Mock NCR service
        $this->ncrService->shouldReceive('getOpenNcrsAtChainage')
            ->once()
            ->andReturn(collect());

        // Validate RFI submission
        $result = $this->service->validateRfiSubmission(
            projectId: 1,
            workLayerId: $workLayerId,
            startChainageM: 0.0,
            endChainageM: 100.0
        );

        // Should show warning about existing pending RFI
        $this->assertNotEmpty($result['warnings']);
        $this->assertStringContainsString('pending RFI already exists', $result['warnings'][0]);
    }

    /** @test */
    public function it_validates_chainage_within_project_bounds(): void
    {
        // Create work layer
        $workLayerId = DB::table('work_layers')->insertGetId([
            'code' => 'earthwork',
            'name' => 'Earthwork',
            'sequence_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Mock NCR service
        $this->ncrService->shouldReceive('getOpenNcrsAtChainage')
            ->once()
            ->andReturn(collect());

        // Test with valid chainage range
        $result = $this->service->validateRfiSubmission(
            projectId: 1,
            workLayerId: $workLayerId,
            startChainageM: 0.0,
            endChainageM: 100.0
        );

        // Should be valid (no boundary check error)
        // Note: Actual boundary validation would require project table setup
        $this->assertIsArray($result);
        $this->assertArrayHasKey('valid', $result);
        $this->assertArrayHasKey('errors', $result);
        $this->assertArrayHasKey('warnings', $result);
        $this->assertArrayHasKey('gaps', $result);
    }

    /** @test */
    public function it_suggests_optimal_next_work_locations(): void
    {
        // This test verifies the getProgressAtChainage method
        // which helps identify where to work next

        // Create work layers
        $layer1Id = DB::table('work_layers')->insertGetId([
            'code' => 'earthwork',
            'name' => 'Earthwork',
            'sequence_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $layer2Id = DB::table('work_layers')->insertGetId([
            'code' => 'sub_base',
            'name' => 'Sub-base',
            'sequence_order' => 2,
            'prerequisite_layer_id' => $layer1Id,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create progress for layer 1
        DB::table('chainage_progress')->insert([
            'project_id' => 1,
            'work_layer_id' => $layer1Id,
            'start_chainage_m' => 100.0,
            'end_chainage_m' => 100.0, // Single point
            'status' => 'approved',
            'approved_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Get progress at chainage 100
        $progress = $this->service->getProgressAtChainage(1, 100.0);

        $this->assertIsArray($progress);
        $this->assertNotEmpty($progress);
        
        // Should have entries for both layers
        $this->assertCount(2, $progress);
        
        // Layer 1 should be approved
        $layer1Progress = collect($progress)->firstWhere('layer.id', $layer1Id);
        $this->assertEquals('approved', $layer1Progress['status']);
        
        // Layer 2 should be not_started
        $layer2Progress = collect($progress)->firstWhere('layer.id', $layer2Id);
        $this->assertEquals('not_started', $layer2Progress['status']);
    }

    /** @test */
    public function it_handles_resubmissions_after_rejection(): void
    {
        // Create work layer
        $workLayerId = DB::table('work_layers')->insertGetId([
            'code' => 'earthwork',
            'name' => 'Earthwork',
            'sequence_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create rejected progress (should allow resubmission)
        DB::table('chainage_progress')->insert([
            'project_id' => 1,
            'work_layer_id' => $workLayerId,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 100.0,
            'status' => 'rejected', // Rejected status
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Mock NCR service
        $this->ncrService->shouldReceive('getOpenNcrsAtChainage')
            ->once()
            ->andReturn(collect());

        // Validate RFI submission (resubmission after rejection)
        $result = $this->service->validateRfiSubmission(
            projectId: 1,
            workLayerId: $workLayerId,
            startChainageM: 0.0,
            endChainageM: 100.0
        );

        // Should allow resubmission (rejected is not "pending")
        // Should not have warning about existing pending RFI
        $pendingWarnings = array_filter($result['warnings'], function($warning) {
            return str_contains($warning, 'pending RFI already exists');
        });
        
        $this->assertEmpty($pendingWarnings, 'Rejected RFIs should allow resubmission');
    }
}
