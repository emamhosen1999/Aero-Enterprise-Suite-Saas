<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TrainingCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingCategory>
 */
class TrainingCategoryFactory extends Factory
{
    protected $model = TrainingCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Technical', 'Soft Skills', 'Compliance', 'Leadership', 'Safety', 'Product']),
            'description' => $this->faker->optional()->sentence(),
            'status' => 'active',
        ];
    }
}
