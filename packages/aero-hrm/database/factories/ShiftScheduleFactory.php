<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\ShiftSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShiftSchedule>
 */
class ShiftScheduleFactory extends Factory
{
    protected $model = ShiftSchedule::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Morning Shift', 'Afternoon Shift', 'Night Shift', 'General Shift']),
            'start_time' => $this->faker->randomElement(['06:00', '09:00', '14:00', '22:00']),
            'end_time' => $this->faker->randomElement(['14:00', '17:00', '22:00', '06:00']),
            'break_duration' => $this->faker->randomElement([30, 45, 60]),
            'grace_period' => $this->faker->randomElement([5, 10, 15]),
            'is_night_shift' => false,
            'status' => 'active',
        ];
    }
}
