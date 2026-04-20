<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\SuccessionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SuccessionPlan>
 */
class SuccessionPlanFactory extends Factory
{
    protected $model = SuccessionPlan::class;

    public function definition(): array
    {
        return [
            'position' => $this->faker->jobTitle(),
            'department_id' => null,
            'current_holder_id' => null,
            'criticality' => $this->faker->randomElement(['low', 'medium', 'high', 'critical']),
            'status' => $this->faker->randomElement(['draft', 'active', 'archived']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'criticality' => 'critical',
        ]);
    }
}
