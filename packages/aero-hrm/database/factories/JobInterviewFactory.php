<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\JobInterview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobInterview>
 */
class JobInterviewFactory extends Factory
{
    protected $model = JobInterview::class;

    public function definition(): array
    {
        return [
            'application_id' => null,
            'scheduled_at' => $this->faker->dateTimeBetween('+1 day', '+2 weeks'),
            'duration_minutes' => $this->faker->randomElement([30, 45, 60, 90]),
            'type' => $this->faker->randomElement(['phone', 'video', 'in_person', 'panel']),
            'location' => $this->faker->optional()->city(),
            'meeting_link' => $this->faker->optional()->url(),
            'status' => $this->faker->randomElement(['scheduled', 'completed', 'cancelled']),
            'notes' => $this->faker->optional()->paragraph(),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'completed']);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'cancelled']);
    }
}
