<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Grade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade E']),
            'code' => $this->faker->unique()->lexify('G??'),
            'min_salary' => $this->faker->numberBetween(20000, 50000),
            'max_salary' => $this->faker->numberBetween(50001, 150000),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
