<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\SafetyIncident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SafetyIncident>
 */
class SafetyIncidentFactory extends Factory
{
    protected $model = SafetyIncident::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraphs(2, true),
            'incident_date' => $this->faker->dateTimeBetween('-3 months', 'now'),
            'location' => $this->faker->city(),
            'severity' => $this->faker->randomElement(['minor', 'moderate', 'major', 'critical']),
            'type' => $this->faker->randomElement(['injury', 'near_miss', 'property_damage', 'environmental', 'illness']),
            'reported_by' => null,
            'immediate_action' => $this->faker->optional()->paragraph(),
            'root_cause' => $this->faker->optional()->paragraph(),
            'corrective_action' => $this->faker->optional()->paragraph(),
            'status' => $this->faker->randomElement(['reported', 'under_investigation', 'resolved', 'closed']),
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'resolved',
        ]);
    }

    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => 'critical',
        ]);
    }
}
