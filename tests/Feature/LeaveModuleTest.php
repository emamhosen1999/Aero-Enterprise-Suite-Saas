<?php

namespace Tests\Feature;

use App\Models\HRM\Leave;
use App\Models\HRM\LeaveSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveModuleTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected $leaveSetting;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test user
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Create a leave setting
        $this->leaveSetting = LeaveSetting::create([
            'type' => 'Annual Leave',
            'days' => 20,
            'eligibility' => 'All employees',
            'carry_forward' => true,
            'earned_leave' => false,
        ]);
    }

    /** @test */
    public function it_can_create_a_leave_application()
    {
        $this->actingAs($this->user);

        $leaveData = [
            'user_id' => $this->user->id,
            'leaveType' => $this->leaveSetting->type,
            'fromDate' => now()->addDays(7)->format('Y-m-d'),
            'toDate' => now()->addDays(9)->format('Y-m-d'),
            'daysCount' => 3,
            'leaveReason' => 'Need some time off for personal matters.',
        ];

        $response = $this->postJson(route('leave-add'), $leaveData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'leave' => [
                    'id',
                    'user_id',
                    'leave_type',
                    'from_date',
                    'to_date',
                    'no_of_days',
                    'reason',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('leaves', [
            'user_id' => $this->user->id,
            'no_of_days' => 3,
            'status' => 'New',
        ]);
    }

    /** @test */
    public function it_can_retrieve_leave_records()
    {
        $this->actingAs($this->user);

        // Create some test leave records
        Leave::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'leave_type' => $this->leaveSetting->id,
        ]);

        $response = $this->getJson(route('leaves.paginate'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'leaves' => [
                    'data' => [
                        '*' => [
                            'id',
                            'user_id',
                            'leave_type',
                            'from_date',
                            'to_date',
                            'no_of_days',
                            'reason',
                            'status',
                        ],
                    ],
                ],
                'leavesData' => [
                    'leaveTypes',
                    'leaveCountsByUser',
                ],
            ]);
    }

    /** @test */
    public function it_can_update_a_leave_application()
    {
        $this->actingAs($this->user);

        $leave = Leave::factory()->create([
            'user_id' => $this->user->id,
            'leave_type' => $this->leaveSetting->id,
            'status' => 'New',
        ]);

        $updateData = [
            'id' => $leave->id,
            'user_id' => $this->user->id,
            'leaveType' => $this->leaveSetting->type,
            'fromDate' => now()->addDays(10)->format('Y-m-d'),
            'toDate' => now()->addDays(12)->format('Y-m-d'),
            'daysCount' => 3,
            'leaveReason' => 'Updated reason for leave request.',
            'status' => 'New',
        ];

        $response = $this->postJson(route('leave-update'), $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'leave',
            ]);

        $this->assertDatabaseHas('leaves', [
            'id' => $leave->id,
            'reason' => 'Updated reason for leave request.',
        ]);
    }

    /** @test */
    public function it_can_delete_a_leave_application()
    {
        $this->actingAs($this->user);

        $leave = Leave::factory()->create([
            'user_id' => $this->user->id,
            'leave_type' => $this->leaveSetting->id,
        ]);

        $response = $this->deleteJson(route('leave-delete'), [
            'id' => $leave->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        $this->assertDatabaseMissing('leaves', [
            'id' => $leave->id,
        ]);
    }

    /** @test */
    public function it_validates_leave_application_data()
    {
        $this->actingAs($this->user);

        // Test with invalid data
        $invalidData = [
            'user_id' => 'invalid',
            'leaveType' => 'NonexistentType',
            'fromDate' => 'invalid-date',
            'toDate' => 'invalid-date',
            'daysCount' => -1,
            'leaveReason' => 'short', // Too short
        ];

        $response = $this->postJson(route('leave-add'), $invalidData);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'errors',
                'message',
            ]);
    }

    /** @test */
    public function it_handles_empty_leave_data_correctly()
    {
        $this->actingAs($this->user);

        $response = $this->getJson(route('leaves.paginate'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'leaves',
                'leavesData',
                'message', // Should include empty state message
            ]);
    }

    /** @test */
    public function it_checks_for_overlapping_leaves()
    {
        $this->actingAs($this->user);

        // Create an existing leave
        Leave::factory()->create([
            'user_id' => $this->user->id,
            'leave_type' => $this->leaveSetting->id,
            'from_date' => now()->addDays(5),
            'to_date' => now()->addDays(7),
        ]);

        // Try to create an overlapping leave
        $overlappingData = [
            'user_id' => $this->user->id,
            'leaveType' => $this->leaveSetting->type,
            'fromDate' => now()->addDays(6)->format('Y-m-d'),
            'toDate' => now()->addDays(8)->format('Y-m-d'),
            'daysCount' => 3,
            'leaveReason' => 'This should be rejected due to overlap.',
        ];

        $response = $this->postJson(route('leave-add'), $overlappingData);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'error',
                'message',
            ]);
    }
}
