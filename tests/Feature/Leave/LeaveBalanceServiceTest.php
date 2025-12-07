<?php

namespace Tests\Feature\Leave;

use App\Models\Tenant\HRM$1
use App\Models\Tenant\HRM$1
use App\Models\Shared\User;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveBalanceServiceTest extends TestCase
{
    use RefreshDatabase;

    private LeaveBalanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(LeaveBalanceService::class);
    }

    /**
     * Test initializing balances for a user.
     */
    public function test_can_initialize_balances_for_user(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $leaveSetting = LeaveSetting::factory()->create([
            'name' => 'Annual Leave',
            'code' => 'AL',
            'annual_quota' => 20,
            'is_active' => true,
        ]);

        $this->service->initializeBalancesForUser($user, 2025);

        $this->assertDatabaseHas('leave_balances', [
            'user_id' => $user->id,
            'leave_setting_id' => $leaveSetting->id,
            'year' => 2025,
            'allocated' => 20,
            'used' => 0,
            'available' => 20,
        ]);
    }

    /**
     * Test getting user balances.
     */
    public function test_can_get_user_balances(): void
    {
        $user = User::factory()->create();
        $leaveSetting = LeaveSetting::factory()->create([
            'annual_quota' => 15,
            'is_active' => true,
        ]);

        LeaveBalance::create([
            'user_id' => $user->id,
            'leave_setting_id' => $leaveSetting->id,
            'year' => 2025,
            'allocated' => 15,
            'used' => 5,
            'pending' => 2,
            'available' => 8,
            'carried_forward' => 0,
            'encashed' => 0,
        ]);

        $balance = $this->service->getBalance($user, $leaveSetting->id, 2025);

        $this->assertNotNull($balance);
        $this->assertEquals(15, $balance->allocated);
        $this->assertEquals(5, $balance->used);
        $this->assertEquals(8, $balance->available);
    }

    /**
     * Test checking sufficient balance.
     */
    public function test_can_check_sufficient_balance(): void
    {
        $user = User::factory()->create();
        $leaveSetting = LeaveSetting::factory()->create();

        LeaveBalance::create([
            'user_id' => $user->id,
            'leave_setting_id' => $leaveSetting->id,
            'year' => 2025,
            'allocated' => 10,
            'used' => 0,
            'pending' => 0,
            'available' => 10,
            'carried_forward' => 0,
            'encashed' => 0,
        ]);

        $this->assertTrue($this->service->hasSufficientBalance($user, $leaveSetting->id, 5, 2025));
        $this->assertFalse($this->service->hasSufficientBalance($user, $leaveSetting->id, 15, 2025));
    }

    /**
     * Test balance calculation logic.
     */
    public function test_balance_calculation(): void
    {
        $balance = new LeaveBalance([
            'allocated' => 20,
            'used' => 5,
            'pending' => 2,
            'carried_forward' => 3,
        ]);

        // available = allocated + carried_forward - used - pending
        // 20 + 3 - 5 - 2 = 16
        $this->assertEquals(16, $balance->calculateAvailable());
    }
}
