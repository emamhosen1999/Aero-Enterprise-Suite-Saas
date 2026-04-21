<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Job;
use Aero\HRM\Models\JobApplication;
use Aero\HRM\Models\JobHiringStage;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class JobModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_job_via_factory(): void
    {
        $job = Job::factory()->create();

        $this->assertInstanceOf(Job::class, $job);
        $this->assertNotNull($job->id);
        $this->assertNotNull($job->title);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_applications(): void
    {
        $job = Job::factory()->create();
        JobApplication::factory()->count(4)->create(['job_id' => $job->id]);

        $this->assertCount(4, $job->applications);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_hiring_stages(): void
    {
        $job = Job::factory()->create();
        JobHiringStage::factory()->count(3)->create(['job_id' => $job->id]);

        $this->assertCount(3, $job->hiringStages);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_job_status_values(): void
    {
        $statuses = ['draft', 'open', 'closed', 'on_hold'];

        foreach ($statuses as $status) {
            $job = Job::factory()->create(['status' => $status]);
            $this->assertEquals($status, $job->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_open_jobs(): void
    {
        Job::factory()->count(3)->create(['status' => 'open']);
        Job::factory()->count(2)->create(['status' => 'closed']);

        $this->assertEquals(3, Job::where('status', 'open')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_job_requirements(): void
    {
        $job = Job::factory()->create([
            'vacancies' => 5,
            'experience_min' => 2,
        ]);

        $this->assertEquals(5, $job->vacancies);
        $this->assertEquals(2, $job->experience_min);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_application_stages(): void
    {
        $job = Job::factory()->create();
        $application = JobApplication::factory()->create(['job_id' => $job->id]);

        $this->assertInstanceOf(Job::class, $application->job);
        $this->assertEquals($job->id, $application->job->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_application_status_values(): void
    {
        $job = Job::factory()->create();
        $statuses = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

        foreach ($statuses as $status) {
            $application = JobApplication::factory()->create([
                'job_id' => $job->id,
                'status' => $status,
            ]);
            $this->assertEquals($status, $application->status);
        }
    }
}
