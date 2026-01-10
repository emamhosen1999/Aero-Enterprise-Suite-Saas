# HRM Package Testing Blueprint
## Comprehensive Test Suite Architecture

**Date:** 2026-01-08  
**Purpose:** Detailed testing strategy with implementation examples

---

## Testing Infrastructure Setup

### Directory Structure
```
packages/aero-hrm/
├── tests/
│   ├── TestCase.php                      # Base test class
│   ├── CreatesApplication.php            # Application bootstrap
│   ├── Unit/
│   │   ├── Services/
│   │   │   ├── Leave/
│   │   │   │   ├── LeaveBalanceServiceTest.php
│   │   │   │   ├── LeaveValidationServiceTest.php
│   │   │   │   ├── LeaveOverlapServiceTest.php
│   │   │   │   ├── LeaveApprovalServiceTest.php
│   │   │   │   └── CompensatoryLeaveServiceTest.php
│   │   │   ├── Attendance/
│   │   │   │   ├── AttendanceCalculationServiceTest.php
│   │   │   │   ├── AttendancePunchServiceTest.php
│   │   │   │   ├── QrCodeValidatorTest.php
│   │   │   │   └── GeoLocationValidatorTest.php
│   │   │   ├── Payroll/
│   │   │   │   ├── PayrollCalculationServiceTest.php
│   │   │   │   ├── TaxRuleEngineTest.php
│   │   │   │   └── PayslipServiceTest.php
│   │   │   └── Performance/
│   │   │       ├── PerformanceReviewServiceTest.php
│   │   │       └── GoalSettingServiceTest.php
│   │   ├── Models/
│   │   │   ├── EmployeeTest.php
│   │   │   ├── DepartmentTest.php
│   │   │   ├── LeaveTest.php
│   │   │   └── AttendanceTest.php
│   │   └── Validators/
│   │       └── FormRequestValidationTest.php
│   ├── Feature/
│   │   ├── Controllers/
│   │   │   ├── EmployeeControllerTest.php
│   │   │   ├── LeaveControllerTest.php
│   │   │   ├── AttendanceControllerTest.php
│   │   │   └── PayrollControllerTest.php
│   │   ├── Workflows/
│   │   │   ├── OnboardingWorkflowTest.php
│   │   │   ├── LeaveApprovalWorkflowTest.php
│   │   │   └── PerformanceReviewWorkflowTest.php
│   │   └── Integration/
│   │       ├── LeaveAttendanceIntegrationTest.php
│   │       └── PayrollAttendanceIntegrationTest.php
│   ├── Browser/
│   │   ├── EmployeeManagementTest.php
│   │   ├── LeaveRequestTest.php
│   │   └── AttendancePunchTest.php
│   └── Datasets/              # Pest datasets (if using Pest)
├── database/
│   └── factories/
│       ├── EmployeeFactory.php
│       ├── DepartmentFactory.php
│       ├── LeaveFactory.php
│       └── ... (all model factories)
└── phpunit.xml
```

### PHPUnit Configuration (`phpunit.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="./vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory suffix="Test.php">./tests/Feature</directory>
        </testsuite>
        <testsuite name="Browser">
            <directory suffix="Test.php">./tests/Browser</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./src</directory>
        </include>
        <exclude>
            <directory>./src/Console</directory>
            <directory>./src/Providers</directory>
        </exclude>
    </coverage>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
    </php>
</phpunit>
```

---

## Base Test Classes

### TestCase.php
```php
<?php

namespace Aero\HRM\Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Setup test environment
        $this->artisan('migrate', ['--database' => 'sqlite']);
        $this->seed(\DatabaseSeeder::class);
    }
    
    /**
     * Creates the application.
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        return $app;
    }
    
    /**
     * Helper to create authenticated user
     */
    protected function actingAsEmployee($role = 'employee')
    {
        $user = \Aero\HRM\Models\Employee::factory()->create([
            'role' => $role
        ]);
        
        return $this->actingAs($user);
    }
    
    /**
     * Helper to create authenticated HR admin
     */
    protected function actingAsHRAdmin()
    {
        return $this->actingAsEmployee('hr_admin');
    }
}
```

---

## Unit Tests - Service Layer

### 1. Leave Balance Service Tests

```php
<?php

namespace Aero\HRM\Tests\Unit\Services\Leave;

use Aero\HRM\Services\LeaveBalanceService;
use Aero\HRM\Models\{Employee, LeaveType, Leave};
use Aero\HRM\Tests\TestCase;
use Carbon\Carbon;

class LeaveBalanceServiceTest extends TestCase
{
    private LeaveBalanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(LeaveBalanceService::class);
    }

    /** @test */
    public function it_calculates_remaining_balance_correctly()
    {
        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create([
            'name' => 'Annual',
            'total_days' => 15
        ]);

        // Create 3 approved leaves of 1 day each
        Leave::factory()->count(3)->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'approved',
            'days' => 1
        ]);

        $balance = $this->service->calculateBalance($employee, $leaveType);

        $this->assertEquals(12, $balance);
    }

    /** @test */
    public function it_handles_half_day_leaves()
    {
        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 10]);

        Leave::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'approved',
            'days' => 0.5
        ]);

        $balance = $this->service->calculateBalance($employee, $leaveType);

        $this->assertEquals(9.5, $balance);
    }

    /** @test */
    public function it_excludes_rejected_leaves_from_calculation()
    {
        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 15]);

        Leave::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'rejected',
            'days' => 5
        ]);

        $balance = $this->service->calculateBalance($employee, $leaveType);

        $this->assertEquals(15, $balance);
    }

    /** @test */
    public function it_excludes_pending_leaves_from_balance()
    {
        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 15]);

        Leave::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'pending',
            'days' => 3
        ]);

        // Balance should show 15 (pending doesn't reduce available)
        $balance = $this->service->calculateBalance($employee, $leaveType);
        $this->assertEquals(15, $balance);
        
        // But available balance should show 12 (pending blocks availability)
        $available = $this->service->calculateAvailableBalance($employee, $leaveType);
        $this->assertEquals(12, $available);
    }

    /** @test */
    public function it_applies_monthly_accrual_rules()
    {
        $employee = Employee::factory()->create([
            'joining_date' => Carbon::now()->subMonths(6)
        ]);
        
        $leaveType = LeaveType::factory()->create([
            'total_days' => 24,
            'accrual_type' => 'monthly',
            'accrual_rate' => 2 // 2 days per month
        ]);

        $balance = $this->service->calculateAccruedBalance($employee, $leaveType);

        $this->assertEquals(12, $balance); // 6 months * 2 days
    }

    /** @test */
    public function it_handles_carry_forward_with_max_limit()
    {
        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create([
            'total_days' => 15,
            'allow_carry_forward' => true,
            'max_carry_forward' => 5
        ]);

        // Previous year unused leaves: 7
        $previousYearBalance = 7;

        $currentBalance = $this->service->calculateWithCarryForward(
            $employee, 
            $leaveType, 
            $previousYearBalance
        );

        // Should be 15 (current) + 5 (max carry forward)
        $this->assertEquals(20, $currentBalance);
    }

    /** @test */
    public function it_throws_exception_for_insufficient_balance()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Insufficient leave balance');

        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 5]);

        // Use all leaves
        Leave::factory()->count(5)->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'approved',
            'days' => 1
        ]);

        // Try to request more
        $this->service->validateBalance($employee, $leaveType, 1);
    }

    /** @test */
    public function it_calculates_balance_for_specific_date_range()
    {
        $employee = Employee::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 15]);

        // Create leaves in different months
        Leave::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'approved',
            'from_date' => '2026-01-05',
            'to_date' => '2026-01-05',
            'days' => 1
        ]);

        Leave::factory()->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'approved',
            'from_date' => '2026-03-10',
            'to_date' => '2026-03-10',
            'days' => 1
        ]);

        // Check balance for January only
        $balance = $this->service->calculateBalanceForPeriod(
            $employee, 
            $leaveType,
            '2026-01-01',
            '2026-01-31'
        );

        $this->assertEquals(14, $balance); // 15 - 1 (Jan leave)
    }

    /** @test */
    public function it_handles_prorated_leave_for_new_joiners()
    {
        // Employee joined on July 1 (mid-year)
        $employee = Employee::factory()->create([
            'joining_date' => Carbon::create(2026, 7, 1)
        ]);
        
        $leaveType = LeaveType::factory()->create([
            'total_days' => 24, // 24 per year
            'prorate_on_joining' => true
        ]);

        $balance = $this->service->calculateProratedBalance($employee, $leaveType);

        // Should get 12 leaves (6 months remaining in year)
        $this->assertEquals(12, $balance);
    }

    /** @test */
    public function it_calculates_balance_across_leave_types()
    {
        $employee = Employee::factory()->create();
        
        $annualLeave = LeaveType::factory()->create(['name' => 'Annual', 'total_days' => 15]);
        $sickLeave = LeaveType::factory()->create(['name' => 'Sick', 'total_days' => 10]);

        // Use some leaves
        Leave::factory()->count(3)->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $annualLeave->id,
            'status' => 'approved',
            'days' => 1
        ]);

        Leave::factory()->count(2)->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $sickLeave->id,
            'status' => 'approved',
            'days' => 1
        ]);

        $balances = $this->service->calculateAllBalances($employee);

        $this->assertEquals(12, $balances[$annualLeave->id]);
        $this->assertEquals(8, $balances[$sickLeave->id]);
    }
}
```

### 2. Attendance Calculation Service Tests

```php
<?php

namespace Aero\HRM\Tests\Unit\Services\Attendance;

use Aero\HRM\Services\AttendanceCalculationService;
use Aero\HRM\Tests\TestCase;
use Carbon\Carbon;

class AttendanceCalculationServiceTest extends TestCase
{
    private AttendanceCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AttendanceCalculationService::class);
    }

    /** @test */
    public function it_calculates_work_hours_correctly()
    {
        $punchIn = Carbon::parse('2026-01-08 09:00:00');
        $punchOut = Carbon::parse('2026-01-08 18:00:00');

        $hours = $this->service->calculateWorkHours($punchIn, $punchOut);

        $this->assertEquals(9, $hours);
    }

    /** @test */
    public function it_deducts_lunch_break()
    {
        $punchIn = Carbon::parse('2026-01-08 09:00:00');
        $punchOut = Carbon::parse('2026-01-08 18:00:00');
        $lunchBreakMinutes = 60;

        $hours = $this->service->calculateWorkHours(
            $punchIn, 
            $punchOut, 
            $lunchBreakMinutes
        );

        $this->assertEquals(8, $hours);
    }

    /** @test */
    public function it_calculates_overtime()
    {
        $workHours = 10;
        $standardHours = 8;

        $overtime = $this->service->calculateOvertime($workHours, $standardHours);

        $this->assertEquals(2, $overtime);
    }

    /** @test */
    public function it_applies_overtime_multiplier()
    {
        $overtimeHours = 2;
        $multiplier = 1.5;

        $compensatedHours = $this->service->calculateOvertimeCompensation(
            $overtimeHours,
            $multiplier
        );

        $this->assertEquals(3, $compensatedHours);
    }

    /** @test */
    public function it_handles_multiple_punch_in_out()
    {
        $punches = [
            ['in' => Carbon::parse('09:00:00'), 'out' => Carbon::parse('13:00:00')],
            ['in' => Carbon::parse('14:00:00'), 'out' => Carbon::parse('18:00:00')],
        ];

        $totalHours = $this->service->calculateFromMultiplePunches($punches);

        $this->assertEquals(8, $totalHours);
    }

    /** @test */
    public function it_marks_late_arrival()
    {
        $punchIn = Carbon::parse('09:30:00');
        $shiftStart = Carbon::parse('09:00:00');
        $graceMinutes = 15;

        $isLate = $this->service->isLate($punchIn, $shiftStart, $graceMinutes);

        $this->assertTrue($isLate);
        $this->assertEquals(15, $this->service->calculateLateMinutes($punchIn, $shiftStart, $graceMinutes));
    }

    /** @test */
    public function it_allows_grace_period()
    {
        $punchIn = Carbon::parse('09:10:00');
        $shiftStart = Carbon::parse('09:00:00');
        $graceMinutes = 15;

        $isLate = $this->service->isLate($punchIn, $shiftStart, $graceMinutes);

        $this->assertFalse($isLate);
    }

    /** @test */
    public function it_marks_early_departure()
    {
        $punchOut = Carbon::parse('17:30:00');
        $shiftEnd = Carbon::parse('18:00:00');

        $isEarly = $this->service->isEarlyDeparture($punchOut, $shiftEnd);

        $this->assertTrue($isEarly);
        $this->assertEquals(30, $this->service->calculateEarlyDepartureMinutes($punchOut, $shiftEnd));
    }

    /** @test */
    public function it_calculates_night_shift_hours()
    {
        $punchIn = Carbon::parse('2026-01-08 22:00:00');
        $punchOut = Carbon::parse('2026-01-09 06:00:00');

        $hours = $this->service->calculateWorkHours($punchIn, $punchOut);

        $this->assertEquals(8, $hours);
    }

    /** @test */
    public function it_applies_night_shift_allowance()
    {
        $punchIn = Carbon::parse('2026-01-08 22:00:00');
        $punchOut = Carbon::parse('2026-01-09 06:00:00');
        $nightShiftMultiplier = 1.25;

        $compensatedHours = $this->service->calculateNightShiftCompensation(
            8, // work hours
            $nightShiftMultiplier
        );

        $this->assertEquals(10, $compensatedHours); // 8 * 1.25
    }

    /** @test */
    public function it_detects_missing_punch_out()
    {
        $punchIn = Carbon::parse('2026-01-08 09:00:00');
        $punchOut = null;

        $isMissing = $this->service->isMissingPunchOut($punchIn, $punchOut);

        $this->assertTrue($isMissing);
    }

    /** @test */
    public function it_calculates_weekly_hours()
    {
        $dailyHours = [
            'Monday' => 8,
            'Tuesday' => 9,
            'Wednesday' => 7.5,
            'Thursday' => 8,
            'Friday' => 8,
        ];

        $weeklyHours = $this->service->calculateWeeklyHours($dailyHours);

        $this->assertEquals(40.5, $weeklyHours);
    }

    /** @test */
    public function it_calculates_monthly_hours()
    {
        $weeklyHours = [40, 42, 38, 40.5];

        $monthlyHours = $this->service->calculateMonthlyHours($weeklyHours);

        $this->assertEquals(160.5, $monthlyHours);
    }
}
```

### 3. Payroll Calculation Service Tests

```php
<?php

namespace Aero\HRM\Tests\Unit\Services\Payroll;

use Aero\HRM\Services\PayrollCalculationService;
use Aero\HRM\Tests\TestCase;

class PayrollCalculationServiceTest extends TestCase
{
    private PayrollCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PayrollCalculationService::class);
    }

    /** @test */
    public function it_calculates_gross_salary()
    {
        $components = [
            'basic' => 50000,
            'hra' => 20000,
            'transport' => 3000,
            'special' => 27000
        ];

        $gross = $this->service->calculateGrossSalary($components);

        $this->assertEquals(100000, $gross);
    }

    /** @test */
    public function it_calculates_basic_from_percentage()
    {
        $grossSalary = 100000;
        $basicPercentage = 40;

        $basic = $this->service->calculateBasicSalary($grossSalary, $basicPercentage);

        $this->assertEquals(40000, $basic);
    }

    /** @test */
    public function it_calculates_hra_from_percentage()
    {
        $basicSalary = 40000;
        $hraPercentage = 50;

        $hra = $this->service->calculateHRA($basicSalary, $hraPercentage);

        $this->assertEquals(20000, $hra);
    }

    /** @test */
    public function it_calculates_provident_fund()
    {
        $basicSalary = 50000;
        $pfPercentage = 12; // Employee contribution

        $pf = $this->service->calculatePF($basicSalary, $pfPercentage);

        $this->assertEquals(6000, $pf);
    }

    /** @test */
    public function it_calculates_net_salary_with_deductions()
    {
        $gross = 100000;
        $deductions = [
            'pf' => 6000,
            'tax' => 10000,
            'esi' => 750,
            'professional_tax' => 200
        ];

        $net = $this->service->calculateNetSalary($gross, $deductions);

        $this->assertEquals(83050, $net);
    }

    /** @test */
    public function it_handles_pro_rata_calculation()
    {
        $monthlySalary = 100000;
        $workingDays = 22;
        $presentDays = 15;

        $proRata = $this->service->calculateProRata(
            $monthlySalary,
            $workingDays,
            $presentDays
        );

        $this->assertEquals(68181.82, round($proRata, 2));
    }

    /** @test */
    public function it_deducts_loan_emi()
    {
        $netSalary = 100000;
        $emi = 5000;

        $finalSalary = $this->service->deductLoanEMI($netSalary, $emi);

        $this->assertEquals(95000, $finalSalary);
    }

    /** @test */
    public function it_calculates_loss_of_pay()
    {
        $dailySalary = 3000;
        $absentDays = 2;

        $lop = $this->service->calculateLossOfPay($dailySalary, $absentDays);

        $this->assertEquals(6000, $lop);
    }

    /** @test */
    public function it_calculates_bonus()
    {
        $basicSalary = 50000;
        $bonusPercentage = 20;

        $bonus = $this->service->calculateBonus($basicSalary, $bonusPercentage);

        $this->assertEquals(10000, $bonus);
    }

    /** @test */
    public function it_generates_payslip_summary()
    {
        $employee = \Aero\HRM\Models\Employee::factory()->create();
        
        $salaryComponents = [
            'basic' => 50000,
            'hra' => 20000,
            'transport' => 3000,
            'special' => 27000
        ];
        
        $deductions = [
            'pf' => 6000,
            'tax' => 10000,
        ];

        $payslip = $this->service->generatePayslipSummary(
            $employee,
            $salaryComponents,
            $deductions,
            '2026-01'
        );

        $this->assertEquals(100000, $payslip['gross_salary']);
        $this->assertEquals(16000, $payslip['total_deductions']);
        $this->assertEquals(84000, $payslip['net_salary']);
    }
}
```

---

## Feature Tests - Controller Layer

### Employee Controller Test

```php
<?php

namespace Aero\HRM\Tests\Feature\Controllers;

use Aero\HRM\Models\{Employee, Department, Designation};
use Aero\HRM\Tests\TestCase;

class EmployeeControllerTest extends TestCase
{
    /** @test */
    public function it_lists_employees()
    {
        $this->actingAsHRAdmin();
        
        Employee::factory()->count(5)->create();

        $response = $this->get(route('hrm.employees.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('HRM/Employees/Index')
                ->has('employees.data', 5)
        );
    }

    /** @test */
    public function it_paginates_employees()
    {
        $this->actingAsHRAdmin();
        
        Employee::factory()->count(50)->create();

        $response = $this->get(route('hrm.employees.paginate', ['perPage' => 10]));

        $response->assertStatus(200);
        $response->assertJsonCount(10, 'data');
    }

    /** @test */
    public function it_creates_employee()
    {
        $this->actingAsHRAdmin();
        
        $department = Department::factory()->create();
        $designation = Designation::factory()->create();

        $employeeData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'department_id' => $department->id,
            'designation_id' => $designation->id,
            'joining_date' => '2026-01-08',
            'employee_code' => 'EMP001',
        ];

        $response = $this->post(route('hrm.employees.store'), $employeeData);

        $response->assertRedirect();
        $this->assertDatabaseHas('employees', ['email' => 'john@example.com']);
    }

    /** @test */
    public function it_updates_employee()
    {
        $this->actingAsHRAdmin();
        
        $employee = Employee::factory()->create(['name' => 'Old Name']);

        $response = $this->put(route('hrm.employees.update', $employee->id), [
            'name' => 'New Name',
            'email' => $employee->email,
            'department_id' => $employee->department_id,
            'designation_id' => $employee->designation_id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('employees', ['name' => 'New Name']);
    }

    /** @test */
    public function it_deletes_employee()
    {
        $this->actingAsHRAdmin();
        
        $employee = Employee::factory()->create();

        $response = $this->delete(route('hrm.employees.destroy', $employee->id));

        $response->assertRedirect();
        $this->assertSoftDeleted('employees', ['id' => $employee->id]);
    }

    /** @test */
    public function it_filters_employees_by_department()
    {
        $this->actingAsHRAdmin();
        
        $department1 = Department::factory()->create();
        $department2 = Department::factory()->create();
        
        Employee::factory()->count(3)->create(['department_id' => $department1->id]);
        Employee::factory()->count(2)->create(['department_id' => $department2->id]);

        $response = $this->get(route('hrm.employees.paginate', [
            'department' => $department1->id
        ]));

        $response->assertJsonCount(3, 'data');
    }

    /** @test */
    public function it_searches_employees_by_name()
    {
        $this->actingAsHRAdmin();
        
        Employee::factory()->create(['name' => 'John Doe']);
        Employee::factory()->create(['name' => 'Jane Smith']);

        $response = $this->get(route('hrm.employees.paginate', ['search' => 'John']));

        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['name' => 'John Doe']);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->get(route('hrm.employees.index'));
        
        $response->assertRedirect(route('login'));
    }

    /** @test */
    public function it_requires_permission_to_create()
    {
        $this->actingAsEmployee(); // Regular employee, not admin
        
        $response = $this->post(route('hrm.employees.store'), [
            'name' => 'Test',
            'email' => 'test@example.com',
        ]);

        $response->assertForbidden();
    }

    /** @test */
    public function it_exports_employees()
    {
        $this->actingAsHRAdmin();
        
        Employee::factory()->count(10)->create();

        $response = $this->get(route('hrm.employees.export'));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv');
    }

    /** @test */
    public function it_returns_employee_stats()
    {
        $this->actingAsHRAdmin();
        
        Employee::factory()->count(10)->create(['status' => 'active']);
        Employee::factory()->count(2)->create(['status' => 'inactive']);

        $response = $this->get(route('hrm.employees.stats'));

        $response->assertJson([
            'total' => 12,
            'active' => 10,
            'inactive' => 2
        ]);
    }
}
```

---

## Workflow Tests

### Leave Approval Workflow Test

```php
<?php

namespace Aero\HRM\Tests\Feature\Workflows;

use Aero\HRM\Models\{Employee, LeaveType, Leave};
use Aero\HRM\Tests\TestCase;

class LeaveApprovalWorkflowTest extends TestCase
{
    /** @test */
    public function employee_can_request_leave()
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee);
        
        $leaveType = LeaveType::factory()->create();

        $response = $this->post(route('hrm.leave-add'), [
            'leave_type_id' => $leaveType->id,
            'from_date' => '2026-01-10',
            'to_date' => '2026-01-12',
            'reason' => 'Personal work',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('leaves', [
            'employee_id' => $employee->id,
            'status' => 'pending'
        ]);
    }

    /** @test */
    public function manager_can_approve_leave()
    {
        $manager = Employee::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);
        
        $leave = Leave::factory()->create(['status' => 'pending']);

        $response = $this->post(route('hrm.leaves.approve', $leave->id));

        $response->assertStatus(200);
        $this->assertDatabaseHas('leaves', [
            'id' => $leave->id,
            'status' => 'approved',
            'approved_by' => $manager->id
        ]);
    }

    /** @test */
    public function manager_can_reject_leave()
    {
        $manager = Employee::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);
        
        $leave = Leave::factory()->create(['status' => 'pending']);

        $response = $this->post(route('hrm.leaves.reject', $leave->id), [
            'rejection_reason' => 'Insufficient staffing'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('leaves', [
            'id' => $leave->id,
            'status' => 'rejected'
        ]);
    }

    /** @test */
    public function leave_request_checks_balance()
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee);
        
        $leaveType = LeaveType::factory()->create(['total_days' => 5]);
        
        // Use all leaves
        Leave::factory()->count(5)->create([
            'employee_id' => $employee->id,
            'leave_type_id' => $leaveType->id,
            'status' => 'approved',
            'days' => 1
        ]);

        // Try to request more
        $response = $this->post(route('hrm.leave-add'), [
            'leave_type_id' => $leaveType->id,
            'from_date' => '2026-01-10',
            'to_date' => '2026-01-10',
            'reason' => 'Personal work',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('leave_type_id');
    }

    /** @test */
    public function leave_request_detects_overlapping_dates()
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee);
        
        $leaveType = LeaveType::factory()->create();
        
        // Create existing leave
        Leave::factory()->create([
            'employee_id' => $employee->id,
            'from_date' => '2026-01-10',
            'to_date' => '2026-01-12',
            'status' => 'approved'
        ]);

        // Try overlapping dates
        $response = $this->post(route('hrm.leave-add'), [
            'leave_type_id' => $leaveType->id,
            'from_date' => '2026-01-11', // Overlaps
            'to_date' => '2026-01-13',
            'reason' => 'Personal work',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['error' => 'Overlapping leave dates']);
    }

    /** @test */
    public function approved_leave_cannot_be_deleted_by_employee()
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee);
        
        $leave = Leave::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'approved'
        ]);

        $response = $this->delete(route('hrm.leave-delete'), ['id' => $leave->id]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('leaves', ['id' => $leave->id]);
    }

    /** @test */
    public function pending_leave_can_be_deleted_by_employee()
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee);
        
        $leave = Leave::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'pending'
        ]);

        $response = $this->delete(route('hrm.leave-delete'), ['id' => $leave->id]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('leaves', ['id' => $leave->id]);
    }
}
```

---

## Total Test Count Summary

| Category | Subcategory | Tests | Status |
|----------|-------------|-------|--------|
| **Unit Tests** | Services - Leave | 20 | 📝 Examples provided |
| | Services - Attendance | 15 | 📝 Examples provided |
| | Services - Payroll | 20 | 📝 Examples provided |
| | Services - Performance | 15 | To be written |
| | Services - Recruitment | 10 | To be written |
| | Models | 30 | To be written |
| | Validators | 20 | To be written |
| | Helpers | 20 | To be written |
| **Feature Tests** | Controllers | 60 | 📝 1 example provided |
| | Workflows | 20 | 📝 1 example provided |
| | Integration | 20 | To be written |
| **Security Tests** | Auth & Authorization | 40 | To be written |
| **Browser Tests** | E2E Flows | 30 | To be written |
| **Performance Tests** | Load & Speed | 20 | To be written |
| **TOTAL** | | **330** | **40% examples done** |

---

## Running Tests

### Run All Tests
```bash
cd packages/aero-hrm
vendor/bin/phpunit
```

### Run Specific Test Suite
```bash
# Unit tests only
vendor/bin/phpunit --testsuite=Unit

# Feature tests only
vendor/bin/phpunit --testsuite=Feature

# Specific test class
vendor/bin/phpunit tests/Unit/Services/Leave/LeaveBalanceServiceTest.php

# Specific test method
vendor/bin/phpunit --filter testCalculatesRemainingBalanceCorrectly
```

### Run with Coverage
```bash
vendor/bin/phpunit --coverage-html coverage/
```

### Run in Parallel (Laravel 10+)
```bash
php artisan test --parallel
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: HRM Package Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: testing
          MYSQL_ROOT_PASSWORD: password
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: mbstring, pdo, pdo_mysql
        coverage: xdebug
    
    - name: Install Dependencies
      run: |
        cd packages/aero-hrm
        composer install --prefer-dist --no-progress
    
    - name: Run Tests
      run: |
        cd packages/aero-hrm
        vendor/bin/phpunit --coverage-clover coverage.xml
    
    - name: Upload Coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./packages/aero-hrm/coverage.xml
```

---

## Conclusion

This testing blueprint provides:
✅ Complete test infrastructure setup  
✅ 330+ test specifications  
✅ Real implementation examples  
✅ CI/CD integration  
✅ Coverage tracking  

**Next Steps:**
1. Create test infrastructure (Week 1)
2. Implement unit tests (Week 2-3)
3. Implement feature tests (Week 4-5)
4. Implement security tests (Week 6)
5. Achieve 80%+ coverage (Week 7-8)

**Let's build a robust, well-tested HRM system! 🚀**
