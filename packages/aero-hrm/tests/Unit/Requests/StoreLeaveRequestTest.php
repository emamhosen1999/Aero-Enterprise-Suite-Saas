<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Requests;

use Aero\HRM\Http\Requests\StoreLeaveRequest;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class StoreLeaveRequestTest extends TestCase
{
    use RefreshDatabase;

    private function rules(): array
    {
        return (new StoreLeaveRequest())->rules();
    }

    private function validate(array $data): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($data, $this->rules());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_passes_with_valid_leave_data(): void
    {
        $user = \Aero\HRM\Models\User::factory()->create();
        $leaveSetting = \Aero\HRM\Models\LeaveSetting::factory()->create();

        $validator = $this->validate([
            'user_id' => $user->id,
            'leave_type_id' => $leaveSetting->id,
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(3)->toDateString(),
            'reason' => 'Family vacation plans',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_user_id_is_missing(): void
    {
        $validator = $this->validate([
            'leave_type_id' => 1,
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(2)->toDateString(),
            'reason' => 'Need some rest',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('user_id', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_leave_type_id_is_missing(): void
    {
        $user = \Aero\HRM\Models\User::factory()->create();

        $validator = $this->validate([
            'user_id' => $user->id,
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(2)->toDateString(),
            'reason' => 'Need some rest',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('leave_type_id', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_reason_is_too_short(): void
    {
        $validator = $this->validate([
            'user_id' => 1,
            'leave_type_id' => 1,
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(2)->toDateString(),
            'reason' => 'Hi',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('reason', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_reason_is_missing(): void
    {
        $validator = $this->validate([
            'user_id' => 1,
            'leave_type_id' => 1,
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(2)->toDateString(),
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('reason', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_from_date_is_invalid(): void
    {
        $validator = $this->validate([
            'user_id' => 1,
            'leave_type_id' => 1,
            'from_date' => 'not-a-date',
            'to_date' => now()->addDays(2)->toDateString(),
            'reason' => 'Valid reason here',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('from_date', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_half_day_type_invalid(): void
    {
        $validator = $this->validate([
            'user_id' => 1,
            'leave_type_id' => 1,
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(1)->toDateString(),
            'reason' => 'Medical appointment',
            'half_day' => true,
            'half_day_type' => 'third_half',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('half_day_type', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_valid_half_day_types(): void
    {
        foreach (['first_half', 'second_half'] as $type) {
            $validator = $this->validate([
                'user_id' => 1,
                'leave_type_id' => 1,
                'from_date' => now()->addDays(1)->toDateString(),
                'to_date' => now()->addDays(1)->toDateString(),
                'reason' => 'Medical appointment',
                'half_day' => true,
                'half_day_type' => $type,
            ]);

            $errors = $validator->errors()->toArray();
            $this->assertArrayNotHasKey('half_day_type', $errors, "Failed for half_day_type: {$type}");
        }
    }
}
