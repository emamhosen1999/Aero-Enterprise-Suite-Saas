<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\OnboardingTask;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OnboardingTask>
 */
class OnboardingTaskFactory extends Factory
{
    protected $model = OnboardingTask::class;

    public function definition(): array
    {
        return [
            'onboarding_id' => null,
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'assigned_to' => null,
            'due_date' => $this->faker->dateTimeBetween('now', '+2 weeks'),
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed']),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
        ];
    }
}
