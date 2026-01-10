<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\AssetAllocation;
use Packages\AeroHrm\Models\Asset;
use Packages\AeroHrm\Models\Employee;

class AssetAllocationFactory extends Factory
{
    protected $model = AssetAllocation::class;

    public function definition(): array
    {
        $allocatedAt = $this->faker->dateTimeBetween('-6 months', 'now');
        $expectedReturnDate = $this->faker->dateTimeBetween($allocatedAt, '+1 year');

        return [
            'asset_id' => Asset::factory(),
            'employee_id' => Employee::factory(),
            'allocated_at' => $allocatedAt,
            'allocated_by' => Employee::factory(),
            'condition_on_allocation' => $this->faker->randomElement(['excellent', 'good', 'fair', 'poor']),
            'notes_on_allocation' => $this->faker->optional()->sentence(),
            'expected_return_date' => $expectedReturnDate,
            'returned_at' => null,
            'returned_to' => null,
            'condition_on_return' => null,
            'notes_on_return' => null,
        ];
    }

    /**
     * Indicate that the allocation is active (not returned).
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'returned_at' => null,
            'returned_to' => null,
            'condition_on_return' => null,
            'notes_on_return' => null,
        ]);
    }

    /**
     * Indicate that the asset has been returned.
     */
    public function returned(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'returned_at' => $this->faker->dateTimeBetween($attributes['allocated_at'], 'now'),
                'returned_to' => Employee::factory(),
                'condition_on_return' => $this->faker->randomElement(['excellent', 'good', 'fair', 'poor', 'damaged']),
                'notes_on_return' => $this->faker->optional()->sentence(),
            ];
        });
    }

    /**
     * Indicate that the allocation is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_return_date' => $this->faker->dateTimeBetween('-30 days', '-1 day'),
            'returned_at' => null,
        ]);
    }

    /**
     * Indicate that the asset was allocated with poor condition.
     */
    public function poorCondition(): static
    {
        return $this->state(fn (array $attributes) => [
            'condition_on_allocation' => 'poor',
        ]);
    }
}
