<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\WorkforcePlan;
use Aero\HRM\Models\WorkforcePlanPosition;
use Aero\HRM\Services\WorkforceForecastingService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class WorkforceForecastingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected WorkforceForecastingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(WorkforceForecastingService::class);
    }

    #[Test]
    public function it_creates_workforce_plan_with_draft_status(): void
    {
        $department = Department::factory()->create();

        $plan = WorkforcePlan::factory()->create([
            'department_id' => $department->id,
            'status' => 'draft',
        ]);

        $this->assertEquals('draft', $plan->status);
        $this->assertEquals($department->id, $plan->department_id);
    }

    #[Test]
    public function it_adds_positions_to_workforce_plan(): void
    {
        $plan = WorkforcePlan::factory()->create();
        $designation = Designation::factory()->create();

        WorkforcePlanPosition::factory()->count(3)->create([
            'workforce_plan_id' => $plan->id,
            'designation_id' => $designation->id,
        ]);

        $this->assertCount(3, WorkforcePlanPosition::where('workforce_plan_id', $plan->id)->get());
    }

    #[Test]
    public function it_tracks_headcount_forecast_per_position(): void
    {
        $plan = WorkforcePlan::factory()->create();
        $designation = Designation::factory()->create();

        $position = WorkforcePlanPosition::factory()->create([
            'workforce_plan_id' => $plan->id,
            'designation_id' => $designation->id,
            'current_headcount' => 5,
            'target_headcount' => 8,
        ]);

        $this->assertEquals(5, $position->current_headcount);
        $this->assertEquals(8, $position->target_headcount);
        $this->assertEquals(3, $position->target_headcount - $position->current_headcount);
    }

    #[Test]
    public function it_approves_workforce_plan(): void
    {
        $approver = Employee::factory()->create();

        $plan = WorkforcePlan::factory()->create(['status' => 'pending_approval']);

        $plan->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        $plan->refresh();
        $this->assertEquals('approved', $plan->status);
        $this->assertEquals($approver->id, $plan->approved_by);
    }

    #[Test]
    public function it_calculates_total_headcount_gap_for_plan(): void
    {
        $plan = WorkforcePlan::factory()->create();
        $designation = Designation::factory()->create();

        WorkforcePlanPosition::factory()->create([
            'workforce_plan_id' => $plan->id,
            'designation_id' => $designation->id,
            'current_headcount' => 3,
            'target_headcount' => 5,
        ]);
        WorkforcePlanPosition::factory()->create([
            'workforce_plan_id' => $plan->id,
            'designation_id' => $designation->id,
            'current_headcount' => 2,
            'target_headcount' => 4,
        ]);

        $positions = WorkforcePlanPosition::where('workforce_plan_id', $plan->id)->get();
        $totalGap = $positions->sum(fn ($p) => $p->target_headcount - $p->current_headcount);

        $this->assertEquals(4, $totalGap);
    }
}
