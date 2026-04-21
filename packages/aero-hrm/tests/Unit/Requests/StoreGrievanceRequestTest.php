<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Requests;

use Aero\HRM\Http\Requests\StoreGrievanceRequest;
use Aero\HRM\Models\Employee;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class StoreGrievanceRequestTest extends TestCase
{
    use RefreshDatabase;

    private function rules(): array
    {
        return (new StoreGrievanceRequest())->rules();
    }

    private function validate(array $data): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($data, $this->rules());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_passes_with_valid_grievance_data(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'subject' => 'Workplace harassment concern',
            'description' => 'Detailed description of the grievance filed by employee.',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_employee_id_is_missing(): void
    {
        $validator = $this->validate([
            'subject' => 'Workplace issue',
            'description' => 'A detailed description of the problem.',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('employee_id', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_subject_is_missing(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'description' => 'Detailed description here.',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('subject', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_description_is_missing(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'subject' => 'Valid subject line',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('description', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_priority_is_invalid(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'subject' => 'Valid subject line',
            'description' => 'Detailed description here.',
            'priority' => 'critical',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('priority', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_all_valid_priority_values(): void
    {
        $employee = Employee::factory()->create();

        foreach (['low', 'medium', 'high', 'urgent'] as $priority) {
            $validator = $this->validate([
                'employee_id' => $employee->id,
                'subject' => 'Valid subject line',
                'description' => 'Detailed description here.',
                'priority' => $priority,
            ]);

            $errors = $validator->errors()->toArray();
            $this->assertArrayNotHasKey('priority', $errors, "Failed for priority: {$priority}");
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_anonymous_grievance(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'subject' => 'Anonymous concern',
            'description' => 'Detailed description here.',
            'is_anonymous' => true,
        ]);

        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_subject_exceeds_max_length(): void
    {
        $employee = Employee::factory()->create();

        $validator = $this->validate([
            'employee_id' => $employee->id,
            'subject' => str_repeat('a', 256),
            'description' => 'Detailed description here.',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('subject', $validator->errors()->toArray());
    }
}
