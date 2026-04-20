<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Recognition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Recognition>
 */
class RecognitionFactory extends Factory
{
    protected $model = Recognition::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'recognized_by' => null,
            'type' => $this->faker->randomElement(['kudos', 'badge', 'award', 'points']),
            'title' => $this->faker->sentence(3),
            'message' => $this->faker->paragraph(),
            'points' => $this->faker->randomElement([10, 25, 50, 100]),
            'is_public' => true,
        ];
    }
}
