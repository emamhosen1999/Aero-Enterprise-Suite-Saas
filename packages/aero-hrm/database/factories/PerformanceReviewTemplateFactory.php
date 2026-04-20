<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PerformanceReviewTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerformanceReviewTemplate>
 */
class PerformanceReviewTemplateFactory extends Factory
{
    protected $model = PerformanceReviewTemplate::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph(),
            'sections' => $this->faker->optional()->randomElement([
                json_encode([
                    ['name' => 'Technical Skills', 'weight' => 30],
                    ['name' => 'Communication', 'weight' => 20],
                    ['name' => 'Leadership', 'weight' => 25],
                    ['name' => 'Teamwork', 'weight' => 25],
                ]),
            ]),
            'is_default' => false,
            'status' => 'active',
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => ['is_default' => true]);
    }
}
