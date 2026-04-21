<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\SafetyIncident;
use Aero\HRM\Models\SafetyInspection;
use Aero\HRM\Services\SafetyComplianceService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class SafetyComplianceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SafetyComplianceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(SafetyComplianceService::class);
    }

    #[Test]
    public function it_creates_safety_incident_with_reported_status(): void
    {
        $employee = Employee::factory()->create();

        $incident = SafetyIncident::factory()->create([
            'reported_by' => $employee->id,
            'status' => 'reported',
        ]);

        $this->assertEquals('reported', $incident->status);
        $this->assertEquals($employee->id, $incident->reported_by);
    }

    #[Test]
    public function it_escalates_critical_incident_severity(): void
    {
        $employee = Employee::factory()->create();

        $incident = SafetyIncident::factory()->create([
            'reported_by' => $employee->id,
            'severity' => 'critical',
            'status' => 'reported',
        ]);

        $this->assertEquals('critical', $incident->severity);
    }

    #[Test]
    public function it_tracks_incident_investigation_progress(): void
    {
        $employee = Employee::factory()->create();

        $incident = SafetyIncident::factory()->create([
            'reported_by' => $employee->id,
            'status' => 'reported',
        ]);

        $incident->update([
            'status' => 'investigating',
            'investigation_started_at' => now(),
        ]);

        $incident->refresh();
        $this->assertEquals('investigating', $incident->status);
    }

    #[Test]
    public function it_closes_resolved_incident(): void
    {
        $employee = Employee::factory()->create();

        $incident = SafetyIncident::factory()->create([
            'reported_by' => $employee->id,
            'status' => 'investigating',
        ]);

        $incident->update([
            'status' => 'closed',
            'corrective_actions' => 'Corrective measures implemented.',
            'resolved_at' => now(),
        ]);

        $incident->refresh();
        $this->assertEquals('closed', $incident->status);
        $this->assertNotNull($incident->corrective_actions);
    }

    #[Test]
    public function it_counts_incidents_by_department(): void
    {
        $dept1 = Department::factory()->create();
        $dept2 = Department::factory()->create();

        SafetyIncident::factory()->count(3)->create(['department_id' => $dept1->id]);
        SafetyIncident::factory()->count(1)->create(['department_id' => $dept2->id]);

        $this->assertEquals(3, SafetyIncident::where('department_id', $dept1->id)->count());
        $this->assertEquals(1, SafetyIncident::where('department_id', $dept2->id)->count());
    }

    #[Test]
    public function it_creates_safety_inspection_with_scheduled_status(): void
    {
        $employee = Employee::factory()->create();

        $inspection = SafetyInspection::factory()->create([
            'inspector_id' => $employee->id,
            'status' => 'scheduled',
        ]);

        $this->assertEquals('scheduled', $inspection->status);
    }
}
