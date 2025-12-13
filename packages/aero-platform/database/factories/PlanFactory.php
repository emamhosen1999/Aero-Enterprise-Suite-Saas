<?php

namespace Aero\Platform\Database\Factories;

use Aero\Platform\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for creating Plan models.
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\Platform\Models\Plan>
 */
class PlanFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Plan::class;

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
                'modules' => ['core', 'hrm'],
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
            'duration_in_months' => 1,
            'max_users' => fake()->randomElement([5, 25, 100, 0]),
            'max_storage_gb' => fake()->randomElement([10, 50, 200, 0]),
        ];
    }

    /**
     * Indicate that the plan is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the plan is featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Create a yearly plan variant.
     */
    public function yearly(): static
    {
        return $this->state(fn (array $attributes) => [
            'duration_in_months' => 12,
        ]);
    }

    /**
     * Create a free trial plan.
     */
    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Free',
            'slug' => 'free',
            'monthly_price' => 0,
            'yearly_price' => 0,
            'trial_days' => 0,
            'max_users' => 3,
            'max_storage_gb' => 1,
        ]);
    }
}
