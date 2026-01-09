<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\ExpenseClaim;
use Packages\AeroHrm\Models\ExpenseCategory;
use Packages\AeroHrm\Models\Employee;

class ExpenseClaimFactory extends Factory
{
    protected $model = ExpenseClaim::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'expense_category_id' => ExpenseCategory::factory(),
            'claim_number' => 'EXP' . now()->format('Ym') . str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'amount' => $this->faker->randomFloat(2, 10, 2000),
            'claim_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'description' => $this->faker->sentence(),
            'notes' => $this->faker->optional()->paragraph(),
            'status' => 'draft',
            'submitted_at' => null,
            'approved_by' => null,
            'approved_at' => null,
            'rejected_by' => null,
            'rejected_at' => null,
            'rejection_reason' => null,
            'paid_at' => null,
            'payment_method' => null,
            'payment_reference' => null,
        ];
    }

    /**
     * Indicate that the claim is submitted.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);
    }

    /**
     * Indicate that the claim is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'submitted_at' => now()->subDays(3),
            'approved_by' => Employee::factory(),
            'approved_at' => now()->subDay(),
        ]);
    }

    /**
     * Indicate that the claim is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'submitted_at' => now()->subDays(3),
            'rejected_by' => Employee::factory(),
            'rejected_at' => now()->subDay(),
            'rejection_reason' => $this->faker->sentence(),
        ]);
    }

    /**
     * Indicate that the claim is paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'submitted_at' => now()->subDays(5),
            'approved_by' => Employee::factory(),
            'approved_at' => now()->subDays(2),
            'paid_at' => now(),
            'payment_method' => $this->faker->randomElement(['bank_transfer', 'cash', 'cheque']),
            'payment_reference' => 'PAY' . $this->faker->unique()->numberBetween(10000, 99999),
        ]);
    }

    /**
     * Indicate that the claim is pending approval.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'submitted_at' => now()->subDays(1),
        ]);
    }
}
