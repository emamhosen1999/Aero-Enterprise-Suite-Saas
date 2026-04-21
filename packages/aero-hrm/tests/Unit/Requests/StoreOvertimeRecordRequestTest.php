<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Requests;

use Aero\HRM\Http\Requests\StoreOvertimeRecordRequest;
use Aero\HRM\Models\Employee;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class StoreOvertimeRecordRequestTest extends TestCase
{
    use RefreshDatabase;

    private function rules(): array
    {
        return (new StoreOvertimeRecordRequest())->rules();
    }

    private function validate(array $data): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($data, $this->rules());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_passes_with_valid_overtime_data(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => 3,
            'reason' => 'Project deadline completion',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_employee_id_missing(): void
    {
        $validator = $this->validate([
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => 3,
            'reason' => 'Deadline work',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('employee_id', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_hours_too_low(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => 0.1,
            'reason' => 'Some work',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('hours', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_hours_exceeds_24(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => 25,
            'reason' => 'Some work',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('hours', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_reason_is_missing(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => 3,
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('reason', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_overtime_type_is_invalid(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => 3,
            'reason' => 'Deadline work',
            'type' => 'special',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('type', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_all_valid_overtime_types(): void
    {
        $employee = Employee::factory()->create();

        foreach (['regular', 'weekend', 'holiday'] as $type) {
            $validator = $this->validate([
                'employee_id' => $employee->id,
                'date' => now()->toDateString(),
                'start_time' => '18:00',
                'end_time' => '21:00',
                'hours' => 3,
                'reason' => 'Deadline work',
                'type' => $type,
            ]);

            $errors = $validator->errors()->toArray();
            $this->assertArrayNotHasKey('type', $errors, "Failed for type: {$type}");
        }
    }
}
