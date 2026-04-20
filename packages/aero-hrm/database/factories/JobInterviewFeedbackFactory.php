<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\JobInterviewFeedback;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobInterviewFeedback>
 */
class JobInterviewFeedbackFactory extends Factory
{
    protected $model = JobInterviewFeedback::class;

    public function definition(): array
    {
        return [
            'interview_id' => null,
            'interviewer_id' => null,
            'rating' => $this->faker->numberBetween(1, 5),
            'strengths' => $this->faker->paragraph(),
            'weaknesses' => $this->faker->paragraph(),
            'recommendation' => $this->faker->randomElement(['strong_yes', 'yes', 'neutral', 'no', 'strong_no']),
            'notes' => $this->faker->optional()->paragraph(),
        ];
    }
}
