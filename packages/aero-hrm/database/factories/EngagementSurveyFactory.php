<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\EngagementSurvey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EngagementSurvey>
 */
class EngagementSurveyFactory extends Factory
{
    protected $model = EngagementSurvey::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'start_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'end_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'status' => $this->faker->randomElement(['draft', 'active', 'closed']),
            'is_anonymous' => true,
        ];
    }
}
