<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Competency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Competency>
 */
class CompetencyFactory extends Factory
{
    protected $model = Competency::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Technical Skills', 'Adaptability']),
            'description' => $this->faker->paragraph(),
            'category' => $this->faker->randomElement(['core', 'functional', 'leadership', 'technical']),
            'level_definitions' => null,
            'status' => 'active',
        ];
    }
}
