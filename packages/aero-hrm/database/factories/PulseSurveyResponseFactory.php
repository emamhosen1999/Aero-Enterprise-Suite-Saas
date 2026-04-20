<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PulseSurveyResponse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PulseSurveyResponse>
 */
class PulseSurveyResponseFactory extends Factory
{
    protected $model = PulseSurveyResponse::class;

    public function definition(): array
    {
        return [
            'survey_id' => null,
            'employee_id' => null,
            'responses' => [
                ['question' => $this->faker->sentence(), 'answer' => $this->faker->sentence(), 'rating' => $this->faker->numberBetween(1, 5)],
                ['question' => $this->faker->sentence(), 'answer' => $this->faker->sentence(), 'rating' => $this->faker->numberBetween(1, 5)],
                ['question' => $this->faker->sentence(), 'answer' => $this->faker->sentence(), 'rating' => $this->faker->numberBetween(1, 5)],
            ],
            'submitted_at' => now(),
        ];
    }
}
