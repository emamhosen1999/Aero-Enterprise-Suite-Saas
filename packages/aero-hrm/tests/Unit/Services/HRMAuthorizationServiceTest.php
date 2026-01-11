<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Services\HRMAuthorizationService;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Department;
use Aero\HRMAC\Services\RoleModuleAccessService;
use Aero\Core\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

/**
 * HRM Authorization Service Tests
 *
 * Validates that NO hardcoded role checks exist - all authorization via RoleModuleAccessService
 */
class HRMAuthorizationServiceTest extends TestCase
{
    use RefreshDatabase;

    private HRMAuthorizationService $service;
    private RoleModuleAccessService $mockRoleService;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock RoleModuleAccessService
        $this->mockRoleService = Mockery::mock(RoleModuleAccessService::class);
        $this->app->instance(RoleModuleAccessService::class, $this->mockRoleService);

        $this->service = app(HRMAuthorizationService::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_checks_module_access_via_role_service()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->mockRoleService
            ->shouldReceive('userCanAccessSubModule')
            ->with($user, 'hrm', 'leaves')
            ->once()
            ->andReturn(true);

        // Act
        $hasAccess = $this->service->hasModuleAccess($employee, 'leaves');

        // Assert
        $this->assertTrue($hasAccess);
    }

    /** @test */
    public function it_checks_module_action_via_role_service()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'leaves', 'manage')
            ->once()
            ->andReturn(true);

        // Act
        $canManage = $this->service->hasModuleAction($employee, 'leaves', 'manage');

        // Assert
        $this->assertTrue($canManage);
    }

    /** @test */
    public function it_checks_leave_management_permission()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'leaves', 'manage')
            ->once()
            ->andReturn(true);

        // Act
        $canManage = $this->service->canManageLeaves($employee);

        // Assert
        $this->assertTrue($canManage);
    }

    /** @test */
    public function it_checks_leave_approval_permission()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'leaves', 'approve')
            ->once()
            ->andReturn(true);

        // Act
        $canApprove = $this->service->canApproveLeave($employee);

        // Assert
        $this->assertTrue($canApprove);
    }

    /** @test */
    public function it_falls_back_to_manage_permission_for_approval()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Mock approve permission as false, but manage as true
        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'leaves', 'approve')
            ->once()
            ->andReturn(false);

        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'leaves', 'manage')
            ->once()
            ->andReturn(true);

        // Act
        $canApprove = $this->service->canApproveLeave($employee);

        // Assert
        $this->assertTrue($canApprove);
    }

    /** @test */
    public function it_identifies_department_manager()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);
        Department::factory()->create(['manager_id' => $user->id]);

        // Act
        $isManager = $this->service->isDepartmentManager($employee);

        // Assert
        $this->assertTrue($isManager);
    }

    /** @test */
    public function it_identifies_non_manager()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);
        // No departments with this manager

        // Act
        $isManager = $this->service->isDepartmentManager($employee);

        // Assert
        $this->assertFalse($isManager);
    }

    /** @test */
    public function it_checks_department_approval_permission()
    {
        // Arrange
        $user = User::factory()->create();
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'department_id' => $department->id,
        ]);

        // Make employee the department manager
        $department->manager_id = $user->id;
        $department->save();

        // Act
        $canApprove = $this->service->canApproveForDepartment($employee, $department->id);

        // Assert
        $this->assertTrue($canApprove);
    }

    /** @test */
    public function it_gets_managed_department_ids_for_manager()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);
        $department = Department::factory()->create(['manager_id' => $user->id]);

        // Act
        $departmentIds = $this->service->getManagedDepartmentIds($employee);

        // Assert
        $this->assertContains($department->id, $departmentIds);
    }

    /** @test */
    public function it_returns_empty_managed_departments_for_non_manager()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'employees', 'manage')
            ->once()
            ->andReturn(false);

        // Act
        $departmentIds = $this->service->getManagedDepartmentIds($employee);

        // Assert
        $this->assertEmpty($departmentIds);
    }

    /** @test */
    public function it_identifies_manager_with_direct_reports()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Create a direct report
        Employee::factory()->create(['manager_id' => $user->id]);

        // Act
        $isManager = $this->service->isManager($employee);

        // Assert
        $this->assertTrue($isManager);
    }

    /** @test */
    public function it_gets_managed_employee_ids()
    {
        // Arrange
        $user = User::factory()->create();
        $manager = Employee::factory()->create(['user_id' => $user->id]);

        $report1 = Employee::factory()->create(['manager_id' => $user->id]);
        $report2 = Employee::factory()->create(['manager_id' => $user->id]);

        $this->mockRoleService
            ->shouldReceive('userCanAccessAction')
            ->with($user, 'hrm', 'employees', 'manage')
            ->once()
            ->andReturn(false);

        // Act
        $employeeIds = $this->service->getManagedEmployeeIds($manager);

        // Assert
        $this->assertCount(2, $employeeIds);
        $this->assertContains($report1->id, $employeeIds);
        $this->assertContains($report2->id, $employeeIds);
    }

    /** @test */
    public function it_never_uses_hardcoded_role_checks()
    {
        // This is a meta-test to ensure the service never calls hasRole()
        // by checking that all methods use RoleModuleAccessService

        $reflection = new \ReflectionClass(HRMAuthorizationService::class);
        $source = file_get_contents($reflection->getFileName());

        // Assert
        $this->assertStringNotContainsString('hasRole', $source, 'Service should NOT use hasRole()');
        $this->assertStringNotContainsString("'admin'", $source, 'Service should NOT contain hardcoded admin role');
        $this->assertStringNotContainsString("'hr'", $source, 'Service should NOT contain hardcoded hr role');
        $this->assertStringNotContainsString("'HR'", $source, 'Service should NOT contain hardcoded HR role');
    }
}
