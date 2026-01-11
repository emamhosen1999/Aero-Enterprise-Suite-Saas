<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Employee;
use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<Employee>
     */
    protected $model = Employee::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_code' => 'EMP' . $this->faker->unique()->numberBetween(1000, 9999),
            'date_of_joining' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'employment_type' => $this->faker->randomElement(['full_time', 'part_time', 'contract', 'intern']),
            'status' => 'active',
            'basic_salary' => $this->faker->numberBetween(30000, 100000),
            'work_location' => $this->faker->city(),
            'birthday' => $this->faker->dateTimeBetween('-40 years', '-22 years'),
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'nationality' => 'UAE',
            'religion' => $this->faker->randomElement(['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Other']),
            'marital_status' => $this->faker->randomElement(['single', 'married', 'divorced']),
            'blood_group' => $this->faker->randomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        ];
    }

    /**
     * Indicate that the employee has a manager.
     */
    public function withManager(int $managerId): static
    {
        return $this->state(fn (array $attributes) => [
            'manager_id' => $managerId,
        ]);
    }

    /**
     * Indicate that the employee belongs to a department.
     */
    public function withDepartment(int $departmentId): static
    {
        return $this->state(fn (array $attributes) => [
            'department_id' => $departmentId,
        ]);
    }

    /**
     * Indicate that the employee has a designation.
     */
    public function withDesignation(int $designationId): static
    {
        return $this->state(fn (array $attributes) => [
            'designation_id' => $designationId,
        ]);
    }

    /**
     * Indicate that the employee is inactive (terminated).
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'terminated',
            'date_of_leaving' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ]);
    }

    /**
     * Indicate that the employee is on probation.
     */
    public function onProbation(): static
    {
        return $this->state(fn (array $attributes) => [
            'probation_end_date' => $this->faker->dateTimeBetween('now', '+3 months'),
        ]);
    }
}
