<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TrainingMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingMaterial>
 */
class TrainingMaterialFactory extends Factory
{
    protected $model = TrainingMaterial::class;

    public function definition(): array
    {
        return [
            'training_id' => null,
            'title' => $this->faker->sentence(3),
            'type' => $this->faker->randomElement(['document', 'video', 'presentation', 'link']),
            'file_path' => $this->faker->optional()->filePath(),
            'url' => $this->faker->optional()->url(),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
