<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TrainingFeedback;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingFeedback>
 */
class TrainingFeedbackFactory extends Factory
{
    protected $model = TrainingFeedback::class;

    public function definition(): array
    {
        return [
            'training_id' => null,
            'employee_id' => null,
            'overall_rating' => $this->faker->numberBetween(1, 5),
            'content_rating' => $this->faker->numberBetween(1, 5),
            'trainer_rating' => $this->faker->numberBetween(1, 5),
            'comments' => $this->faker->optional()->paragraph(),
            'suggestions' => $this->faker->optional()->sentence(),
        ];
    }
}
