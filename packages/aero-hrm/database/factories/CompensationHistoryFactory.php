<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\CompensationHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompensationHistory>
 */
class CompensationHistoryFactory extends Factory
{
    protected $model = CompensationHistory::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'previous_salary' => $this->faker->randomFloat(2, 20000, 80000),
            'new_salary' => $this->faker->randomFloat(2, 22000, 100000),
            'change_type' => $this->faker->randomElement(['increment', 'promotion', 'market_adjustment']),
            'effective_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'reason' => $this->faker->optional()->sentence(),
        ];
    }
}
