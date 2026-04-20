<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Job;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Job>
 */
class JobFactory extends Factory
{
    protected $model = Job::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->jobTitle(),
            'department_id' => null,
            'designation_id' => null,
            'job_type' => $this->faker->randomElement(['full_time', 'part_time', 'contract']),
            'experience_min' => $this->faker->numberBetween(0, 3),
            'experience_max' => $this->faker->numberBetween(3, 10),
            'salary_min' => $this->faker->numberBetween(20000, 50000),
            'salary_max' => $this->faker->numberBetween(50001, 120000),
            'positions' => $this->faker->numberBetween(1, 5),
            'location' => $this->faker->city(),
            'description' => $this->faker->paragraphs(3, true),
            'requirements' => $this->faker->paragraphs(2, true),
            'deadline' => $this->faker->dateTimeBetween('+1 week', '+3 months'),
            'status' => $this->faker->randomElement(['draft', 'published']),
            'is_remote' => $this->faker->boolean(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'published']);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'closed']);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'draft']);
    }
}
