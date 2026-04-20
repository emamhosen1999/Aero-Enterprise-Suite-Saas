<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\KPIValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<KPIValue>
 */
class KPIValueFactory extends Factory
{
    protected $model = KPIValue::class;

    public function definition(): array
    {
        return [
            'kpi_id' => null,
            'employee_id' => null,
            'actual_value' => $this->faker->numberBetween(20, 100),
            'period_start' => $this->faker->dateTimeBetween('-3 months', '-1 month'),
            'period_end' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
