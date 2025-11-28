<?php

namespace Database\Factories;

use App\Models\HRM\Department;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-6 months', '+3 months');
        $endDate = $this->faker->dateTimeBetween($startDate, '+1 year');

        return [
            'project_name' => $this->faker->sentence(3),
            'project_code' => 'PRJ-'.$this->faker->unique()->randomNumber(6),
            'description' => $this->faker->paragraph(),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $this->faker->randomElement(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'critical']),
            'health_status' => $this->faker->randomElement(['good', 'at_risk', 'critical']),
            'risk_level' => $this->faker->randomElement(['low', 'medium', 'high', 'critical']),
            'methodology' => $this->faker->randomElement(['agile', 'waterfall', 'scrum', 'kanban', 'prince2']),
            'budget_allocated' => $this->faker->randomFloat(2, 10000, 1000000),
            'budget_spent' => $this->faker->randomFloat(2, 0, 500000),
            'progress' => $this->faker->numberBetween(0, 100),
            'spi' => $this->faker->randomFloat(2, 0.5, 1.5),
            'cpi' => $this->faker->randomFloat(2, 0.5, 1.5),
            'project_leader_id' => User::factory(),
            'team_leader_id' => User::factory(),
            'department_id' => Department::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'progress' => $this->faker->numberBetween(10, 80),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'progress' => 100,
        ]);
    }

    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'high',
        ]);
    }

    public function criticalHealth(): static
    {
        return $this->state(fn (array $attributes) => [
            'health_status' => 'critical',
        ]);
    }
}
