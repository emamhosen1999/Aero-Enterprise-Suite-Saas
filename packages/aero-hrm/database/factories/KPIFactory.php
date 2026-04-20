<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\KPI;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<KPI>
 */
class KPIFactory extends Factory
{
    protected $model = KPI::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'category' => $this->faker->randomElement(['quality', 'productivity', 'efficiency', 'customer_satisfaction']),
            'target_value' => $this->faker->numberBetween(50, 100),
            'unit' => $this->faker->randomElement(['percentage', 'count', 'currency', 'hours']),
            'weight' => $this->faker->randomFloat(2, 0.1, 1.0),
            'status' => 'active',
        ];
    }
}
