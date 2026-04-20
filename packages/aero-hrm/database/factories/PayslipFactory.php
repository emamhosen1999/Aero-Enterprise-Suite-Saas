<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Payslip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payslip>
 */
class PayslipFactory extends Factory
{
    protected $model = Payslip::class;

    public function definition(): array
    {
        return [
            'payroll_id' => null,
            'employee_id' => null,
            'basic_salary' => $this->faker->numberBetween(20000, 100000),
            'gross_salary' => $this->faker->numberBetween(25000, 120000),
            'total_deductions' => $this->faker->numberBetween(2000, 20000),
            'net_salary' => $this->faker->numberBetween(18000, 100000),
            'month' => $this->faker->numberBetween(1, 12),
            'year' => now()->year,
            'generated_at' => now(),
            'status' => $this->faker->randomElement(['generated', 'sent', 'acknowledged']),
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'sent']);
    }

    public function acknowledged(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'acknowledged']);
    }
}
