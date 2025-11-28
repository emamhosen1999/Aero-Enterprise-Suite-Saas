<?php

namespace Tests\Feature\Controllers;

use App\Models\HRM\LeaveSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkLeaveControllerTest extends TestCase
{
    use RefreshDatabase;

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

        // Mock permissions (adjust based on your permission system)
        $this->actingAs($this->user);
    }

    public function test_requires_proper_permissions()
    {
        // Create a user without permissions
        $unauthorizedUser = User::factory()->create();

        $response = $this->actingAs($unauthorizedUser)
            ->postJson('/leaves/bulk/validate', [
                'user_id' => $this->user->id,
                'dates' => [Carbon::tomorrow()->format('Y-m-d')],
                'leave_type_id' => $this->leaveSetting->id,
                'reason' => 'Test unauthorized access',
            ]);

        $response->assertStatus(403);
    }

    public function test_validates_request_payload()
    {
        $response = $this->postJson('/leaves/bulk/validate', [
            // Missing required fields
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['dates', 'leave_type_id', 'reason']);
    }

    public function test_validate_endpoint_returns_proper_response()
    {
        $dates = [
            Carbon::tomorrow()->format('Y-m-d'),
            Carbon::tomorrow()->addDay()->format('Y-m-d'),
        ];

        $response = $this->postJson('/leaves/bulk/validate', [
            'user_id' => $this->user->id,
            'dates' => $dates,
            'leave_type_id' => $this->leaveSetting->id,
            'reason' => 'Test validation endpoint',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'validation_results' => [
                    '*' => [
                        'date',
                        'status',
                        'errors',
                        'warnings',
                    ],
                ],
                'estimated_balance_impact' => [
                    'leave_type',
                    'current_balance',
                    'requested_days',
                    'remaining_balance',
                ],
            ]);

        $this->assertTrue($response->json('success'));
        $this->assertCount(2, $response->json('validation_results'));
    }

    public function test_store_endpoint_creates_leaves_successfully()
    {
        $dates = [
            Carbon::tomorrow()->format('Y-m-d'),
            Carbon::tomorrow()->addDay()->format('Y-m-d'),
        ];

        $response = $this->postJson('/leaves/bulk', [
            'user_id' => $this->user->id,
            'dates' => $dates,
            'leave_type_id' => $this->leaveSetting->id,
            'reason' => 'Test bulk creation endpoint',
            'allow_partial_success' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'created_leaves',
                'failed_dates',
                'summary' => [
                    'total_requested',
                    'successful',
                    'failed',
                ],
                'leaves',
                'leavesData',
            ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals(2, $response->json('summary.successful'));
        $this->assertEquals(0, $response->json('summary.failed'));

        // Verify leaves were actually created in database
        $this->assertDatabaseCount('leaves', 2);
        foreach ($dates as $date) {
            $this->assertDatabaseHas('leaves', [
                'user_id' => $this->user->id,
                'from_date' => $date,
                'leave_type' => $this->leaveSetting->id,
                'reason' => 'Test bulk creation endpoint',
            ]);
        }
    }

    public function test_handles_validation_errors_gracefully()
    {
        // Try to create leave for past date
        $pastDate = Carbon::yesterday()->format('Y-m-d');

        $response = $this->postJson('/leaves/bulk', [
            'user_id' => $this->user->id,
            'dates' => [$pastDate],
            'leave_type_id' => $this->leaveSetting->id,
            'reason' => 'Test validation error handling',
            'allow_partial_success' => false,
        ]);

        $response->assertStatus(422);
        $this->assertFalse($response->json('success'));
        $this->assertEquals(0, $response->json('summary.successful'));
        $this->assertEquals(1, $response->json('summary.failed'));

        // Verify no leaves were created
        $this->assertDatabaseCount('leaves', 0);
    }

    public function test_partial_success_mode_works()
    {
        $pastDate = Carbon::yesterday()->format('Y-m-d');
        $futureDate = Carbon::tomorrow()->format('Y-m-d');

        $response = $this->postJson('/leaves/bulk', [
            'user_id' => $this->user->id,
            'dates' => [$pastDate, $futureDate],
            'leave_type_id' => $this->leaveSetting->id,
            'reason' => 'Test partial success mode',
            'allow_partial_success' => true,
        ]);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $this->assertEquals(1, $response->json('summary.successful'));
        $this->assertEquals(1, $response->json('summary.failed'));

        // Verify only valid leave was created
        $this->assertDatabaseCount('leaves', 1);
        $this->assertDatabaseHas('leaves', [
            'user_id' => $this->user->id,
            'from_date' => $futureDate,
        ]);
    }

    public function test_date_array_size_limits()
    {
        // Test with too many dates (more than 50)
        $dates = array_map(
            fn ($i) => Carbon::tomorrow()->addDays($i)->format('Y-m-d'),
            range(0, 51)
        );

        $response = $this->postJson('/leaves/bulk/validate', [
            'user_id' => $this->user->id,
            'dates' => $dates,
            'leave_type_id' => $this->leaveSetting->id,
            'reason' => 'Test too many dates',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['dates']);
    }
}
