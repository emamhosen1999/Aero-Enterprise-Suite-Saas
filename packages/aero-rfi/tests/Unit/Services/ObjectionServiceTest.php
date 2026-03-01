<?php

namespace Aero\Rfi\Tests\Unit\Services;

use Aero\Rfi\Models\Objection;
use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Services\ObjectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ObjectionServiceTest - Test objection/dispute handling service
 *
 * Tests objection management functionality:
 * - Creating objections against RFIs
 * - Resolving objections
 * - Escalating to NCR (Non-Conformance Report)
 * - Tracking objection status
 */
class ObjectionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ObjectionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ObjectionService::class);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_objection_against_rfi()
    {
        $rfi = Rfi::factory()->create(['status' => 'approved']);

        $objection = $this->service->create([
            'rfi_id' => $rfi->id,
            'raised_by' => 1,
            'reason' => 'Quality standards not met',
            'description' => 'Surface finishing is poor',
            'severity' => 'high',
        ]);

        $this->assertInstanceOf(Objection::class, $objection);
        $this->assertEquals($rfi->id, $objection->rfi_id);
        $this->assertEquals('open', $objection->status);
        $this->assertEquals('high', $objection->severity);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_resolves_objection_with_remarks()
    {
        $objection = Objection::factory()->create(['status' => 'open']);

        $resolved = $this->service->resolve($objection->id, [
            'resolution_remarks' => 'Work redone to satisfaction',
            'resolved_by' => 2,
        ]);

        $this->assertEquals('resolved', $resolved->status);
        $this->assertNotNull($resolved->resolution_date);
        $this->assertEquals('Work redone to satisfaction', $resolved->resolution_remarks);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_escalates_objection_to_ncr()
    {
        $objection = Objection::factory()->create([
            'status' => 'open',
            'severity' => 'critical',
        ]);

        $escalated = $this->service->escalateToNcr($objection->id, [
            'ncr_number' => 'NCR-2024-001',
            'escalation_reason' => 'Critical safety issue',
        ]);

        $this->assertEquals('escalated', $escalated->status);
        $this->assertEquals('NCR-2024-001', $escalated->ncr_number);
        $this->assertNotNull($escalated->escalation_date);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fetches_objections_by_rfi()
    {
        $rfi = Rfi::factory()->create();
        Objection::factory()->count(3)->create(['rfi_id' => $rfi->id]);
        Objection::factory()->count(2)->create(); // Other RFI objections

        $objections = $this->service->getByRfi($rfi->id);

        $this->assertCount(3, $objections);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_objections_by_status()
    {
        Objection::factory()->count(4)->create(['status' => 'open']);
        Objection::factory()->count(2)->create(['status' => 'resolved']);
        Objection::factory()->count(1)->create(['status' => 'escalated']);

        $open = $this->service->getByStatus('open');
        $resolved = $this->service->getByStatus('resolved');

        $this->assertCount(4, $open);
        $this->assertCount(2, $resolved);
    }
}
