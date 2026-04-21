<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Training;
use Aero\HRM\Models\TrainingCategory;
use Aero\HRM\Models\TrainingEnrollment;
use Aero\HRM\Models\TrainingSession;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TrainingModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_training_via_factory(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);

        $this->assertInstanceOf(Training::class, $training);
        $this->assertNotNull($training->title);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_category(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);

        $this->assertInstanceOf(TrainingCategory::class, $training->category);
        $this->assertEquals($category->id, $training->category->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_sessions(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        TrainingSession::factory()->count(3)->create(['training_id' => $training->id]);

        $this->assertCount(3, $training->sessions);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_enrollments(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        $employees = Employee::factory()->count(5)->create();

        foreach ($employees as $employee) {
            TrainingEnrollment::factory()->create([
                'training_id' => $training->id,
                'employee_id' => $employee->id,
            ]);
        }

        $this->assertCount(5, $training->enrollments);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_training_statuses(): void
    {
        $statuses = ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'];
        $category = TrainingCategory::factory()->create();

        foreach ($statuses as $status) {
            $training = Training::factory()->create([
                'training_category_id' => $category->id,
                'status' => $status,
            ]);
            $this->assertEquals($status, $training->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_active_trainings(): void
    {
        $category = TrainingCategory::factory()->create();
        Training::factory()->count(3)->create(['training_category_id' => $category->id, 'status' => 'scheduled']);
        Training::factory()->count(2)->create(['training_category_id' => $category->id, 'status' => 'completed']);

        $this->assertEquals(3, Training::where('status', 'scheduled')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_enrollment_completion(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        $employee = Employee::factory()->create();

        $enrollment = TrainingEnrollment::factory()->create([
            'training_id' => $training->id,
            'employee_id' => $employee->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->assertEquals('completed', $enrollment->status);
        $this->assertNotNull($enrollment->completed_at);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_session_duration(): void
    {
        $category = TrainingCategory::factory()->create();
        $training = Training::factory()->create(['training_category_id' => $category->id]);
        $session = TrainingSession::factory()->create([
            'training_id' => $training->id,
            'duration_hours' => 4,
        ]);

        $this->assertEquals(4, $session->duration_hours);
    }
}
