<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\JobApplication;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobApplication>
 */
class JobApplicationFactory extends Factory
{
    protected $model = JobApplication::class;

    public function definition(): array
    {
        return [
            'job_id' => null,
            'applicant_name' => $this->faker->name(),
            'applicant_email' => $this->faker->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'experience_years' => $this->faker->numberBetween(0, 15),
            'current_salary' => $this->faker->numberBetween(20000, 100000),
            'expected_salary' => $this->faker->numberBetween(25000, 120000),
            'notice_period' => $this->faker->numberBetween(0, 90),
            'source' => $this->faker->randomElement(['website', 'referral', 'linkedin', 'indeed', 'other']),
            'status' => $this->faker->randomElement(['new', 'screening', 'interview', 'offered', 'hired', 'rejected']),
            'stage_id' => null,
        ];
    }

    public function hired(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'hired']);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'rejected']);
    }

    public function interviewing(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'interview']);
    }
}
