<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\OvertimeRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OvertimeRecord>
 */
class OvertimeRecordFactory extends Factory
{
    protected $model = OvertimeRecord::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'start_time' => '18:00',
            'end_time' => '21:00',
            'hours' => $this->faker->randomFloat(1, 0.5, 8),
            'reason' => $this->faker->sentence(),
            'type' => $this->faker->randomElement(['regular', 'weekend', 'holiday']),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}
