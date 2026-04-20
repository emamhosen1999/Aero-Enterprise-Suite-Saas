<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\SalaryComponent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalaryComponent>
 */
class SalaryComponentFactory extends Factory
{
    protected $model = SalaryComponent::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Basic', 'HRA', 'DA', 'Medical', 'Transport', 'Bonus', 'PF', 'ESI']),
            'code' => strtoupper($this->faker->unique()->word()),
            'type' => $this->faker->randomElement(['earning', 'deduction']),
            'calculation_type' => $this->faker->randomElement(['fixed', 'percentage']),
            'amount' => $this->faker->numberBetween(1000, 50000),
            'percentage' => null,
            'is_taxable' => $this->faker->boolean(),
            'is_mandatory' => $this->faker->boolean(),
            'status' => 'active',
        ];
    }
}
