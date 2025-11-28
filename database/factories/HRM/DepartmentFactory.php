<?php

namespace Database\Factories\HRM;

use App\Models\HRM\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Information Technology',
                'Human Resources',
                'Finance',
                'Operations',
                'Marketing',
                'Sales',
                'Customer Service',
                'Research & Development',
                'Quality Assurance',
                'Project Management',
            ]),
            'description' => $this->faker->sentence(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
