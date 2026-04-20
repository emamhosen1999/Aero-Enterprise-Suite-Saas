<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Feedback360Response;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feedback360Response>
 */
class Feedback360ResponseFactory extends Factory
{
    protected $model = Feedback360Response::class;

    public function definition(): array
    {
        return [
            'feedback_id' => null,
            'reviewer_id' => null,
            'relationship' => $this->faker->randomElement(['manager', 'peer', 'direct_report', 'self']),
            'overall_rating' => $this->faker->numberBetween(1, 5),
            'overall_comment' => $this->faker->optional()->paragraph(),
            'submitted_at' => $this->faker->optional()->dateTime(),
        ];
    }
}
