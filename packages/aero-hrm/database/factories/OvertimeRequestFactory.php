<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\OvertimeRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OvertimeRequest>
 */
class OvertimeRequestFactory extends Factory
{
    protected $model = OvertimeRequest::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'requested_date' => $this->faker->dateTimeBetween('now', '+1 week'),
            'estimated_hours' => $this->faker->randomFloat(1, 1, 6),
            'reason' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'approved_by' => null,
            'approved_at' => $this->faker->optional()->dateTime(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}
