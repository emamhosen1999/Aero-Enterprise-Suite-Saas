<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\LeaveBalance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveBalance>
 */
class LeaveBalanceFactory extends Factory
{
    protected $model = LeaveBalance::class;

    public function definition(): array
    {
        $totalDays = $this->faker->randomElement([12, 15, 21]);
        $usedDays = $this->faker->numberBetween(0, 10);

        return [
            'user_id' => null,
            'leave_type_id' => null,
            'total_days' => $totalDays,
            'used_days' => $usedDays,
            'remaining_days' => $totalDays - $usedDays,
            'year' => date('Y'),
        ];
    }
}
