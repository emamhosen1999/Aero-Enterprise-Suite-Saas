<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Grievance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grievance>
 */
class GrievanceFactory extends Factory
{
    protected $model = Grievance::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'category_id' => null,
            'subject' => $this->faker->sentence(5),
            'description' => $this->faker->paragraphs(2, true),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'urgent']),
            'is_anonymous' => false,
            'desired_resolution' => $this->faker->optional()->paragraph(),
            'status' => $this->faker->randomElement(['submitted', 'under_review', 'investigating', 'resolved', 'closed']),
            'resolution' => $this->faker->optional()->paragraph(),
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'resolved',
            'resolution' => $this->faker->paragraph(),
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'urgent',
        ]);
    }
}
