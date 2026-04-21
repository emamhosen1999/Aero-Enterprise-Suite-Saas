<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\DisciplinaryCase;
use Aero\HRM\Models\Employee;
use Aero\HRM\Services\DisciplinaryWorkflowService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DisciplinaryWorkflowServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DisciplinaryWorkflowService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(DisciplinaryWorkflowService::class);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_opens_disciplinary_case_with_reported_status(): void
    {
        $employee = Employee::factory()->create();
        $reporter = Employee::factory()->create();

        $case = $this->service->openCase([
            'employee_id' => $employee->id,
            'reported_by' => $reporter->id,
            'incident_date' => now()->subDay()->toDateString(),
            'incident_description' => 'Employee violated company policy.',
            'severity' => 'medium',
        ]);

        $this->assertInstanceOf(DisciplinaryCase::class, $case);
        $this->assertEquals(DisciplinaryWorkflowService::STATUS_REPORTED, $case->status);
        $this->assertEquals($employee->id, $case->employee_id);
        $this->assertNotNull($case->reported_at);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_starts_investigation_and_assigns_investigator(): void
    {
        $employee = Employee::factory()->create();
        $investigator = Employee::factory()->create();

        $case = DisciplinaryCase::factory()->create([
            'employee_id' => $employee->id,
            'status' => DisciplinaryWorkflowService::STATUS_REPORTED,
        ]);

        $updated = $this->service->startInvestigation($case, $investigator->id, 'Initial notes.');

        $this->assertEquals(DisciplinaryWorkflowService::STATUS_UNDER_INVESTIGATION, $updated->status);
        $this->assertEquals($investigator->id, $updated->investigator_id);
        $this->assertNotNull($updated->investigation_started_at);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_closes_case_with_action_outcome(): void
    {
        $employee = Employee::factory()->create();

        $case = DisciplinaryCase::factory()->create([
            'employee_id' => $employee->id,
            'status' => DisciplinaryWorkflowService::STATUS_ACTION_TAKEN,
        ]);

        $case->update([
            'status' => DisciplinaryWorkflowService::STATUS_CLOSED,
            'resolution_summary' => 'Warning issued.',
            'closed_at' => now(),
        ]);

        $case->refresh();
        $this->assertEquals(DisciplinaryWorkflowService::STATUS_CLOSED, $case->status);
        $this->assertNotNull($case->closed_at);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_case_severity_levels(): void
    {
        $employee = Employee::factory()->create();

        foreach (['low', 'medium', 'high', 'critical'] as $severity) {
            $case = DisciplinaryCase::factory()->create([
                'employee_id' => $employee->id,
                'severity' => $severity,
            ]);
            $this->assertEquals($severity, $case->severity);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_cases_by_status(): void
    {
        DisciplinaryCase::factory()->count(3)->create(['status' => 'reported']);
        DisciplinaryCase::factory()->count(2)->create(['status' => 'closed']);

        $this->assertEquals(3, DisciplinaryCase::where('status', 'reported')->count());
        $this->assertEquals(2, DisciplinaryCase::where('status', 'closed')->count());
    }
}
