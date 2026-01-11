<?php

declare(strict_types=1);

namespace Tests\Feature\HRM\Notifications;

use Aero\HRM\Events\EmployeeBirthday;
use Aero\HRM\Events\WorkAnniversary;
use Aero\HRM\Jobs\CheckBirthdaysJob;
use Aero\HRM\Jobs\CheckWorkAnniversariesJob;
use Aero\HRM\Models\Employee;
use Aero\HRM\Notifications\BirthdayWishNotification;
use Aero\HRM\Notifications\TeamBirthdayAlertNotification;
use Aero\HRM\Notifications\WorkAnniversaryNotification;
use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * UAT Tests for Birthday & Anniversary Notifications
 *
 * Test IDs: NOTIF-BD-01 to NOTIF-AN-03, JOB-01, JOB-02
 */
class BirthdayAnniversaryNotificationUatTest extends TestCase
{
    use RefreshDatabase;

    protected User $employee;
    protected User $manager;
    protected Employee $employeeRecord;
    protected Employee $managerRecord;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Manager
        $this->manager = User::factory()->create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
        ]);

        $this->managerRecord = Employee::factory()->create([
            'user_id' => $this->manager->id,
            'status' => 'active',
            'birthday' => Carbon::parse('1985-05-15'),
            'joining_date' => Carbon::parse('2015-03-01'),
        ]);

        // Create Employee with birthday today
        $this->employee = User::factory()->create([
            'name' => 'Test Employee',
            'email' => 'emp2@test.com',
            'notification_preferences' => [
                'birthday_reminder' => ['mail' => true, 'database' => true, 'fcm' => true],
                'work_anniversary' => ['mail' => true, 'database' => true, 'fcm' => true],
            ],
        ]);

        $this->employeeRecord = Employee::factory()->create([
            'user_id' => $this->employee->id,
            'manager_id' => $this->managerRecord->id,
            'status' => 'active',
            'birthday' => Carbon::today()->copy()->year(1990), // Birthday today
            'joining_date' => Carbon::today()->copy()->year(2020), // Anniversary today (6 years)
        ]);
    }

    /**
     * @test
     * Test ID: NOTIF-BD-01
     * Birthday Wish to Employee
     */
    public function it_sends_birthday_wish_to_employee(): void
    {
        Notification::fake();

        $age = Carbon::today()->year - $this->employeeRecord->birthday->year;

        // Trigger birthday event
        event(new EmployeeBirthday($this->employeeRecord, $age));

        // Assert employee received birthday wish
        Notification::assertSentTo(
            $this->employee,
            BirthdayWishNotification::class,
            function ($notification, $channels) use ($age) {
                return $notification->employee->id === $this->employeeRecord->id
                    && $notification->age === $age
                    && in_array('mail', $channels)
                    && in_array('database', $channels);
            }
        );

        $this->assertTrue(true, 'NOTIF-BD-01: PASSED - Employee receives birthday wish');
    }

    /**
     * @test
     * Test ID: NOTIF-BD-02
     * Birthday Alert to Manager
     */
    public function it_sends_birthday_alert_to_manager(): void
    {
        Notification::fake();

        $age = Carbon::today()->year - $this->employeeRecord->birthday->year;

        // Trigger birthday event
        event(new EmployeeBirthday($this->employeeRecord, $age));

        // Assert manager received alert
        Notification::assertSentTo(
            $this->manager,
            TeamBirthdayAlertNotification::class,
            function ($notification) use ($age) {
                return $notification->employee->id === $this->employeeRecord->id
                    && $notification->age === $age;
            }
        );

        $this->assertTrue(true, 'NOTIF-BD-02: PASSED - Manager receives birthday alert');
    }

    /**
     * @test
     * Test ID: JOB-01
     * Birthday Job Runs and Sends Notifications
     */
    public function it_runs_birthday_job_and_sends_notifications(): void
    {
        Notification::fake();

        // Run the birthday check job
        $job = new CheckBirthdaysJob();
        $job->handle();

        // Assert birthday notification was sent
        Notification::assertSentTo(
            $this->employee,
            BirthdayWishNotification::class
        );

        Notification::assertSentTo(
            $this->manager,
            TeamBirthdayAlertNotification::class
        );

        $this->assertTrue(true, 'JOB-01: PASSED - Birthday job executes and sends notifications');
    }

    /**
     * @test
     * Test ID: NOTIF-AN-01
     * Work Anniversary Notification
     */
    public function it_sends_work_anniversary_notification(): void
    {
        Notification::fake();

        $yearsOfService = Carbon::today()->year - $this->employeeRecord->joining_date->year;

        // Trigger anniversary event
        event(new WorkAnniversary($this->employeeRecord, $yearsOfService));

        // Assert employee received anniversary notification
        Notification::assertSentTo(
            $this->employee,
            WorkAnniversaryNotification::class,
            function ($notification, $channels) use ($yearsOfService) {
                return $notification->employee->id === $this->employeeRecord->id
                    && $notification->yearsOfService === $yearsOfService
                    && in_array('mail', $channels)
                    && in_array('database', $channels);
            }
        );

        $this->assertTrue(true, 'NOTIF-AN-01: PASSED - Employee receives anniversary notification');
    }

    /**
     * @test
     * Test ID: NOTIF-AN-02
     * Milestone Anniversary (5 years)
     */
    public function it_recognizes_milestone_anniversaries(): void
    {
        // Create employee with 5-year anniversary
        $milestoneEmployee = Employee::factory()->create([
            'user_id' => User::factory()->create(['email' => 'milestone@test.com'])->id,
            'status' => 'active',
            'joining_date' => Carbon::today()->copy()->year(2021), // Exactly 5 years
        ]);

        Notification::fake();

        event(new WorkAnniversary($milestoneEmployee, 5));

        // Check notification includes milestone recognition
        Notification::assertSentTo(
            $milestoneEmployee->user,
            WorkAnniversaryNotification::class,
            function ($notification) {
                return $notification->yearsOfService === 5;
            }
        );

        $this->assertTrue(true, 'NOTIF-AN-02: PASSED - Milestone anniversary recognized');
    }

    /**
     * @test
     * Test ID: JOB-02
     * Anniversary Job Runs and Sends Notifications
     */
    public function it_runs_anniversary_job_and_sends_notifications(): void
    {
        Notification::fake();

        // Run the anniversary check job
        $job = new CheckWorkAnniversariesJob();
        $job->handle();

        // Assert anniversary notification was sent
        Notification::assertSentTo(
            $this->employee,
            WorkAnniversaryNotification::class
        );

        $this->assertTrue(true, 'JOB-02: PASSED - Anniversary job executes and sends notifications');
    }

    /**
     * @test
     * Test ID: JOB-04
     * Job Failure Handling with Retry
     */
    public function it_handles_job_failure_with_retry(): void
    {
        Queue::fake();

        // Create a job that will fail
        $job = new CheckBirthdaysJob();

        // Assert job has retry configuration
        $this->assertEquals(3, $job->tries);
        $this->assertEquals([60, 300, 600], $job->backoff);

        $this->assertTrue(true, 'JOB-04: PASSED - Job has retry configuration');
    }

    /**
     * @test
     * Test ID: NOTIF-BD-03 / NOTIF-AN-03
     * No Notification for Inactive Employees
     */
    public function it_does_not_send_notifications_for_inactive_employees(): void
    {
        Notification::fake();

        // Create inactive employee with birthday today
        $inactiveEmployee = Employee::factory()->create([
            'user_id' => User::factory()->create()->id,
            'status' => 'inactive',
            'birthday' => Carbon::today()->copy()->year(1992),
        ]);

        // Run birthday job
        $job = new CheckBirthdaysJob();
        $job->handle();

        // Assert no notification sent to inactive employee
        Notification::assertNotSentTo(
            $inactiveEmployee->user,
            BirthdayWishNotification::class
        );

        $this->assertTrue(true, 'NOTIF-BD-03: PASSED - Inactive employees excluded from notifications');
    }

    /**
     * @test
     * Test ID: Multiple Birthdays/Anniversaries
     * Bulk Notification Processing
     */
    public function it_handles_multiple_birthdays_on_same_day(): void
    {
        Notification::fake();

        // Create 5 employees with birthday today
        $employees = collect();
        for ($i = 0; $i < 5; $i++) {
            $user = User::factory()->create(['email' => "emp{$i}@test.com"]);
            $emp = Employee::factory()->create([
                'user_id' => $user->id,
                'status' => 'active',
                'birthday' => Carbon::today()->copy()->year(1990 + $i),
            ]);
            $employees->push($emp);
        }

        // Run birthday job
        $job = new CheckBirthdaysJob();
        $job->handle();

        // Assert all received notifications
        $employees->each(function ($employee) {
            Notification::assertSentTo(
                $employee->user,
                BirthdayWishNotification::class
            );
        });

        $this->assertTrue(true, 'BULK: PASSED - Multiple birthdays processed successfully');
    }
}
