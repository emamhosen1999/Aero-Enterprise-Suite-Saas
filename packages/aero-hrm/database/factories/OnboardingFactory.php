<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Onboarding;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Onboarding>
 */
class OnboardingFactory extends Factory
{
    protected $model = Onboarding::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'template_name' => $this->faker->optional()->sentence(3),
            'start_date' => $this->faker->dateTimeBetween('now', '+1 week'),
            'expected_completion' => $this->faker->dateTimeBetween('+1 week', '+1 month'),
            'status' => $this->faker->randomElement(['not_started', 'in_progress', 'completed']),
            'progress_percentage' => $this->faker->numberBetween(0, 100),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'progress_percentage' => 100,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'progress_percentage' => $this->faker->numberBetween(10, 90),
        ]);
    }
}
