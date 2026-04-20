<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TrainingAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingAssignment>
 */
class TrainingAssignmentFactory extends Factory
{
    protected $model = TrainingAssignment::class;

    public function definition(): array
    {
        return [
            'training_id' => null,
            'employee_id' => null,
            'assigned_by' => null,
            'due_date' => $this->faker->dateTimeBetween('+1 week', '+1 month'),
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed', 'overdue']),
        ];
    }
}
