<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\DisciplinaryActionType;

class DisciplinaryActionTypeFactory extends Factory
{
    protected $model = DisciplinaryActionType::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Verbal Warning',
                'Written Warning',
                'Final Warning',
                'Suspension',
                'Demotion',
                'Salary Reduction',
                'Termination',
                'Counseling',
                'Training Required',
                'Performance Improvement Plan'
            ]),
            'description' => $this->faker->sentence(),
            'severity' => $this->faker->randomElement(['minor', 'moderate', 'major', 'critical']),
            'points' => $this->faker->numberBetween(1, 10),
            'requires_investigation' => $this->faker->boolean(50),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the action type is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the action type is minor severity.
     */
    public function minor(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => 'minor',
            'points' => $this->faker->numberBetween(1, 3),
            'requires_investigation' => false,
        ]);
    }

    /**
     * Indicate that the action type is moderate severity.
     */
    public function moderate(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => 'moderate',
            'points' => $this->faker->numberBetween(3, 5),
            'requires_investigation' => true,
        ]);
    }

    /**
     * Indicate that the action type is major severity.
     */
    public function major(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => 'major',
            'points' => $this->faker->numberBetween(5, 8),
            'requires_investigation' => true,
        ]);
    }

    /**
     * Indicate that the action type is critical severity.
     */
    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => 'critical',
            'points' => $this->faker->numberBetween(8, 10),
            'requires_investigation' => true,
        ]);
    }
}
