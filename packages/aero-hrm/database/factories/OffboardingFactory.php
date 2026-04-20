<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Offboarding;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Offboarding>
 */
class OffboardingFactory extends Factory
{
    protected $model = Offboarding::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'last_working_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'reason' => $this->faker->randomElement(['resignation', 'termination', 'retirement', 'mutual_agreement']),
            'exit_interview_completed' => false,
            'assets_returned' => false,
            'status' => $this->faker->randomElement(['initiated', 'in_progress', 'completed']),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'exit_interview_completed' => true,
            'assets_returned' => true,
        ]);
    }
}
