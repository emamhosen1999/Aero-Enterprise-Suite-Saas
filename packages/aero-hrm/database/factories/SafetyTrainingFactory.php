<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\SafetyTraining;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SafetyTraining>
 */
class SafetyTrainingFactory extends Factory
{
    protected $model = SafetyTraining::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'training_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'location' => $this->faker->city(),
            'instructor' => $this->faker->name(),
            'max_participants' => $this->faker->numberBetween(10, 50),
            'status' => $this->faker->randomElement(['scheduled', 'completed']),
        ];
    }
}
