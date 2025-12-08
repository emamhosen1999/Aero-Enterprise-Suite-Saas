<?php

namespace Tests\Feature;

use Aero\Platform\Jobs\AggregateTenantStats;
use Carbon\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Tests for the tenant stats aggregation command and job.
 *
 * Note: Tests for TenantStat and PlatformStatDaily models are omitted
 * as they require the 'central' database connection which uses the main
 * landlord database. These models should be tested in integration tests
 * with proper database isolation.
 */
class AggregateTenantStatsTest extends TestCase
{
    /**
     * Test the stats:aggregate command dispatches the job.
     */
    public function test_command_dispatches_job_to_queue(): void
    {
        Queue::fake();

        $this->artisan('stats:aggregate')
            ->expectsOutput('Aggregating tenant stats for: '.Carbon::today()->toDateString())
            ->expectsOutput('Stats aggregation job dispatched to queue.')
            ->assertSuccessful();

        Queue::assertPushed(AggregateTenantStats::class);
    }

    /**
     * Test the stats:aggregate command with a specific date.
     */
    public function test_command_accepts_date_option(): void
    {
        Queue::fake();

        $date = '2025-06-15';

        $this->artisan('stats:aggregate', ['--date' => $date])
            ->expectsOutput("Aggregating tenant stats for: {$date}")
            ->expectsOutput('Stats aggregation job dispatched to queue.')
            ->assertSuccessful();

        Queue::assertPushed(AggregateTenantStats::class, function ($job) use ($date) {
            // Access the date property via reflection
            $reflection = new \ReflectionClass($job);
            $property = $reflection->getProperty('date');
            $property->setAccessible(true);
            $jobDate = $property->getValue($job);

            return $jobDate->toDateString() === $date;
        });
    }

    /**
     * Test the stats:aggregate command runs synchronously with --sync flag.
     */
    public function test_command_runs_synchronously_with_sync_flag(): void
    {
        Queue::fake();

        // Since there are no tenants, it should complete successfully
        $this->artisan('stats:aggregate', ['--sync' => true])
            ->expectsOutput('Running synchronously...')
            ->expectsOutput('Stats aggregation completed successfully.')
            ->assertSuccessful();

        // Job should NOT be pushed to queue when running synchronously
        Queue::assertNotPushed(AggregateTenantStats::class);
    }

    /**
     * Test the job has correct retry configuration.
     */
    public function test_job_has_retry_configuration(): void
    {
        $job = new AggregateTenantStats(Carbon::today());

        $this->assertEquals(3, $job->tries);
        $this->assertEquals([60, 300, 600], $job->backoff);
    }

    /**
     * Test the job can be serialized (for queue).
     */
    public function test_job_can_be_serialized(): void
    {
        $date = Carbon::parse('2025-06-15');
        $job = new AggregateTenantStats($date);

        $serialized = serialize($job);
        $unserialized = unserialize($serialized);

        $this->assertInstanceOf(AggregateTenantStats::class, $unserialized);
    }
}
