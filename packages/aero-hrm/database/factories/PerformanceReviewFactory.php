<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PerformanceReview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerformanceReview>
 */
class PerformanceReviewFactory extends Factory
{
    protected $model = PerformanceReview::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'reviewer_id' => null,
            'review_period_start' => $this->faker->dateTimeBetween('-6 months', '-3 months'),
            'review_period_end' => $this->faker->dateTimeBetween('-3 months', 'now'),
            'type' => $this->faker->randomElement(['annual', 'quarterly', 'probation']),
            'overall_rating' => $this->faker->optional()->randomFloat(1, 1, 5),
            'strengths' => $this->faker->optional()->paragraph(),
            'improvements' => $this->faker->optional()->paragraph(),
            'status' => $this->faker->randomElement(['draft', 'in_progress', 'completed']),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'overall_rating' => $this->faker->randomFloat(1, 1, 5),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'overall_rating' => null,
        ]);
    }
}
