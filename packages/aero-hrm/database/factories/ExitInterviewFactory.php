<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\ExitInterview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExitInterview>
 */
class ExitInterviewFactory extends Factory
{
    protected $model = ExitInterview::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'interviewer_id' => null,
            'scheduled_date' => $this->faker->dateTimeBetween('now', '+2 weeks'),
            'interview_type' => $this->faker->randomElement(['in_person', 'video', 'phone', 'written']),
            'overall_satisfaction' => $this->faker->optional()->numberBetween(1, 5),
            'reason_for_leaving' => $this->faker->optional()->randomElement(['better_opportunity', 'compensation', 'management', 'work_life_balance', 'career_growth', 'relocation', 'personal']),
            'would_recommend' => $this->faker->optional()->boolean(),
            'feedback' => $this->faker->optional()->paragraphs(2, true),
            'status' => $this->faker->randomElement(['scheduled', 'completed', 'cancelled']),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'overall_satisfaction' => $this->faker->numberBetween(1, 5),
            'feedback' => $this->faker->paragraphs(2, true),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
