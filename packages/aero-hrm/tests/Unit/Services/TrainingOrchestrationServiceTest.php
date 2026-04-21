<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Training;
use Aero\HRM\Models\TrainingCategory;
use Aero\HRM\Models\TrainingEnrollment;
use Aero\HRM\Models\TrainingSession;
use Aero\HRM\Services\TrainingOrchestrationService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TrainingOrchestrationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected TrainingOrchestrationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(TrainingOrchestrationService::class);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_training_program_with_sessions(): void
    {
        $category = TrainingCategory::factory()->create();

        $training = $this->service->createTrainingProgram(
            [
                'title' => 'Safety Compliance Training',
                'training_category_id' => $category->id,
                'status' => 'scheduled',
                'start_date' => now()->addWeek()->toDateString(),
                'end_date' => now()->addWeeks(2)->toDateString(),
            ],
            [
                ['title' => 'Day 1: Intro', 'session_date' => now()->addWeek()->toDateString(), 'duration_hours' => 4],
                ['title' => 'Day 2: Practice', 'session_date' => now()->addWeeks(2)->toDateString(), 'duration_hours' => 4],
            ]
        );

        $this->assertInstanceOf(Training::class, $training);
        $this->assertCount(2, $training->sessions);
        $this->assertEquals('scheduled', $training->sessions->first()->status);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_training_without_sessions(): void
    {
        $category = TrainingCategory::factory()->create();

        $training = $this->service->createTrainingProgram([
            'title' => 'Leadership Development',
            'training_category_id' => $category->id,
            'status' => 'draft',
            'start_date' => now()->addMonth()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
        ]);

        $this->assertInstanceOf(Training::class, $training);
        $this->assertCount(0, $training->sessions);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_enrolls_multiple_employees(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        $employees = Employee::factory()->count(5)->create();

        $enrollments = $this->service->enrollEmployees($training, $employees->pluck('id')->toArray());

        $this->assertCount(5, $enrollments);
        $this->assertCount(5, TrainingEnrollment::where('training_id', $training->id)->get());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_skips_duplicate_enrollments(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        $employee = Employee::factory()->create();

        $this->service->enrollEmployees($training, [$employee->id]);
        $this->service->enrollEmployees($training, [$employee->id]);

        $this->assertEquals(1, TrainingEnrollment::where('training_id', $training->id)->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_training_completion_count(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        $employees = Employee::factory()->count(4)->create();

        foreach ($employees as $i => $employee) {
            TrainingEnrollment::factory()->create([
                'training_id' => $training->id,
                'employee_id' => $employee->id,
                'status' => $i < 3 ? 'completed' : 'enrolled',
            ]);
        }

        $completed = TrainingEnrollment::where('training_id', $training->id)
            ->where('status', 'completed')
            ->count();

        $this->assertEquals(3, $completed);
    }
}
