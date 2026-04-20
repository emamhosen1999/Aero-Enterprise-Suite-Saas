<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\WorkforcePlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkforcePlan>
 */
class WorkforcePlanFactory extends Factory
{
    protected $model = WorkforcePlan::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'department_id' => null,
            'fiscal_year' => date('Y'),
            'planned_headcount' => $this->faker->numberBetween(5, 100),
            'current_headcount' => $this->faker->numberBetween(3, 90),
            'budget' => $this->faker->randomFloat(2, 100000, 1000000),
            'description' => $this->faker->optional()->paragraph(),
            'status' => $this->faker->randomElement(['draft', 'submitted', 'approved', 'rejected']),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }
}
