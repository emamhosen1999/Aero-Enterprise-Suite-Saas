<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PayrollDeduction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PayrollDeduction>
 */
class PayrollDeductionFactory extends Factory
{
    protected $model = PayrollDeduction::class;

    public function definition(): array
    {
        return [
            'payroll_id' => null,
            'employee_id' => null,
            'name' => $this->faker->randomElement(['PF', 'ESI', 'Tax', 'Professional Tax', 'Loan EMI']),
            'amount' => $this->faker->numberBetween(500, 10000),
            'type' => $this->faker->randomElement(['fixed', 'percentage']),
        ];
    }
}
