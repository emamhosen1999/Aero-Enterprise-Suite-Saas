<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\SuccessionCandidate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SuccessionCandidate>
 */
class SuccessionCandidateFactory extends Factory
{
    protected $model = SuccessionCandidate::class;

    public function definition(): array
    {
        return [
            'succession_plan_id' => null,
            'employee_id' => null,
            'readiness' => $this->faker->randomElement(['ready_now', 'ready_1_year', 'ready_2_years', 'development_needed']),
            'development_notes' => $this->faker->optional()->paragraph(),
            'ranking' => $this->faker->optional()->numberBetween(1, 5),
        ];
    }
}
