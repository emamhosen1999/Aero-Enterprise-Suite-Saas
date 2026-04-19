<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Services;

use Aero\Core\Models\User;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveBalance;
use Aero\HRM\Services\EmployeeDashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeDashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private EmployeeDashboardService $service;

    private User $user;

    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(EmployeeDashboardService::class);
        $this->user = User::factory()->create();
        $this->employee = Employee::factory()->create(['user_id' => $this->user->id]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_attendance_data_for_employee(): void
    {
        $result = $this->service->getAttendanceData($this->user);

        $this->assertArrayHasKey('todayAttendance', $result);
        $this->assertArrayHasKey('attendanceStats', $result);
        $this->assertArrayHasKey('weeklyAttendance', $result);
        $this->assertIsArray($result['weeklyAttendance']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_leave_data_for_employee(): void
    {
        $result = $this->service->getLeaveData($this->user);

        $this->assertArrayHasKey('leaveBalances', $result);
        $this->assertArrayHasKey('pendingLeaves', $result);
        $this->assertArrayHasKey('recentLeaves', $result);
        $this->assertArrayHasKey('upcomingApprovedLeaves', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_empty_defaults_on_missing_data(): void
    {
        // User with no related data should still get valid response structure
        $freshUser = User::factory()->create();
        Employee::factory()->create(['user_id' => $freshUser->id]);

        $attendance = $this->service->getAttendanceData($freshUser);
        $this->assertNull($attendance['todayAttendance']);
        $this->assertIsArray($attendance['weeklyAttendance']);

        $leave = $this->service->getLeaveData($freshUser);
        $this->assertEmpty($leave['pendingLeaves']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_deferred_data_structures(): void
    {
        $payroll = $this->service->getPayrollData($this->user);
        $this->assertArrayHasKey('latestPayslip', $payroll);
        $this->assertArrayHasKey('payrollHistory', $payroll);

        $performance = $this->service->getPerformanceData($this->user, $this->employee);
        $this->assertArrayHasKey('currentReview', $performance);
        $this->assertArrayHasKey('myKPIs', $performance);

        $training = $this->service->getTrainingData($this->user);
        $this->assertArrayHasKey('myTrainings', $training);
        $this->assertArrayHasKey('upcomingTrainingSessions', $training);
        $this->assertArrayHasKey('certifications', $training);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_employee_profile(): void
    {
        $profile = $this->service->getEmployeeProfile($this->user, $this->employee);

        $this->assertArrayHasKey('id', $profile);
        $this->assertArrayHasKey('name', $profile);
        $this->assertArrayHasKey('employee_id', $profile);
        $this->assertEquals($this->user->name, $profile['name']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_quick_actions(): void
    {
        $actions = $this->service->getQuickActions($this->user);

        $this->assertIsArray($actions);
        $this->assertNotEmpty($actions);
        // Each action should have label, icon, route, color
        $first = $actions[0];
        $this->assertArrayHasKey('label', $first);
        $this->assertArrayHasKey('icon', $first);
        $this->assertArrayHasKey('route', $first);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_builds_alerts_from_data(): void
    {
        $alerts = $this->service->buildAlerts($this->user, $this->employee);

        $this->assertIsArray($alerts);
        // With no data, alerts should be empty or minimal
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_holiday_and_event_data(): void
    {
        $result = $this->service->getHolidayAndEventData();

        $this->assertArrayHasKey('upcomingHolidays', $result);
        $this->assertArrayHasKey('companyEvents', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_expense_data(): void
    {
        $result = $this->service->getExpenseData($this->employee);

        $this->assertArrayHasKey('expenseSummary', $result);
        $this->assertArrayHasKey('recentExpenses', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_team_data(): void
    {
        $result = $this->service->getTeamData($this->employee);

        $this->assertArrayHasKey('teamInfo', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_asset_data(): void
    {
        $result = $this->service->getAssetData($this->employee);

        $this->assertArrayHasKey('myAssets', $result);
        $this->assertIsArray($result['myAssets']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_document_data(): void
    {
        $result = $this->service->getDocumentData($this->user);

        $this->assertArrayHasKey('myDocuments', $result);
        $this->assertArrayHasKey('documentAlerts', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_career_data(): void
    {
        $result = $this->service->getCareerData($this->employee);

        $this->assertArrayHasKey('careerPath', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_survey_data(): void
    {
        $result = $this->service->getSurveyData($this->employee);

        $this->assertArrayHasKey('activeSurveys', $result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_benefit_data(): void
    {
        $result = $this->service->getBenefitData($this->employee);

        $this->assertArrayHasKey('myBenefits', $result);
    }
}
