<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EmployeeModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_employee_via_factory(): void
    {
        $employee = Employee::factory()->create();

        $this->assertInstanceOf(Employee::class, $employee);
        $this->assertNotNull($employee->id);
        $this->assertNotNull($employee->employee_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_department(): void
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create(['department_id' => $department->id]);

        $this->assertInstanceOf(Department::class, $employee->department);
        $this->assertEquals($department->id, $employee->department->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_designation(): void
    {
        $designation = Designation::factory()->create();
        $employee = Employee::factory()->create(['designation_id' => $designation->id]);

        $this->assertInstanceOf(Designation::class, $employee->designation);
        $this->assertEquals($designation->id, $employee->designation->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_direct_reports(): void
    {
        $manager = Employee::factory()->create();
        $reports = Employee::factory()->count(3)->create(['manager_id' => $manager->id]);

        $this->assertCount(3, $manager->directReports);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_attendances(): void
    {
        $employee = Employee::factory()->create();
        \Aero\HRM\Models\Attendance::factory()->count(5)->create(['employee_id' => $employee->id]);

        $this->assertCount(5, $employee->attendances);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_many_leaves(): void
    {
        $employee = Employee::factory()->create();
        \Aero\HRM\Models\Leave::factory()->count(3)->create(['employee_id' => $employee->id]);

        $this->assertCount(3, $employee->leaves);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_active_status_correctly(): void
    {
        $active = Employee::factory()->create(['employment_status' => 'active']);
        $inactive = Employee::factory()->create(['employment_status' => 'inactive']);

        $this->assertTrue($active->isActive());
        $this->assertFalse($inactive->isActive());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_generates_unique_employee_ids(): void
    {
        $e1 = Employee::factory()->create();
        $e2 = Employee::factory()->create();

        $this->assertNotEquals($e1->employee_id, $e2->employee_id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_filter_active_employees_by_scope(): void
    {
        Employee::factory()->count(4)->create(['employment_status' => 'active']);
        Employee::factory()->count(2)->create(['employment_status' => 'inactive']);

        $active = Employee::where('employment_status', 'active')->count();
        $this->assertEquals(4, $active);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_education_relationship(): void
    {
        $employee = Employee::factory()->create();
        \Aero\HRM\Models\Education::factory()->count(2)->create(['employee_id' => $employee->id]);

        $this->assertCount(2, $employee->education);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_work_experience_relationship(): void
    {
        $employee = Employee::factory()->create();
        \Aero\HRM\Models\Experience::factory()->count(2)->create(['employee_id' => $employee->id]);

        $this->assertCount(2, $employee->workExperience);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_emergency_contacts_relationship(): void
    {
        $employee = Employee::factory()->create();
        \Aero\HRM\Models\EmergencyContact::factory()->count(1)->create(['employee_id' => $employee->id]);

        $this->assertCount(1, $employee->emergencyContacts);
    }
}
