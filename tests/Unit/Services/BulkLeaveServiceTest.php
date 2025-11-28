<?php

namespace Tests\Unit\Services;

use App\Models\HRM\Leave;
use App\Models\HRM\LeaveSetting;
use App\Models\User;
use App\Services\Leave\BulkLeaveService;
use App\Services\Leave\LeaveCrudService;
use App\Services\Leave\LeaveOverlapService;
use App\Services\Leave\LeaveValidationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkLeaveServiceTest extends TestCase
{
    use RefreshDatabase;

    private BulkLeaveService $bulkLeaveService;

    private User $user;

    private LeaveSetting $leaveSetting;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->leaveSetting = LeaveSetting::factory()->create([
            'type' => 'Annual',
            'days' => 20,
        ]);

        $this->bulkLeaveService = new BulkLeaveService(
            $this->app->make(LeaveValidationService::class),
            $this->app->make(LeaveOverlapService::class),
            $this->app->make(LeaveCrudService::class)
        );
    }

    public function test_validates_individual_dates_correctly()
    {
        $payload = [
            'user_id' => $this->user->id,
            'leave_type_id' => $this->leaveSetting->id,
            'dates' => [
                Carbon::tomorrow()->format('Y-m-d'),
                Carbon::tomorrow()->addDay()->format('Y-m-d'),
            ],
            'reason' => 'Test bulk leave request',
        ];

        $result = $this->bulkLeaveService->validateDates($payload);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('validation_results', $result);
        $this->assertArrayHasKey('estimated_balance_impact', $result);
        $this->assertCount(2, $result['validation_results']);

        foreach ($result['validation_results'] as $dateResult) {
            $this->assertEquals('valid', $dateResult['status']);
            $this->assertEmpty($dateResult['errors']);
        }
    }

    public function test_handles_overlapping_leaves_properly()
    {
        $futureDate = Carbon::tomorrow();

        // Create an existing leave for tomorrow
        Leave::create([
            'user_id' => $this->user->id,
            'leave_type' => $this->leaveSetting->id,
            'from_date' => $futureDate,
            'to_date' => $futureDate,
            'no_of_days' => 1,
            'reason' => 'Existing leave',
            'status' => 'Approved',
        ]);

        $payload = [
            'user_id' => $this->user->id,
            'leave_type_id' => $this->leaveSetting->id,
            'dates' => [$futureDate->format('Y-m-d')],
            'reason' => 'Test overlapping leave',
        ];

        $result = $this->bulkLeaveService->validateDates($payload);

        $this->assertEquals('conflict', $result['validation_results'][0]['status']);
        $this->assertNotEmpty($result['validation_results'][0]['errors']);
    }

    public function test_respects_leave_balance_limits()
    {
        $payload = [
            'user_id' => $this->user->id,
            'leave_type_id' => $this->leaveSetting->id,
            'dates' => array_map(
                fn ($i) => Carbon::tomorrow()->addDays($i)->format('Y-m-d'),
                range(0, 24) // 25 days - more than the 20 days allowed
            ),
            'reason' => 'Test balance limit',
        ];

        $result = $this->bulkLeaveService->validateDates($payload);
        $balanceImpact = $result['estimated_balance_impact'];

        $this->assertEquals(20, $balanceImpact['current_balance']);
        $this->assertEquals(25, $balanceImpact['requested_days']);
        $this->assertEquals(-5, $balanceImpact['remaining_balance']);
    }

    public function test_transaction_rollback_on_failure()
    {
        $pastDate = Carbon::yesterday()->format('Y-m-d');
        $futureDate = Carbon::tomorrow()->format('Y-m-d');

        $payload = [
            'user_id' => $this->user->id,
            'leave_type_id' => $this->leaveSetting->id,
            'dates' => [$pastDate, $futureDate], // Past date should cause failure
            'reason' => 'Test transaction rollback',
            'allow_partial_success' => false,
        ];

        $result = $this->bulkLeaveService->processBulkLeave($payload);

        $this->assertFalse($result['success']);
        $this->assertEquals(0, $result['summary']['successful']);
        $this->assertEquals(0, Leave::where('user_id', $this->user->id)->count());
    }

    public function test_partial_success_mode_handling()
    {
        $pastDate = Carbon::yesterday()->format('Y-m-d');
        $futureDate = Carbon::tomorrow()->format('Y-m-d');

        $payload = [
            'user_id' => $this->user->id,
            'leave_type_id' => $this->leaveSetting->id,
            'dates' => [$pastDate, $futureDate], // Past date should fail, future should succeed
            'reason' => 'Test partial success',
            'allow_partial_success' => true,
        ];

        $result = $this->bulkLeaveService->processBulkLeave($payload);

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['summary']['successful']);
        $this->assertEquals(1, $result['summary']['failed']);
        $this->assertEquals(1, Leave::where('user_id', $this->user->id)->count());
    }

    public function test_all_valid_dates_succeeds_and_creates_leaves()
    {
        $dates = [
            Carbon::tomorrow()->format('Y-m-d'),
            Carbon::tomorrow()->addDay()->format('Y-m-d'),
            Carbon::tomorrow()->addDays(2)->format('Y-m-d'),
        ];

        $payload = [
            'user_id' => $this->user->id,
            'leave_type_id' => $this->leaveSetting->id,
            'dates' => $dates,
            'reason' => 'Test successful bulk creation',
            'allow_partial_success' => false,
        ];

        $result = $this->bulkLeaveService->processBulkLeave($payload);

        $this->assertTrue($result['success']);
        $this->assertEquals(3, $result['summary']['successful']);
        $this->assertEquals(0, $result['summary']['failed']);
        $this->assertEquals(3, Leave::where('user_id', $this->user->id)->count());

        // Verify each leave was created with correct data
        foreach ($dates as $date) {
            $leave = Leave::where('user_id', $this->user->id)
                ->where('from_date', $date)
                ->first();

            $this->assertNotNull($leave);
            $this->assertEquals($this->leaveSetting->id, $leave->leave_type);
            $this->assertEquals('Test successful bulk creation', $leave->reason);
            $this->assertEquals('New', $leave->status);
        }
    }
}
