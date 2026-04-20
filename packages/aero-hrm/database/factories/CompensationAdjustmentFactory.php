<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\CompensationAdjustment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompensationAdjustment>
 */
class CompensationAdjustmentFactory extends Factory
{
    protected $model = CompensationAdjustment::class;

    public function definition(): array
    {
        $currentSalary = $this->faker->randomFloat(2, 20000, 100000);

        return [
            'employee_id' => null,
            'review_id' => null,
            'adjustment_type' => $this->faker->randomElement(['salary_increase', 'bonus', 'promotion', 'market_adjustment']),
            'current_salary' => $currentSalary,
            'new_salary' => $this->faker->randomFloat(2, 22000, 120000),
            'effective_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'reason' => $this->faker->paragraph(),
            'percentage_change' => $this->faker->randomFloat(2, 2, 20),
        ];
    }
}
