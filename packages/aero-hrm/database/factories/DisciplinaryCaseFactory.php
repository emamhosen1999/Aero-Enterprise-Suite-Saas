<?php

namespace Packages\AeroHrm\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Packages\AeroHrm\Models\DisciplinaryCase;
use Packages\AeroHrm\Models\DisciplinaryActionType;
use Packages\AeroHrm\Models\Employee;

class DisciplinaryCaseFactory extends Factory
{
    protected $model = DisciplinaryCase::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'disciplinary_action_type_id' => DisciplinaryActionType::factory(),
            'case_number' => 'DC' . now()->format('Y') . str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'incident_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'description' => $this->faker->paragraph(),
            'employee_statement' => $this->faker->optional()->paragraph(),
            'witness_statement' => $this->faker->optional()->paragraph(),
            'investigation_notes' => null,
            'investigation_started_at' => null,
            'investigation_completed_at' => null,
            'action_taken' => null,
            'action_taken_at' => null,
            'action_taken_by' => null,
            'appeal_filed_at' => null,
            'appeal_notes' => null,
            'closed_at' => null,
            'closed_by' => null,
            'status' => 'pending',
        ];
    }

    /**
     * Indicate that the case is under investigation.
     */
    public function investigating(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'investigating',
            'investigation_started_at' => now()->subDays(2),
            'investigation_notes' => $this->faker->paragraph(),
        ]);
    }

    /**
     * Indicate that action has been taken on the case.
     */
    public function actionTaken(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'action_taken',
            'investigation_started_at' => now()->subDays(5),
            'investigation_completed_at' => now()->subDays(2),
            'investigation_notes' => $this->faker->paragraph(),
            'action_taken' => $this->faker->sentence(),
            'action_taken_at' => now()->subDay(),
            'action_taken_by' => Employee::factory(),
        ]);
    }

    /**
     * Indicate that the case is closed.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
            'investigation_started_at' => now()->subDays(10),
            'investigation_completed_at' => now()->subDays(5),
            'investigation_notes' => $this->faker->paragraph(),
            'action_taken' => $this->faker->sentence(),
            'action_taken_at' => now()->subDays(3),
            'action_taken_by' => Employee::factory(),
            'closed_at' => now(),
            'closed_by' => Employee::factory(),
        ]);
    }

    /**
     * Indicate that the case has been dismissed.
     */
    public function dismissed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'dismissed',
            'investigation_started_at' => now()->subDays(7),
            'investigation_completed_at' => now()->subDays(2),
            'investigation_notes' => $this->faker->paragraph(),
            'closed_at' => now(),
            'closed_by' => Employee::factory(),
        ]);
    }

    /**
     * Indicate that an appeal has been filed.
     */
    public function appealed(): static
    {
        return $this->state(fn (array $attributes) => [
            'appeal_filed_at' => now()->subDay(),
            'appeal_notes' => $this->faker->paragraph(),
        ]);
    }
}
