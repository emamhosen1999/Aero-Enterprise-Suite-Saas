<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\OffboardingStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OffboardingStep>
 */
class OffboardingStepFactory extends Factory
{
    protected $model = OffboardingStep::class;

    public function definition(): array
    {
        return [
            'offboarding_id' => null,
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'order' => $this->faker->numberBetween(1, 10),
            'is_required' => true,
            'status' => $this->faker->randomElement(['pending', 'completed', 'skipped']),
        ];
    }
}
