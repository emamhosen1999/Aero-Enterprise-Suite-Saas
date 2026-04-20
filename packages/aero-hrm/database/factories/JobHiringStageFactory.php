<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\JobHiringStage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobHiringStage>
 */
class JobHiringStageFactory extends Factory
{
    protected $model = JobHiringStage::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Applied', 'Screening', 'Phone Interview', 'Technical Interview', 'HR Interview', 'Offer', 'Hired']),
            'order' => $this->faker->numberBetween(1, 7),
            'is_default' => false,
            'color' => $this->faker->hexColor(),
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => ['is_default' => true]);
    }
}
