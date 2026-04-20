<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\AttendanceSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceSetting>
 */
class AttendanceSettingFactory extends Factory
{
    protected $model = AttendanceSetting::class;

    public function definition(): array
    {
        return [
            'key' => $this->faker->unique()->word(),
            'value' => $this->faker->word(),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
