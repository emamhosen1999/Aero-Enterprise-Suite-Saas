<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\OffboardingTask;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OffboardingTask>
 */
class OffboardingTaskFactory extends Factory
{
    protected $model = OffboardingTask::class;

    public function definition(): array
    {
        return [
            'offboarding_id' => null,
            'title' => $this->faker->sentence(3),
            'assigned_to' => null,
            'due_date' => $this->faker->dateTimeBetween('now', '+2 weeks'),
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed']),
        ];
    }
}
