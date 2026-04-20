<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\CompensationReview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompensationReview>
 */
class CompensationReviewFactory extends Factory
{
    protected $model = CompensationReview::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'review_period_start' => $this->faker->dateTimeBetween('-6 months', '-3 months'),
            'review_period_end' => $this->faker->dateTimeBetween('-3 months', 'now'),
            'budget' => $this->faker->randomFloat(2, 50000, 500000),
            'department_id' => null,
            'description' => $this->faker->optional()->paragraph(),
            'status' => $this->faker->randomElement(['draft', 'in_progress', 'completed', 'approved']),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
