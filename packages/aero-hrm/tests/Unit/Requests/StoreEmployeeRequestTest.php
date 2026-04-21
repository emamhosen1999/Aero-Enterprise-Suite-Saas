<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Requests;

use Aero\HRM\Http\Requests\StoreEmployeeRequest;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class StoreEmployeeRequestTest extends TestCase
{
    use RefreshDatabase;

    private function rules(): array
    {
        return (new StoreEmployeeRequest())->rules();
    }

    private function validate(array $data): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($data, $this->rules());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_passes_with_valid_required_fields(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full_time',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_first_name_missing(): void
    {
        $validator = $this->validate([
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full_time',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('first_name', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_email_is_invalid(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'not-an-email',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full_time',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_employment_type_is_invalid(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'freelancer',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('employment_type', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_date_of_joining_is_invalid(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'date_of_joining' => 'not-a-date',
            'employment_type' => 'full_time',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('date_of_joining', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_gender_is_invalid(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full_time',
            'gender' => 'unknown',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('gender', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_all_valid_employment_types(): void
    {
        $types = ['full_time', 'part_time', 'contract', 'intern'];

        foreach ($types as $type) {
            $validator = $this->validate([
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'email' => "jane.{$type}@example.com",
                'date_of_joining' => now()->toDateString(),
                'employment_type' => $type,
            ]);
            $this->assertFalse($validator->fails(), "Failed for type: {$type}");
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_basic_salary_is_negative(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full_time',
            'basic_salary' => -100,
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('basic_salary', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_last_name_missing(): void
    {
        $validator = $this->validate([
            'first_name' => 'John',
            'email' => 'john@example.com',
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full_time',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('last_name', $validator->errors()->toArray());
    }
}
