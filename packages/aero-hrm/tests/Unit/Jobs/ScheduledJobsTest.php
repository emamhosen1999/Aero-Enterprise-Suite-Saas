<?php

namespace Aero\HRM\Tests\Unit\Jobs;

use Aero\HRM\Jobs\CheckBirthdaysJob;
use Aero\HRM\Jobs\CheckExpiringContractsJob;
use Aero\HRM\Jobs\CheckExpiringDocumentsJob;
use Aero\HRM\Jobs\CheckProbationEndingJob;
use Aero\HRM\Jobs\CheckWorkAnniversariesJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use PHPUnit\Framework\TestCase;

class ScheduledJobsTest extends TestCase
{
    /**
     * Test CheckBirthdaysJob implements ShouldQueue.
     */
    public function test_check_birthdays_job_is_queueable(): void
    {
        $job = new CheckBirthdaysJob();

        $this->assertInstanceOf(ShouldQueue::class, $job);
    }

    /**
     * Test CheckBirthdaysJob has retry configuration.
     */
    public function test_check_birthdays_job_has_retry_config(): void
    {
        $job = new CheckBirthdaysJob();

        $this->assertObjectHasProperty('tries', $job);
        $this->assertEquals(3, $job->tries);
    }

    /**
     * Test CheckWorkAnniversariesJob implements ShouldQueue.
     */
    public function test_check_anniversaries_job_is_queueable(): void
    {
        $job = new CheckWorkAnniversariesJob();

        $this->assertInstanceOf(ShouldQueue::class, $job);
    }

    /**
     * Test CheckWorkAnniversariesJob has retry configuration.
     */
    public function test_check_anniversaries_job_has_retry_config(): void
    {
        $job = new CheckWorkAnniversariesJob();

        $this->assertObjectHasProperty('tries', $job);
        $this->assertEquals(3, $job->tries);
    }

    /**
     * Test CheckExpiringDocumentsJob implements ShouldQueue.
     */
    public function test_check_documents_job_is_queueable(): void
    {
        $job = new CheckExpiringDocumentsJob();

        $this->assertInstanceOf(ShouldQueue::class, $job);
    }

    /**
     * Test CheckExpiringDocumentsJob has reminder days.
     */
    public function test_check_documents_job_has_reminder_days(): void
    {
        $job = new CheckExpiringDocumentsJob();

        $this->assertObjectHasProperty('reminderDays', $job);
        $reminderDays = $job->reminderDays;

        $this->assertIsArray($reminderDays);
        $this->assertContains(30, $reminderDays);
        $this->assertContains(14, $reminderDays);
        $this->assertContains(7, $reminderDays);
        $this->assertContains(3, $reminderDays);
        $this->assertContains(1, $reminderDays);
        $this->assertContains(0, $reminderDays);
    }

    /**
     * Test CheckProbationEndingJob implements ShouldQueue.
     */
    public function test_check_probation_job_is_queueable(): void
    {
        $job = new CheckProbationEndingJob();

        $this->assertInstanceOf(ShouldQueue::class, $job);
    }

    /**
     * Test CheckProbationEndingJob has reminder days.
     */
    public function test_check_probation_job_has_reminder_days(): void
    {
        $job = new CheckProbationEndingJob();

        $this->assertObjectHasProperty('reminderDays', $job);
        $reminderDays = $job->reminderDays;

        $this->assertIsArray($reminderDays);
        $this->assertContains(14, $reminderDays);
        $this->assertContains(7, $reminderDays);
    }

    /**
     * Test CheckExpiringContractsJob implements ShouldQueue.
     */
    public function test_check_contracts_job_is_queueable(): void
    {
        $job = new CheckExpiringContractsJob();

        $this->assertInstanceOf(ShouldQueue::class, $job);
    }

    /**
     * Test CheckExpiringContractsJob has reminder days.
     */
    public function test_check_contracts_job_has_reminder_days(): void
    {
        $job = new CheckExpiringContractsJob();

        $this->assertObjectHasProperty('reminderDays', $job);
        $reminderDays = $job->reminderDays;

        $this->assertIsArray($reminderDays);
        $this->assertContains(30, $reminderDays);
        $this->assertContains(14, $reminderDays);
    }

    /**
     * Test all jobs have backoff configuration.
     */
    public function test_all_jobs_have_backoff(): void
    {
        $jobs = [
            new CheckBirthdaysJob(),
            new CheckWorkAnniversariesJob(),
            new CheckExpiringDocumentsJob(),
            new CheckProbationEndingJob(),
            new CheckExpiringContractsJob(),
        ];

        foreach ($jobs as $job) {
            $this->assertTrue(
                method_exists($job, 'backoff'),
                get_class($job) . ' should have backoff method'
            );

            $backoff = $job->backoff();
            $this->assertIsArray($backoff, get_class($job) . ' backoff should return array');
        }
    }
}
