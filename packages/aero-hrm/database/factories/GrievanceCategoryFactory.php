<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\GrievanceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GrievanceCategory>
 */
class GrievanceCategoryFactory extends Factory
{
    protected $model = GrievanceCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Harassment', 'Discrimination', 'Work Conditions', 'Compensation', 'Management', 'Policy', 'Safety', 'Other']),
            'description' => $this->faker->optional()->sentence(),
            'status' => 'active',
        ];
    }
}
