<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PayrollAllowance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayrollAllowance>
 */
class PayrollAllowanceFactory extends Factory
{
    protected $model = PayrollAllowance::class;

    public function definition(): array
    {
        return [
            'payroll_id' => null,
            'employee_id' => null,
            'name' => $this->faker->randomElement(['HRA', 'DA', 'Transport', 'Medical', 'Special']),
            'amount' => $this->faker->numberBetween(1000, 20000),
            'type' => $this->faker->randomElement(['fixed', 'percentage']),
        ];
    }
}
