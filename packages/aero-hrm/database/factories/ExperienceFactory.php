<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Experience;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Experience>
 */
class ExperienceFactory extends Factory
{
    protected $model = Experience::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'company_name' => $this->faker->company(),
            'designation' => $this->faker->jobTitle(),
            'department' => $this->faker->randomElement(['IT', 'HR', 'Finance', 'Marketing']),
            'start_date' => $this->faker->dateTimeBetween('-10 years', '-2 years'),
            'end_date' => $this->faker->optional()->dateTimeBetween('-2 years', 'now'),
            'description' => $this->faker->optional()->paragraph(),
            'is_current' => false,
        ];
    }

    public function current(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_current' => true,
            'end_date' => null,
        ]);
    }
}
