<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\DisciplinaryCase;
use Packages\AeroHrm\Models\Employee;
use Packages\AeroHrm\Models\Warning;

class WarningFactory extends Factory
{
    protected $model = Warning::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'disciplinary_case_id' => DisciplinaryCase::factory(),
            'warning_number' => 'WRN'.now()->format('Y').str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'warning_type' => $this->faker->randomElement(['verbal', 'written', 'final']),
            'issued_date' => now(),
            'issued_by' => Employee::factory(),
            'reason' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'expiry_date' => $this->faker->optional(0.7)->dateTimeBetween('+30 days', '+1 year'),
            'acknowledged_at' => null,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the warning is verbal.
     */
    public function verbal(): static
    {
        return $this->state(fn (array $attributes) => [
            'warning_type' => 'verbal',
            'expiry_date' => now()->addMonths(3),
        ]);
    }

    /**
     * Indicate that the warning is written.
     */
    public function written(): static
    {
        return $this->state(fn (array $attributes) => [
            'warning_type' => 'written',
            'expiry_date' => now()->addMonths(6),
        ]);
    }

    /**
     * Indicate that the warning is final.
     */
    public function final(): static
    {
        return $this->state(fn (array $attributes) => [
            'warning_type' => 'final',
            'expiry_date' => now()->addYear(),
        ]);
    }

    /**
     * Indicate that the warning has been acknowledged.
     */
    public function acknowledged(): static
    {
        return $this->state(fn (array $attributes) => [
            'acknowledged_at' => $this->faker->dateTimeBetween($attributes['issued_date'], 'now'),
        ]);
    }

    /**
     * Indicate that the warning is inactive (expired or revoked).
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the warning has expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => $this->faker->dateTimeBetween('-30 days', '-1 day'),
            'is_active' => false,
        ]);
    }
}
