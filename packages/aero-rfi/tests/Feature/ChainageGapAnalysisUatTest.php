<?php

declare(strict_types=1);

namespace Aero\Rfi\Tests\Feature;

use Aero\Quality\Contracts\NcrBlockingServiceInterface;
use Aero\Rfi\Models\ChainageProgress;
use Aero\Rfi\Models\WorkLayer;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\ChainageGapAnalysisService;
use Aero\Rfi\Tests\TestCase;
use Illuminate\Support\Collection;

class ChainageGapAnalysisUatTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the in-memory DB has the tables we need.
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
    }

    public function test_rfi_is_valid_when_prerequisite_and_no_ncr(): void
    {
        $prereq = WorkLayer::create([
            'code' => 'L1',
            'name' => 'Layer 1',
            'work_type' => 'test',
            'sequence_order' => 1,
            'is_active' => true,
        ]);

        $dependent = WorkLayer::create([
            'code' => 'L2',
            'name' => 'Layer 2',
            'work_type' => 'test',
            'sequence_order' => 2,
            'prerequisite_layer_id' => $prereq->id,
            'is_active' => true,
        ]);

        ChainageProgress::create([
            'project_id' => 1,
            'work_layer_id' => $prereq->id,
            'start_chainage_m' => 0,
            'end_chainage_m' => 200,
            'status' => 'approved',
        ]);

        $fakeNcrService = new class implements NcrBlockingServiceInterface {
            public function getOpenNcrsAtChainage(int $projectId, float $startM, float $endM): Collection
            {
                return collect();
            }

            public function getBlockingNcrs(int $projectId, int $layerId, float $startM, float $endM): Collection
            {
                return collect();
            }
        };

        $service = new ChainageGapAnalysisService($fakeNcrService);

        $result = $service->validateRfiSubmission(1, $dependent->id, 0, 100);

        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
    }

    public function test_rfi_is_blocked_when_open_ncr_exists(): void
    {
        $layer = WorkLayer::create([
            'code' => 'L1',
            'name' => 'Layer 1',
            'work_type' => 'test',
            'sequence_order' => 1,
            'is_active' => true,
        ]);

        $fakeNcrService = new class implements NcrBlockingServiceInterface {
            public function getOpenNcrsAtChainage(int $projectId, float $startM, float $endM): Collection
            {
                return collect([(object) ['ncr_number' => 'NCR-1']]);
            }

            public function getBlockingNcrs(int $projectId, int $layerId, float $startM, float $endM): Collection
            {
                return collect();
            }
        };

        $service = new ChainageGapAnalysisService($fakeNcrService);

        $result = $service->validateRfiSubmission(1, $layer->id, 0, 50);

        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
        $this->assertStringContainsString('Open NCR #NCR-1', $result['errors'][0]);
    }

    public function test_get_blocking_ncrs_delegates_to_quality_service(): void
    {
        $workLocation = WorkLocation::create([
            'name' => 'Zone A',
            'start_chainage' => '0',
            'end_chainage' => '100',
            'is_active' => true,
        ]);
        $workLocation->forceFill([
            'project_id' => 77,
            'start_chainage_m' => 0,
            'end_chainage_m' => 100,
        ])->save();

        $fakeNcrService = new class implements NcrBlockingServiceInterface {
            public function getOpenNcrsAtChainage(int $projectId, float $startM, float $endM): Collection
            {
                return collect();
            }

            public function getBlockingNcrs(int $projectId, int $layerId, float $startM, float $endM): Collection
            {
                return collect([
                    (object) [
                        'id' => 5,
                        'ncr_number' => 'NCR-5',
                        'title' => 'Blocking NCR',
                        'severity' => 'high',
                        'start_chainage_m' => $startM,
                        'end_chainage_m' => $endM,
                        'status' => 'open',
                    ],
                ]);
            }
        };

        $service = new ChainageGapAnalysisService($fakeNcrService);

        $result = $service->getBlockingNcrs($workLocation->id, 12, 0, 100);

        $this->assertCount(1, $result);
        $this->assertSame('NCR-5', $result[0]['reference_number']);
        $this->assertSame('open', $result[0]['status']);
    }
}
