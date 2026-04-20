<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\CareerPath;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CareerPath>
 */
class CareerPathFactory extends Factory
{
    protected $model = CareerPath::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'department_id' => null,
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
