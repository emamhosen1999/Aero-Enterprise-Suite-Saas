<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TrainingEnrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingEnrollment>
 */
class TrainingEnrollmentFactory extends Factory
{
    protected $model = TrainingEnrollment::class;

    public function definition(): array
    {
        return [
            'training_id' => null,
            'employee_id' => null,
            'status' => $this->faker->randomElement(['enrolled', 'completed', 'cancelled', 'no_show']),
            'enrolled_at' => now(),
            'completed_at' => $this->faker->optional()->dateTimeBetween('now', '+1 month'),
            'feedback' => $this->faker->optional()->paragraph(),
            'rating' => $this->faker->optional()->numberBetween(1, 5),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'completed_at' => null,
        ]);
    }
}
