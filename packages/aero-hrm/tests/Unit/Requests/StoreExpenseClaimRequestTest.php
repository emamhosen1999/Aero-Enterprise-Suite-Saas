<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Requests;

use Aero\HRM\Http\Requests\StoreExpenseClaimRequest;
use Aero\HRM\Models\ExpenseCategory;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class StoreExpenseClaimRequestTest extends TestCase
{
    use RefreshDatabase;

    private function rules(): array
    {
        return (new StoreExpenseClaimRequest())->rules();
    }

    private function validate(array $data): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($data, $this->rules());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_passes_with_valid_expense_data(): void
    {
        $category = ExpenseCategory::factory()->create();

        $validator = $this->validate([
            'title' => 'Business trip expenses',
            'category_id' => $category->id,
            'amount' => 150.00,
            'expense_date' => now()->toDateString(),
        ]);

        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_title_is_missing(): void
    {
        $category = ExpenseCategory::factory()->create();

        $validator = $this->validate([
            'category_id' => $category->id,
            'amount' => 50.00,
            'expense_date' => now()->toDateString(),
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('title', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_amount_is_zero_or_negative(): void
    {
        $category = ExpenseCategory::factory()->create();

        foreach ([0, -5] as $amount) {
            $validator = $this->validate([
                'title' => 'Test expense',
                'category_id' => $category->id,
                'amount' => $amount,
                'expense_date' => now()->toDateString(),
            ]);

            $this->assertTrue($validator->fails(), "Expected failure for amount: {$amount}");
            $this->assertArrayHasKey('amount', $validator->errors()->toArray());
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_expense_date_is_in_the_future(): void
    {
        $category = ExpenseCategory::factory()->create();

        $validator = $this->validate([
            'title' => 'Future expense',
            'category_id' => $category->id,
            'amount' => 100.00,
            'expense_date' => now()->addDays(5)->toDateString(),
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('expense_date', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_category_id_is_missing(): void
    {
        $validator = $this->validate([
            'title' => 'Test expense',
            'amount' => 100.00,
            'expense_date' => now()->toDateString(),
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('category_id', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_amount_is_missing(): void
    {
        $category = ExpenseCategory::factory()->create();

        $validator = $this->validate([
            'title' => 'Test expense',
            'category_id' => $category->id,
            'expense_date' => now()->toDateString(),
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('amount', $validator->errors()->toArray());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_accepts_optional_description(): void
    {
        $category = ExpenseCategory::factory()->create();

        $validator = $this->validate([
            'title' => 'Test expense',
            'category_id' => $category->id,
            'amount' => 100.00,
            'expense_date' => now()->toDateString(),
            'description' => 'Taxi to airport and back',
        ]);

        $this->assertFalse($validator->fails());
    }
}
