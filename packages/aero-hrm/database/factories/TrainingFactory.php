<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Training;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Training>
 */
class TrainingFactory extends Factory
{
    protected $model = Training::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('+1 week', '+1 month');
        $endDate = $this->faker->dateTimeBetween('+1 month', '+2 months');

        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'category_id' => null,
            'trainer_name' => $this->faker->name(),
            'training_type' => $this->faker->randomElement(['online', 'classroom', 'workshop', 'webinar', 'on_the_job']),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'max_participants' => $this->faker->randomElement([10, 20, 30, 50]),
            'location' => $this->faker->optional()->city(),
            'cost' => $this->faker->randomFloat(2, 100, 5000),
            'is_mandatory' => $this->faker->boolean(),
            'status' => $this->faker->randomElement(['draft', 'scheduled', 'in_progress', 'completed']),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    public function mandatory(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_mandatory' => true,
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
        ]);
    }
}
