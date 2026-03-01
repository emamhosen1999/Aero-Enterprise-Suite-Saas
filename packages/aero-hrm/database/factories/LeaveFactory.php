<?php

namespace Aero\HRM\Database\Factories;

use Aero\Core\Models\User;
use Aero\HRM\Models\Leave;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\HRM\Models\Leave>
 */
class LeaveFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Leave::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fromDate = Carbon::now()->addDays($this->faker->numberBetween(1, 30));
        $days = $this->faker->numberBetween(1, 5);
        $toDate = $fromDate->copy()->addDays($days - 1);

        return [
            'user_id' => User::factory(),
            'leave_setting_id' => null, // Nullable for tests without leave_settings
            'leave_type' => $this->faker->randomElement([
                'Annual',
                'Sick',
                'Casual',
                'Maternity',
                'Paternity',
            ]),
            'from_date' => $fromDate->format('Y-m-d'),
            'to_date' => $toDate->format('Y-m-d'),
            'no_of_days' => $days,
            'reason' => $this->faker->sentence(),
            'status' => 'pending',
            'approved_by' => null,
            'approval_chain' => [],
            'current_approval_level' => 0,
            'approved_at' => null,
            'rejection_reason' => null,
            'rejected_by' => null,
            'submitted_at' => Carbon::now(),
        ];
    }

    /**
     * Indicate that the leave is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_by' => User::factory(),
            'approved_at' => Carbon::now(),
        ]);
    }

    /**
     * Indicate that the leave is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejected_by' => User::factory(),
            'rejection_reason' => $this->faker->sentence(),
        ]);
    }

    /**
     * Indicate that the leave is for half day.
     */
    public function halfDay(): static
    {
        return $this->state(fn (array $attributes) => [
            'no_of_days' => 0.5,
            'to_date' => $attributes['from_date'],
        ]);
    }
}
