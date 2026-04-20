<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\OnboardingStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OnboardingStep>
 */
class OnboardingStepFactory extends Factory
{
    protected $model = OnboardingStep::class;

    public function definition(): array
    {
        return [
            'onboarding_id' => null,
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'order' => $this->faker->numberBetween(1, 10),
            'is_required' => true,
            'status' => $this->faker->randomElement(['pending', 'completed', 'skipped']),
            'completed_at' => $this->faker->optional()->dateTime(),
        ];
    }
}
