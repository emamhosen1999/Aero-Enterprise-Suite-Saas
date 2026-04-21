<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Grievance;
use Aero\HRM\Models\GrievanceCategory;
use Aero\HRM\Services\GrievanceResolutionService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class GrievanceResolutionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected GrievanceResolutionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(GrievanceResolutionService::class);
    }

    #[Test]
    public function it_creates_grievance_with_open_status(): void
    {
        $employee = Employee::factory()->create();
        $category = GrievanceCategory::factory()->create();

        $grievance = Grievance::factory()->create([
            'employee_id' => $employee->id,
            'grievance_category_id' => $category->id,
            'status' => 'open',
        ]);

        $this->assertEquals('open', $grievance->status);
        $this->assertEquals($employee->id, $grievance->employee_id);
    }

    #[Test]
    public function it_assigns_investigator_to_grievance(): void
    {
        $employee = Employee::factory()->create();
        $investigator = Employee::factory()->create();

        $grievance = Grievance::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'open',
        ]);

        $grievance->update([
            'assigned_to' => $investigator->id,
            'status' => 'under_investigation',
        ]);

        $grievance->refresh();
        $this->assertEquals($investigator->id, $grievance->assigned_to);
        $this->assertEquals('under_investigation', $grievance->status);
    }

    #[Test]
    public function it_resolves_grievance_with_resolution_details(): void
    {
        $employee = Employee::factory()->create();

        $grievance = Grievance::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'under_investigation',
        ]);

        $grievance->update([
            'status' => 'resolved',
            'resolution' => 'Issue was addressed by management.',
            'resolved_at' => now(),
        ]);

        $grievance->refresh();
        $this->assertEquals('resolved', $grievance->status);
        $this->assertNotNull($grievance->resolution);
        $this->assertNotNull($grievance->resolved_at);
    }

    #[Test]
    public function it_tracks_grievance_count_per_employee(): void
    {
        $employee = Employee::factory()->create();

        Grievance::factory()->count(3)->create(['employee_id' => $employee->id]);

        $this->assertCount(3, Grievance::where('employee_id', $employee->id)->get());
    }

    #[Test]
    public function it_filters_open_grievances(): void
    {
        Grievance::factory()->count(2)->create(['status' => 'open']);
        Grievance::factory()->count(3)->create(['status' => 'resolved']);

        $open = Grievance::where('status', 'open')->count();
        $this->assertEquals(2, $open);
    }
}
