<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\LeaveSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveSetting>
 */
class LeaveSettingFactory extends Factory
{
    protected $model = LeaveSetting::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave']),
            'code' => $this->faker->unique()->lexify('???'),
            'days_allowed' => $this->faker->randomElement([12, 15, 21, 30, 90]),
            'carry_forward' => $this->faker->boolean(),
            'is_paid' => true,
            'requires_approval' => true,
            'status' => 'active',
        ];
    }
}
