<?php

declare(strict_types=1);

namespace Aero\Rfi\Tests\Unit\Services;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Services\LinearContinuityValidator;
use Aero\Rfi\Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Linear Continuity Validator Tests
 *
 * Tests the PATENTABLE core algorithm that enforces construction layer sequence
 * to prevent structural integrity violations. This is the highest-value IP in the system.
 *
 * Example: Cannot approve "Asphalt" at Ch 100-200 if "Sub-base" has gaps at Ch 120-140.
 */
class LinearContinuityValidatorTest extends TestCase
{
    protected LinearContinuityValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new LinearContinuityValidator();
    }

    /** @test */
    public function it_allows_approval_when_all_prerequisites_complete(): void
    {
        // Set up: Create work location and approved RFI for base layer (sub_base)
        $workLocationId = DB::table('work_locations')->insertGetId([
            'name' => 'Zone A',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 200.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create approved RFI for sub_base layer (prerequisite for base_course)
        DB::table('daily_works')->insert([
            'number' => 'RFI-001',
            'date' => now(),
            'type' => 'Pavement',
            'work_location_id' => $workLocationId,
            'layer' => 'sub_base',
            'description' => 'Sub-base work complete',
            'status' => 'completed',
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Test: Validate that base_course can be approved over sub_base
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 200.0,
            projectId: 1
        );

        $this->assertTrue($result['can_approve']);
        $this->assertEmpty($result['violations']);
        $this->assertEquals(100, $result['coverage']);
        $this->assertEmpty($result['gaps']);
        $this->assertStringContainsString('All underlying layers complete', $result['message']);
    }

    /** @test */
    public function it_blocks_approval_when_prerequisites_incomplete(): void
    {
        // Set up: Create work location with partial sub_base coverage
        $location1Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone A Part 1',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 100.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Only 0-100 is complete, but we want to approve 0-200
        DB::table('daily_works')->insert([
            'number' => 'RFI-001',
            'date' => now(),
            'type' => 'Pavement',
            'work_location_id' => $location1Id,
            'layer' => 'sub_base',
            'description' => 'Sub-base partial',
            'status' => 'completed',
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Test: Try to approve base_course for full 0-200 range
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 200.0,
            projectId: 1
        );

        $this->assertFalse($result['can_approve']);
        $this->assertNotEmpty($result['violations']);
        $this->assertLessThan(95, $result['coverage']); // Less than required 95%
        $this->assertNotEmpty($result['gaps']);
        $this->assertStringContainsString('Underlying layers incomplete', $result['message']);
        
        // Check violation details
        $violation = $result['violations'][0];
        $this->assertEquals('sub_base', $violation['layer']);
        $this->assertLessThan(95, $violation['coverage']);
    }

    /** @test */
    public function it_calculates_coverage_percentage_correctly(): void
    {
        // Set up: Create two work locations for 60% coverage (300m out of 500m)
        $location1Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone 1',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 100.0,  // 100m
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $location2Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone 2',
            'project_id' => 1,
            'start_chainage_m' => 300.0,
            'end_chainage_m' => 500.0,  // 200m
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create approved RFIs for both zones
        DB::table('daily_works')->insert([
            [
                'number' => 'RFI-001',
                'date' => now(),
                'type' => 'Pavement',
                'work_location_id' => $location1Id,
                'layer' => 'sub_base',
                'description' => 'Zone 1',
                'status' => 'completed',
                'inspection_result' => Rfi::INSPECTION_APPROVED,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'number' => 'RFI-002',
                'date' => now(),
                'type' => 'Pavement',
                'work_location_id' => $location2Id,
                'layer' => 'sub_base',
                'description' => 'Zone 2',
                'status' => 'completed',
                'inspection_result' => Rfi::INSPECTION_APPROVED,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Test: Validate across full 0-500 range
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 500.0,
            projectId: 1
        );

        // Total: 500m, Covered: 300m (0-100 + 300-500) = 60%
        $this->assertEquals(60, $result['coverage']);
        $this->assertFalse($result['can_approve']); // Less than 95% required
    }

    /** @test */
    public function it_identifies_gap_locations_accurately(): void
    {
        // Set up: Same as coverage test - gaps at 100-300
        $location1Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone 1',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 100.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $location2Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone 2',
            'project_id' => 1,
            'start_chainage_m' => 300.0,
            'end_chainage_m' => 500.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('daily_works')->insert([
            [
                'number' => 'RFI-001',
                'date' => now(),
                'type' => 'Pavement',
                'work_location_id' => $location1Id,
                'layer' => 'sub_base',
                'description' => 'Zone 1',
                'status' => 'completed',
                'inspection_result' => Rfi::INSPECTION_APPROVED,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'number' => 'RFI-002',
                'date' => now(),
                'type' => 'Pavement',
                'work_location_id' => $location2Id,
                'layer' => 'sub_base',
                'description' => 'Zone 2',
                'status' => 'completed',
                'inspection_result' => Rfi::INSPECTION_APPROVED,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Test gap identification
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 500.0,
            projectId: 1
        );

        $this->assertNotEmpty($result['gaps']);
        
        // Should identify gap at Ch 100-300 (200m gap)
        $gap = $result['gaps'][0];
        $this->assertEquals(100, $gap['start']);
        $this->assertEquals(300, $gap['end']);
        $this->assertEquals(200, $gap['length']);
    }

    /** @test */
    public function it_enforces_95_percent_coverage_threshold(): void
    {
        // Test boundary condition: 94.9% vs 95.0%
        $projectId = 1;

        // Scenario 1: 94.9% coverage (949m out of 1000m) - should FAIL
        $location1Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone 94.9%',
            'project_id' => $projectId,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 949.0,  // 949m covered
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('daily_works')->insert([
            'number' => 'RFI-001',
            'date' => now(),
            'type' => 'Pavement',
            'work_location_id' => $location1Id,
            'layer' => 'sub_base',
            'description' => '949m coverage',
            'status' => 'completed',
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $result949 = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 1000.0,
            projectId: $projectId
        );

        $this->assertFalse($result949['can_approve']);
        $this->assertLessThan(95, $result949['coverage']);

        // Scenario 2: 95.0% coverage (950m out of 1000m) - should PASS
        // Clear previous data
        DB::table('daily_works')->truncate();
        DB::table('work_locations')->truncate();

        $location2Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone 95%',
            'project_id' => $projectId,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 950.0,  // 950m covered
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('daily_works')->insert([
            'number' => 'RFI-002',
            'date' => now(),
            'type' => 'Pavement',
            'work_location_id' => $location2Id,
            'layer' => 'sub_base',
            'description' => '950m coverage',
            'status' => 'completed',
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $result950 = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 1000.0,
            projectId: $projectId
        );

        $this->assertTrue($result950['can_approve']);
        $this->assertGreaterThanOrEqual(95, $result950['coverage']);
    }

    /** @test */
    public function it_handles_parallel_layers_correctly(): void
    {
        // Test that earthwork_excavation (layer with no dependencies) can be approved independently
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'earthwork_excavation', // First layer, no dependencies
            startChainage: 0.0,
            endChainage: 1000.0,
            projectId: 1
        );

        $this->assertTrue($result['can_approve']);
        $this->assertEmpty($result['violations']);
        $this->assertEquals(100, $result['coverage']);
        $this->assertStringContainsString('No underlying layers required', $result['message']);
        $this->assertEmpty($result['required_layers']);
    }

    /** @test */
    public function it_respects_layer_hierarchy_order(): void
    {
        // Set up: Only have earthwork_excavation approved, try to skip to base_course
        $workLocationId = DB::table('work_locations')->insertGetId([
            'name' => 'Zone A',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 200.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Only earthwork_excavation is complete
        DB::table('daily_works')->insert([
            'number' => 'RFI-001',
            'date' => now(),
            'type' => 'Embankment',
            'work_location_id' => $workLocationId,
            'layer' => 'earthwork_excavation',
            'description' => 'Excavation complete',
            'status' => 'completed',
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Try to approve base_course (skipping earthwork_compaction and sub_base)
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course', // Requires: sub_base, earthwork_compaction
            startChainage: 0.0,
            endChainage: 200.0,
            projectId: 1
        );

        $this->assertFalse($result['can_approve']);
        $this->assertNotEmpty($result['violations']);
        
        // Should have violations for both missing prerequisites
        $this->assertCount(2, $result['violations']);
        
        $violatedLayers = array_column($result['violations'], 'layer');
        $this->assertContains('sub_base', $violatedLayers);
        $this->assertContains('earthwork_compaction', $violatedLayers);
    }

    /** @test */
    public function it_validates_across_work_location_boundaries(): void
    {
        // Set up: Two adjacent work locations creating seamless coverage
        $location1Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone A',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 1000.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $location2Id = DB::table('work_locations')->insertGetId([
            'name' => 'Zone B',
            'project_id' => 1,
            'start_chainage_m' => 1000.0,  // Starts exactly where Zone A ends
            'end_chainage_m' => 2000.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Both zones have approved sub_base
        DB::table('daily_works')->insert([
            [
                'number' => 'RFI-001',
                'date' => now(),
                'type' => 'Pavement',
                'work_location_id' => $location1Id,
                'layer' => 'sub_base',
                'description' => 'Zone A',
                'status' => 'completed',
                'inspection_result' => Rfi::INSPECTION_APPROVED,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'number' => 'RFI-002',
                'date' => now(),
                'type' => 'Pavement',
                'work_location_id' => $location2Id,
                'layer' => 'sub_base',
                'description' => 'Zone B',
                'status' => 'completed',
                'inspection_result' => Rfi::INSPECTION_APPROVED,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Validate across both zones
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 2000.0,
            projectId: 1
        );

        $this->assertTrue($result['can_approve']);
        $this->assertEquals(100, $result['coverage']);
        $this->assertEmpty($result['gaps']);  // No gaps at boundary
    }

    /** @test */
    public function it_provides_actionable_violation_messages(): void
    {
        // Set up: Partial coverage with gap
        $locationId = DB::table('work_locations')->insertGetId([
            'name' => 'Zone Partial',
            'project_id' => 1,
            'start_chainage_m' => 0.0,
            'end_chainage_m' => 100.0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('daily_works')->insert([
            'number' => 'RFI-001',
            'date' => now(),
            'type' => 'Pavement',
            'work_location_id' => $locationId,
            'layer' => 'sub_base',
            'description' => 'Partial work',
            'status' => 'completed',
            'inspection_result' => Rfi::INSPECTION_APPROVED,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Try to approve larger range
        $result = $this->validator->validateLayerContinuity(
            proposedLayer: 'base_course',
            startChainage: 0.0,
            endChainage: 200.0,
            projectId: 1
        );

        $this->assertFalse($result['can_approve']);
        
        // Check violation message format
        $violation = $result['violations'][0];
        $this->assertArrayHasKey('message', $violation);
        $this->assertArrayHasKey('layer', $violation);
        $this->assertArrayHasKey('coverage', $violation);
        $this->assertArrayHasKey('gaps', $violation);
        
        // Message should contain layer name and percentage
        $message = $violation['message'];
        $this->assertStringContainsString('sub_base', $message);
        $this->assertStringContainsString('%', $message);
        $this->assertStringContainsString('requires', $message);
        
        // Gaps should have start, end, and length
        $gap = $violation['gaps'][0];
        $this->assertArrayHasKey('start', $gap);
        $this->assertArrayHasKey('end', $gap);
        $this->assertArrayHasKey('length', $gap);
    }
}
