<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Policies;

use Aero\Core\Models\User;
use Aero\HRM\Models\Employee;
use Aero\HRM\Policies\EmployeePolicy;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class EmployeePolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function makePolicy(): EmployeePolicy
    {
        return new EmployeePolicy();
    }

    private function makeUserWithSuperAdmin(): User
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('hasRole')->andReturn(true);
        $user->shouldReceive('getAttribute')->with('id')->andReturn(1);

        return $user;
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_instantiates_employee_policy(): void
    {
        $policy = $this->makePolicy();
        $this->assertInstanceOf(EmployeePolicy::class, $policy);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function policy_has_view_any_method(): void
    {
        $policy = $this->makePolicy();
        $this->assertTrue(method_exists($policy, 'viewAny'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function policy_has_view_method(): void
    {
        $policy = $this->makePolicy();
        $this->assertTrue(method_exists($policy, 'view'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function policy_has_create_method(): void
    {
        $policy = $this->makePolicy();
        $this->assertTrue(method_exists($policy, 'create'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function policy_has_update_method(): void
    {
        $policy = $this->makePolicy();
        $this->assertTrue(method_exists($policy, 'update'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function policy_has_delete_method(): void
    {
        $policy = $this->makePolicy();
        $this->assertTrue(method_exists($policy, 'delete'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function employee_owner_can_view_own_record(): void
    {
        $user = User::factory()->create();
        $employee = Employee::factory()->create(['user_id' => $user->id]);

        $policy = $this->makePolicy();

        // Employee can view their own record (user_id matches user->id)
        $result = $policy->view($user, $employee);
        $this->assertTrue($result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function employee_cannot_view_another_employees_record_without_permission(): void
    {
        $user = User::factory()->create();
        $otherEmployee = Employee::factory()->create(['user_id' => null]);

        $policy = $this->makePolicy();

        // User doesn't own this employee record, and has no HRMAC permissions
        // canPerformAction will return false for user with no roles
        $result = $policy->view($user, $otherEmployee);
        $this->assertFalse($result);
    }
}
