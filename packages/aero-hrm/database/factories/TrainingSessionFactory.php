<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TrainingSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingSession>
 */
class TrainingSessionFactory extends Factory
{
    protected $model = TrainingSession::class;

    public function definition(): array
    {
        return [
            'training_id' => null,
            'title' => $this->faker->sentence(3),
            'scheduled_date' => $this->faker->dateTimeBetween('+1 day', '+1 month'),
            'start_time' => $this->faker->time(),
            'end_time' => $this->faker->time(),
            'location' => $this->faker->optional()->city(),
            'max_participants' => $this->faker->numberBetween(10, 50),
            'status' => $this->faker->randomElement(['scheduled', 'completed', 'cancelled']),
        ];
    }
}
