<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\SafetyIncident;
use Aero\HRM\Models\SafetyIncidentParticipant;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SafetyIncidentModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_safety_incident_via_factory(): void
    {
        $incident = SafetyIncident::factory()->create();

        $this->assertInstanceOf(SafetyIncident::class, $incident);
        $this->assertNotNull($incident->id);
        $this->assertNotNull($incident->title);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_optionally_belongs_to_department(): void
    {
        $department = Department::factory()->create();
        $incident = SafetyIncident::factory()->create(['department_id' => $department->id]);

        $this->assertEquals($department->id, $incident->department_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_participants(): void
    {
        $incident = SafetyIncident::factory()->create();
        SafetyIncidentParticipant::factory()->count(3)->create(['safety_incident_id' => $incident->id]);

        $this->assertCount(3, $incident->participants);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_severity_levels(): void
    {
        $severities = ['low', 'medium', 'high', 'critical'];

        foreach ($severities as $severity) {
            $incident = SafetyIncident::factory()->create(['severity' => $severity]);
            $this->assertEquals($severity, $incident->severity);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_incident_statuses(): void
    {
        $statuses = ['reported', 'under_investigation', 'resolved', 'closed'];

        foreach ($statuses as $status) {
            $incident = SafetyIncident::factory()->create(['status' => $status]);
            $this->assertEquals($status, $incident->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_critical_incidents(): void
    {
        SafetyIncident::factory()->count(3)->create(['severity' => 'critical']);
        SafetyIncident::factory()->count(5)->create(['severity' => 'low']);

        $this->assertEquals(3, SafetyIncident::where('severity', 'critical')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_open_incidents(): void
    {
        SafetyIncident::factory()->count(4)->create(['status' => 'reported']);
        SafetyIncident::factory()->count(2)->create(['status' => 'closed']);

        $this->assertEquals(4, SafetyIncident::where('status', 'reported')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_incident_date(): void
    {
        $incident = SafetyIncident::factory()->create([
            'incident_date' => '2026-04-01',
        ]);

        $this->assertNotNull($incident->incident_date);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_counts_incidents_per_department(): void
    {
        $department = Department::factory()->create();
        SafetyIncident::factory()->count(5)->create(['department_id' => $department->id]);

        $this->assertEquals(5, SafetyIncident::where('department_id', $department->id)->count());
    }
}
