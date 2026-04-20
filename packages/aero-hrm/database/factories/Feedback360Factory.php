<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Feedback360;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feedback360>
 */
class Feedback360Factory extends Factory
{
    protected $model = Feedback360::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'review_cycle' => $this->faker->sentence(3),
            'deadline' => $this->faker->dateTimeBetween('+1 week', '+1 month'),
            'status' => $this->faker->randomElement(['draft', 'active', 'completed']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
