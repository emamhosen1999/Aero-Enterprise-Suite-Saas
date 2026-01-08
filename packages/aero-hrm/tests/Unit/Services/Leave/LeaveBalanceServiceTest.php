<?php

namespace Aero\HRM\Tests\Unit\Services\Leave;

use Aero\HRM\Services\LeaveBalanceService;
use Aero\HRM\Models\{Leave, LeaveType};
use Aero\Core\Models\User;
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
        $user = User::factory()->create();
        $leaveType = LeaveType::factory()->create([
            'name' => 'Annual',
            'total_days' => 15
        ]);

        // Create 3 approved leaves of 1 day each
        Leave::factory()->count(3)->create([
            'user_id' => $user->id,
            'leave_type' => $leaveType->name,
            'status' => 'approved',
            'no_of_days' => 1
        ]);

        $balance = $this->service->calculateBalance($user, $leaveType);

        $this->assertEquals(12, $balance);
    }

    /** @test */
    public function it_handles_half_day_leaves()
    {
        $user = User::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 10]);

        Leave::factory()->halfDay()->create([
            'user_id' => $user->id,
            'leave_type' => $leaveType->name,
            'status' => 'approved',
        ]);

        $balance = $this->service->calculateBalance($user, $leaveType);

        $this->assertEquals(9.5, $balance);
    }

    /** @test */
    public function it_excludes_rejected_leaves_from_calculation()
    {
        $user = User::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 15]);

        Leave::factory()->rejected()->create([
            'user_id' => $user->id,
            'leave_type' => $leaveType->name,
            'no_of_days' => 5
        ]);

        $balance = $this->service->calculateBalance($user, $leaveType);

        $this->assertEquals(15, $balance);
    }

    /** @test */
    public function it_excludes_pending_leaves_from_balance()
    {
        $user = User::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 15]);

        Leave::factory()->create([
            'user_id' => $user->id,
            'leave_type' => $leaveType->name,
            'status' => 'pending',
            'no_of_days' => 3
        ]);

        // Balance should show 15 (pending doesn't reduce total)
        $balance = $this->service->calculateBalance($user, $leaveType);
        $this->assertEquals(15, $balance);
        
        // But available balance should show 12 (pending blocks availability)
        $available = $this->service->calculateAvailableBalance($user, $leaveType);
        $this->assertEquals(12, $available);
    }

    /** @test */
    public function it_throws_exception_for_insufficient_balance()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Insufficient leave balance');

        $user = User::factory()->create();
        $leaveType = LeaveType::factory()->create(['total_days' => 5]);

        // Use all leaves
        Leave::factory()->count(5)->create([
            'user_id' => $user->id,
            'leave_type' => $leaveType->name,
            'status' => 'approved',
            'no_of_days' => 1
        ]);

        // Try to request more
        $this->service->validateBalance($user, $leaveType, 1);
    }

    /** @test */
    public function it_calculates_balance_across_leave_types()
    {
        $user = User::factory()->create();
        
        $annualLeave = LeaveType::factory()->create(['name' => 'Annual', 'total_days' => 15]);
        $sickLeave = LeaveType::factory()->create(['name' => 'Sick', 'total_days' => 10]);

        // Use some leaves
        Leave::factory()->count(3)->create([
            'user_id' => $user->id,
            'leave_type' => $annualLeave->name,
            'status' => 'approved',
            'no_of_days' => 1
        ]);

        Leave::factory()->count(2)->create([
            'user_id' => $user->id,
            'leave_type' => $sickLeave->name,
            'status' => 'approved',
            'no_of_days' => 1
        ]);

        $balances = $this->service->calculateAllBalances($user);

        $this->assertEquals(12, $balances[$annualLeave->name]);
        $this->assertEquals(8, $balances[$sickLeave->name]);
    }
}
