<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\ExpenseCategory;

class ExpenseCategoryFactory extends Factory
{
    protected $model = ExpenseCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Travel',
                'Food & Beverage',
                'Office Supplies',
                'Equipment',
                'Training',
                'Transportation',
                'Accommodation',
                'Communication',
                'Entertainment',
                'Miscellaneous',
            ]),
            'description' => $this->faker->sentence(),
            'max_amount' => $this->faker->optional(0.7)->randomFloat(2, 100, 5000),
            'requires_receipt' => $this->faker->boolean(70),
            'approval_level' => $this->faker->numberBetween(1, 3),
            'allowed_file_types' => json_encode(['pdf', 'jpg', 'png', 'jpeg']),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the category is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the category requires receipt.
     */
    public function requiresReceipt(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_receipt' => true,
        ]);
    }

    /**
     * Indicate that the category has no max amount limit.
     */
    public function noMaxAmount(): static
    {
        return $this->state(fn (array $attributes) => [
            'max_amount' => null,
        ]);
    }
}
