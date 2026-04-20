<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\SafetyInspection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SafetyInspection>
 */
class SafetyInspectionFactory extends Factory
{
    protected $model = SafetyInspection::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'inspector_id' => null,
            'scheduled_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'location' => $this->faker->city(),
            'type' => $this->faker->randomElement(['routine', 'follow_up', 'spot_check', 'regulatory']),
            'findings' => $this->faker->optional()->paragraph(),
            'overall_rating' => $this->faker->optional()->randomElement(['pass', 'fail', 'conditional']),
            'status' => $this->faker->randomElement(['scheduled', 'in_progress', 'completed']),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'overall_rating' => 'fail',
        ]);
    }
}
