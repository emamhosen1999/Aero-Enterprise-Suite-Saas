<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\PerformanceReview;
use Aero\HRM\Models\PerformanceReviewTemplate;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PerformanceReviewModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_performance_review_via_factory(): void
    {
        $review = PerformanceReview::factory()->create();

        $this->assertInstanceOf(PerformanceReview::class, $review);
        $this->assertNotNull($review->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $review = PerformanceReview::factory()->create(['employee_id' => $employee->id]);

        $this->assertEquals($employee->id, $review->employee_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_reviewer(): void
    {
        $reviewer = Employee::factory()->create();
        $review = PerformanceReview::factory()->create(['reviewer_id' => $reviewer->id]);

        $this->assertEquals($reviewer->id, $review->reviewer_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_all_review_statuses(): void
    {
        $statuses = ['draft', 'in_progress', 'completed', 'acknowledged'];

        foreach ($statuses as $status) {
            $review = PerformanceReview::factory()->create(['status' => $status]);
            $this->assertEquals($status, $review->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_overall_rating(): void
    {
        $review = PerformanceReview::factory()->create(['overall_rating' => 4.5]);
        $this->assertEquals(4.5, $review->overall_rating);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_completed_reviews(): void
    {
        PerformanceReview::factory()->count(3)->create(['status' => 'completed']);
        PerformanceReview::factory()->count(2)->create(['status' => 'draft']);

        $this->assertEquals(3, PerformanceReview::where('status', 'completed')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_review_template_via_factory(): void
    {
        $template = PerformanceReviewTemplate::factory()->create();

        $this->assertInstanceOf(PerformanceReviewTemplate::class, $template);
        $this->assertNotNull($template->name);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_counts_reviews_per_employee(): void
    {
        $employee = Employee::factory()->create();
        PerformanceReview::factory()->count(4)->create(['employee_id' => $employee->id]);

        $this->assertEquals(4, PerformanceReview::where('employee_id', $employee->id)->count());
    }
}
