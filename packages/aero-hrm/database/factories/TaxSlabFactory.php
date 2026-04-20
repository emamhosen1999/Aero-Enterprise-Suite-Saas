<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TaxSlab;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaxSlab>
 */
class TaxSlabFactory extends Factory
{
    protected $model = TaxSlab::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'min_amount' => $this->faker->numberBetween(0, 500000),
            'max_amount' => $this->faker->numberBetween(500001, 1500000),
            'rate' => $this->faker->numberBetween(5, 30),
            'fiscal_year' => now()->year,
            'status' => 'active',
        ];
    }

    public function highIncome(): static
    {
        return $this->state(fn (array $attributes) => [
            'min_amount' => 1500001,
            'max_amount' => 5000000,
            'rate' => 30,
        ]);
    }
}
