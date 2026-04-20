<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Payroll;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payroll>
 */
class PayrollFactory extends Factory
{
    protected $model = Payroll::class;

    public function definition(): array
    {
        return [
            'month' => $this->faker->numberBetween(1, 12),
            'year' => now()->year,
            'status' => $this->faker->randomElement(['draft', 'processing', 'completed', 'locked']),
            'total_earnings' => $this->faker->numberBetween(10000, 500000),
            'total_deductions' => $this->faker->numberBetween(1000, 50000),
            'net_pay' => $this->faker->numberBetween(8000, 450000),
            'department_id' => null,
            'processed_by' => null,
            'processed_at' => null,
        ];
    }

    public function locked(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'locked',
            'processed_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'processed_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'processed_at' => null,
        ]);
    }
}
