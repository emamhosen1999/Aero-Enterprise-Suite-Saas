<?php

namespace Database\Factories\HRM;

use Aero\HRM\Models\LeaveSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\HRM\LeaveSetting>
 */
class LeaveSettingFactory extends Factory
{
    protected $model = LeaveSetting::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave'];
        $name = fake()->randomElement($types);

        return [
            'name' => $name,
            'code' => strtoupper(substr($name, 0, 2)),
            'annual_quota' => fake()->numberBetween(10, 30),
            'accrual_type' => fake()->randomElement(['yearly', 'monthly', 'none']),
            'carry_forward_allowed' => fake()->boolean(70),
            'max_carry_forward_days' => fake()->numberBetween(0, 10),
            'encashment_allowed' => fake()->boolean(30),
            'requires_approval' => true,
            'min_days_notice' => fake()->numberBetween(0, 7),
            'max_consecutive_days' => fake()->numberBetween(0, 30),
            'allow_half_day' => true,
            'is_paid' => true,
            'is_active' => true,
            'color' => fake()->hexColor(),
            'description' => fake()->sentence(),
        ];
    }
}
