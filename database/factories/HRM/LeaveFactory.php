<?php

namespace Database\Factories\HRM;

use App\Models\HRM\Leave;
use App\Models\HRM\LeaveSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeaveFactory extends Factory
{
    protected $model = Leave::class;

    public function definition(): array
    {
        $fromDate = $this->faker->dateTimeBetween('now', '+30 days');
        $toDate = $this->faker->dateTimeBetween($fromDate, $fromDate->format('Y-m-d').' +7 days');

        $days = $fromDate->diff($toDate)->days + 1;

        return [
            'user_id' => User::factory(),
            'leave_type' => LeaveSetting::factory(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'no_of_days' => $days,
            'reason' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['New', 'Pending', 'Approved', 'Declined']),
            'approved_by' => null,
        ];
    }

    public function approved(): Factory
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'Approved',
                'approved_by' => User::factory(),
            ];
        });
    }

    public function pending(): Factory
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'Pending',
            ];
        });
    }

    public function declined(): Factory
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'Declined',
                'approved_by' => User::factory(),
            ];
        });
    }
}
