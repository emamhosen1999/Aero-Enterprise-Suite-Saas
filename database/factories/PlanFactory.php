<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->randomElement(['Starter', 'Professional', 'Enterprise', 'Ultimate']);
        $monthlyPrice = fake()->randomElement([29.00, 79.00, 149.00, 299.00]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'monthly_price' => $monthlyPrice,
            'yearly_price' => $monthlyPrice * 10, // 2 months free
            'setup_fee' => 0,
            'currency' => 'USD',
            'features' => [
                'modules' => ['core', 'hr'],
                'support' => 'email',
            ],
            'limits' => [
                'max_users' => fake()->randomElement([5, 25, 100, -1]),
                'max_storage_gb' => fake()->randomElement([10, 50, 200, -1]),
            ],
            'trial_days' => 14,
            'sort_order' => 0,
            'is_active' => true,
            'is_featured' => false,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
