<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\WorkforcePlanPosition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkforcePlanPosition>
 */
class WorkforcePlanPositionFactory extends Factory
{
    protected $model = WorkforcePlanPosition::class;

    public function definition(): array
    {
        return [
            'workforce_plan_id' => null,
            'designation_id' => null,
            'count' => $this->faker->numberBetween(1, 5),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'critical']),
            'justification' => $this->faker->optional()->sentence(),
        ];
    }
}
