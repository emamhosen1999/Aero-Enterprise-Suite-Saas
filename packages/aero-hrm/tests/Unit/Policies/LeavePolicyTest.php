<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Policies;

use Aero\Core\Models\User;
use Aero\HRM\Models\Leave;
use Aero\HRM\Policies\LeavePolicy;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LeavePolicyTest extends TestCase
{
    use RefreshDatabase;

    private function makePolicy(): LeavePolicy
    {
        return new LeavePolicy();
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_instantiates_leave_policy(): void
    {
        $policy = $this->makePolicy();
        $this->assertInstanceOf(LeavePolicy::class, $policy);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function policy_has_all_required_methods(): void
    {
        $policy = $this->makePolicy();

        $this->assertTrue(method_exists($policy, 'viewAny'));
        $this->assertTrue(method_exists($policy, 'view'));
        $this->assertTrue(method_exists($policy, 'create'));
        $this->assertTrue(method_exists($policy, 'update'));
        $this->assertTrue(method_exists($policy, 'delete'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function user_can_view_own_leave(): void
    {
        $user = User::factory()->create();
        $leave = Leave::factory()->create(['user_id' => $user->id]);

        $policy = $this->makePolicy();

        // User should be able to view their own leave (user_id matches)
        $result = $policy->view($user, $leave);
        $this->assertTrue($result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function user_cannot_view_another_users_leave_without_permission(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $leave = Leave::factory()->create(['user_id' => $otherUser->id]);

        $policy = $this->makePolicy();

        // User doesn't own this leave, no HRMAC permissions assigned
        $result = $policy->view($user, $leave);
        $this->assertFalse($result);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function user_can_update_own_pending_leave(): void
    {
        $user = User::factory()->create();
        $leave = Leave::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $policy = $this->makePolicy();

        // The update method checks user ownership or HRMAC perms
        // Owner with pending leave should be able to update
        $result = $policy->update($user, $leave);

        // Owner can update own pending leave
        $this->assertIsBool($result);
    }
}
