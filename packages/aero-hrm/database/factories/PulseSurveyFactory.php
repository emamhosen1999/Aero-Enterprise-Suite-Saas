<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PulseSurvey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PulseSurvey>
 */
class PulseSurveyFactory extends Factory
{
    protected $model = PulseSurvey::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->optional()->paragraph(),
            'start_date' => $this->faker->dateTimeBetween('now', '+1 week'),
            'end_date' => $this->faker->dateTimeBetween('+1 week', '+1 month'),
            'is_anonymous' => true,
            'status' => $this->faker->randomElement(['draft', 'active', 'closed']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
        ]);
    }
}
