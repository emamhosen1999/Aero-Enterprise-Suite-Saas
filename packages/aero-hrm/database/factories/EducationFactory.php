<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Education;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Education>
 */
class EducationFactory extends Factory
{
    protected $model = Education::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'degree' => $this->faker->randomElement(['Bachelor', 'Master', 'PhD', 'Diploma']),
            'institution' => $this->faker->company(),
            'field_of_study' => $this->faker->randomElement(['Computer Science', 'Business Administration', 'Engineering', 'Finance']),
            'start_year' => $this->faker->numberBetween(2000, 2020),
            'end_year' => $this->faker->optional()->numberBetween(2004, 2024),
            'grade' => $this->faker->optional()->randomElement(['A', 'B', 'C', 'Distinction', 'First Class']),
        ];
    }
}
