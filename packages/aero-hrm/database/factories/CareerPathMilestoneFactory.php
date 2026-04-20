<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\CareerPathMilestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CareerPathMilestone>
 */
class CareerPathMilestoneFactory extends Factory
{
    protected $model = CareerPathMilestone::class;

    public function definition(): array
    {
        return [
            'career_path_id' => null,
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'order' => $this->faker->numberBetween(1, 10),
            'estimated_duration_months' => $this->faker->randomElement([6, 12, 18, 24]),
        ];
    }
}
