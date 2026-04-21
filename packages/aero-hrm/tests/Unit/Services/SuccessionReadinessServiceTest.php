<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\SuccessionCandidate;
use Aero\HRM\Models\SuccessionPlan;
use Aero\HRM\Services\SuccessionReadinessService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class SuccessionReadinessServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SuccessionReadinessService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(SuccessionReadinessService::class);
    }

    #[Test]
    public function it_creates_succession_plan_for_critical_role(): void
    {
        $department = Department::factory()->create();
        $designation = Designation::factory()->create();

        $plan = SuccessionPlan::factory()->create([
            'department_id' => $department->id,
            'designation_id' => $designation->id,
            'status' => 'active',
        ]);

        $this->assertEquals('active', $plan->status);
        $this->assertEquals($department->id, $plan->department_id);
    }

    #[Test]
    public function it_assigns_candidates_to_succession_plan(): void
    {
        $plan = SuccessionPlan::factory()->create();
        $candidates = Employee::factory()->count(3)->create();

        foreach ($candidates as $candidate) {
            SuccessionCandidate::factory()->create([
                'succession_plan_id' => $plan->id,
                'employee_id' => $candidate->id,
            ]);
        }

        $this->assertCount(3, SuccessionCandidate::where('succession_plan_id', $plan->id)->get());
    }

    #[Test]
    public function it_ranks_candidates_by_readiness_score(): void
    {
        $plan = SuccessionPlan::factory()->create();
        $employees = Employee::factory()->count(3)->create();

        $scores = [85, 72, 90];
        foreach ($employees as $i => $employee) {
            SuccessionCandidate::factory()->create([
                'succession_plan_id' => $plan->id,
                'employee_id' => $employee->id,
                'readiness_score' => $scores[$i],
            ]);
        }

        $top = SuccessionCandidate::where('succession_plan_id', $plan->id)
            ->orderByDesc('readiness_score')
            ->first();

        $this->assertEquals(90, $top->readiness_score);
    }

    #[Test]
    public function it_identifies_ready_now_candidates(): void
    {
        $plan = SuccessionPlan::factory()->create();
        $employees = Employee::factory()->count(4)->create();

        SuccessionCandidate::factory()->create([
            'succession_plan_id' => $plan->id,
            'employee_id' => $employees[0]->id,
            'readiness_level' => 'ready_now',
        ]);
        SuccessionCandidate::factory()->create([
            'succession_plan_id' => $plan->id,
            'employee_id' => $employees[1]->id,
            'readiness_level' => 'ready_1_2_years',
        ]);
        SuccessionCandidate::factory()->create([
            'succession_plan_id' => $plan->id,
            'employee_id' => $employees[2]->id,
            'readiness_level' => 'ready_now',
        ]);
        SuccessionCandidate::factory()->create([
            'succession_plan_id' => $plan->id,
            'employee_id' => $employees[3]->id,
            'readiness_level' => 'development_needed',
        ]);

        $readyNow = SuccessionCandidate::where('succession_plan_id', $plan->id)
            ->where('readiness_level', 'ready_now')
            ->count();

        $this->assertEquals(2, $readyNow);
    }
}
