<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\EmployeeSalaryStructure;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeSalaryStructure>
 */
class EmployeeSalaryStructureFactory extends Factory
{
    protected $model = EmployeeSalaryStructure::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'basic_salary' => $this->faker->randomFloat(2, 20000, 100000),
            'effective_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'status' => 'active',
        ];
    }
}
