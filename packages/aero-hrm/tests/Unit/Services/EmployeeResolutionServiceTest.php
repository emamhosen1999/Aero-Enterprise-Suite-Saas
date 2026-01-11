<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Services\EmployeeResolutionService;
use Aero\HRM\Models\Employee;
use Aero\HRM\Exceptions\UserNotOnboardedException;
use Aero\Core\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Employee Resolution Service Tests
 *
 * Validates that HRM correctly enforces Employee-only access
 */
class EmployeeResolutionServiceTest extends TestCase
{
    use RefreshDatabase;

    private EmployeeResolutionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(EmployeeResolutionService::class);
    }

    /** @test */
    public function it_resolves_employee_from_user_id()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Act
        $resolved = $this->service->resolveFromUserId($user->id);

        // Assert
        $this->assertEquals($employee->id, $resolved->id);
        $this->assertEquals($user->id, $resolved->user_id);
    }

    /** @test */
    public function it_throws_exception_when_user_not_onboarded()
    {
        // Arrange
        $user = User::factory()->create();
        // No Employee record created

        // Act & Assert
        $this->expectException(UserNotOnboardedException::class);
        $this->expectExceptionMessage('User ID '.$user->id.' is not onboarded as an Employee');

        $this->service->resolveFromUserId($user->id);
    }

    /** @test */
    public function it_checks_if_user_has_employee()
    {
        // Arrange
        $userWithEmployee = User::factory()->create();
        Employee::factory()->create(['user_id' => $userWithEmployee->id]);

        $userWithoutEmployee = User::factory()->create();

        // Act & Assert
        $this->assertTrue($this->service->hasEmployee($userWithEmployee->id));
        $this->assertFalse($this->service->hasEmployee($userWithoutEmployee->id));
    }

    /** @test */
    public function it_resolves_employee_or_returns_null()
    {
        // Arrange
        $userWithEmployee = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $userWithEmployee->id]);

        $userWithoutEmployee = User::factory()->create();

        // Act
        $resolved = $this->service->resolveOrNull($userWithEmployee->id);
        $notResolved = $this->service->resolveOrNull($userWithoutEmployee->id);

        // Assert
        $this->assertNotNull($resolved);
        $this->assertEquals($employee->id, $resolved->id);
        $this->assertNull($notResolved);
    }

    /** @test */
    public function it_resolves_multiple_employees()
    {
        // Arrange
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create(); // No employee

        $employee1 = Employee::factory()->create(['user_id' => $user1->id]);
        $employee2 = Employee::factory()->create(['user_id' => $user2->id]);

        // Act
        $resolved = $this->service->resolveBulk([$user1->id, $user2->id, $user3->id]);

        // Assert
        $this->assertCount(2, $resolved);
        $this->assertTrue($resolved->contains('id', $employee1->id));
        $this->assertTrue($resolved->contains('id', $employee2->id));
    }

    /** @test */
    public function it_eagerly_loads_relationships()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Act
        $resolved = $this->service->resolveFromUserId($user->id, withRelations: true);

        // Assert
        $this->assertTrue($resolved->relationLoaded('department'));
        $this->assertTrue($resolved->relationLoaded('designation'));
        $this->assertTrue($resolved->relationLoaded('user'));
    }

    /** @test */
    public function it_resolves_employee_by_employee_code()
    {
        // Arrange
        $employee = Employee::factory()->create(['employee_code' => 'EMP001']);

        // Act
        $resolved = $this->service->resolveByEmployeeCode('EMP001');

        // Assert
        $this->assertEquals($employee->id, $resolved->id);
    }

    /** @test */
    public function it_throws_exception_for_nonexistent_employee_code()
    {
        // Act & Assert
        $this->expectException(UserNotOnboardedException::class);
        $this->expectExceptionMessage('Employee with code NONEXISTENT not found');

        $this->service->resolveByEmployeeCode('NONEXISTENT');
    }

    /** @test */
    public function it_gets_employee_statistics()
    {
        // Arrange
        Employee::factory()->count(5)->create(['status' => 'active']);
        Employee::factory()->count(2)->create(['status' => 'inactive']);
        Employee::factory()->create([
            'status' => 'active',
            'probation_end_date' => now()->addMonths(2),
        ]);

        // Act
        $stats = $this->service->getStatistics();

        // Assert
        $this->assertEquals(8, $stats['total']);
        $this->assertEquals(6, $stats['active']);
        $this->assertEquals(1, $stats['on_probation']);
    }

    /** @test */
    public function it_clears_cache_for_employee()
    {
        // Arrange
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        // Act - Cache it first
        $this->service->resolveFromUserId($user->id);

        // Clear cache
        $this->service->clearCache($user->id);

        // Assert - Should still resolve (from database)
        $resolved = $this->service->resolveFromUserId($user->id);
        $this->assertEquals($employee->id, $resolved->id);
    }
}
