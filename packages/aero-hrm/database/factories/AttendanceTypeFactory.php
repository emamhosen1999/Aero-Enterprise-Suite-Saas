<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\AttendanceType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceType>
 */
class AttendanceTypeFactory extends Factory
{
    protected $model = AttendanceType::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Regular', 'WFH', 'Field', 'Half Day', 'On Duty']),
            'code' => $this->faker->unique()->lexify('???'),
            'is_active' => true,
        ];
    }
}
