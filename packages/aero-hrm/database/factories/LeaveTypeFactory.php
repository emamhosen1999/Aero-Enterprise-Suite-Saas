<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\LeaveType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\HRM\Models\LeaveType>
 */
class LeaveTypeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = LeaveType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Annual Leave',
                'Sick Leave',
                'Casual Leave',
                'Maternity Leave',
                'Paternity Leave',
                'Compensatory Leave',
                'Unpaid Leave',
            ]),
            'code' => strtoupper($this->faker->lexify('LT???')),
            'total_days' => $this->faker->numberBetween(10, 30),
            'max_consecutive_days' => $this->faker->numberBetween(5, 15),
            'allow_half_day' => $this->faker->boolean(),
            'allow_carry_forward' => $this->faker->boolean(),
            'max_carry_forward' => $this->faker->numberBetween(0, 10),
            'accrual_type' => $this->faker->randomElement(['yearly', 'monthly', 'none']),
            'accrual_rate' => $this->faker->randomFloat(2, 0, 5),
            'requires_approval' => true,
            'is_paid' => $this->faker->boolean(80),
            'description' => $this->faker->sentence(),
        ];
    }

    /**
     * Indicate that the leave type is unpaid.
     */
    public function unpaid(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_paid' => false,
        ]);
    }

    /**
     * Indicate that the leave type doesn't require approval.
     */
    public function noApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_approval' => false,
        ]);
    }
}
