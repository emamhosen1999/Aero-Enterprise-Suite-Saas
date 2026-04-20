<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Benefit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Benefit>
 */
class BenefitFactory extends Factory
{
    protected $model = Benefit::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Health Insurance', 'Life Insurance', 'Dental Plan', 'Vision Plan', '401k Match', 'Gym Membership', 'Education Reimbursement']),
            'description' => $this->faker->paragraph(),
            'type' => $this->faker->randomElement(['insurance', 'retirement', 'wellness', 'education', 'other']),
            'cost' => $this->faker->randomFloat(2, 50, 500),
            'provider' => $this->faker->optional()->company(),
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }
}
