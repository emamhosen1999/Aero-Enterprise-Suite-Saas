<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Grievance;
use Aero\HRM\Models\GrievanceCategory;
use Aero\HRM\Models\GrievanceNote;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GrievanceModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_grievance_via_factory(): void
    {
        $grievance = Grievance::factory()->create();

        $this->assertInstanceOf(Grievance::class, $grievance);
        $this->assertNotNull($grievance->id);
        $this->assertNotNull($grievance->subject);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $grievance = Grievance::factory()->create(['employee_id' => $employee->id]);

        $this->assertEquals($employee->id, $grievance->employee_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_optionally_belongs_to_category(): void
    {
        $category = GrievanceCategory::factory()->create();
        $grievance = Grievance::factory()->create(['category_id' => $category->id]);

        $this->assertInstanceOf(GrievanceCategory::class, $grievance->category);
        $this->assertEquals($category->id, $grievance->category->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_grievance_statuses(): void
    {
        $statuses = ['open', 'under_investigation', 'resolved', 'closed', 'withdrawn'];

        foreach ($statuses as $status) {
            $grievance = Grievance::factory()->create(['status' => $status]);
            $this->assertEquals($status, $grievance->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_open_grievances(): void
    {
        Grievance::factory()->count(4)->create(['status' => 'open']);
        Grievance::factory()->count(2)->create(['status' => 'resolved']);

        $this->assertEquals(4, Grievance::where('status', 'open')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_under_investigation_grievances(): void
    {
        Grievance::factory()->count(2)->create(['status' => 'under_investigation']);
        Grievance::factory()->count(3)->create(['status' => 'closed']);

        $this->assertEquals(2, Grievance::where('status', 'under_investigation')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_notes(): void
    {
        $grievance = Grievance::factory()->create();
        GrievanceNote::factory()->count(3)->create(['grievance_id' => $grievance->id]);

        $this->assertCount(3, $grievance->notes);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_priority_values(): void
    {
        $priorities = ['low', 'medium', 'high', 'urgent'];

        foreach ($priorities as $priority) {
            $grievance = Grievance::factory()->create(['priority' => $priority]);
            $this->assertEquals($priority, $grievance->priority);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_supports_anonymous_grievances(): void
    {
        $grievance = Grievance::factory()->create(['is_anonymous' => true]);

        $this->assertTrue((bool) $grievance->is_anonymous);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_counts_grievances_per_employee(): void
    {
        $employee = Employee::factory()->create();
        Grievance::factory()->count(3)->create(['employee_id' => $employee->id]);

        $this->assertEquals(3, Grievance::where('employee_id', $employee->id)->count());
    }
}
