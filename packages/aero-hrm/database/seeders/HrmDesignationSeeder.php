<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\Designation;
use Illuminate\Database\Seeder;

class HrmDesignationSeeder extends Seeder
{
    public function run(): void
    {
        $designations = [
            ['title' => 'Chief Executive Officer', 'hierarchy_level' => 1],
            ['title' => 'Chief Technology Officer', 'hierarchy_level' => 2],
            ['title' => 'Chief Financial Officer', 'hierarchy_level' => 2],
            ['title' => 'Chief Operating Officer', 'hierarchy_level' => 2],
            ['title' => 'Vice President', 'hierarchy_level' => 3],
            ['title' => 'Director', 'hierarchy_level' => 4],
            ['title' => 'Senior Manager', 'hierarchy_level' => 5],
            ['title' => 'Manager', 'hierarchy_level' => 6],
            ['title' => 'Team Lead', 'hierarchy_level' => 7],
            ['title' => 'Senior Engineer', 'hierarchy_level' => 8],
            ['title' => 'Engineer', 'hierarchy_level' => 9],
            ['title' => 'Junior Engineer', 'hierarchy_level' => 10],
            ['title' => 'Senior Analyst', 'hierarchy_level' => 8],
            ['title' => 'Analyst', 'hierarchy_level' => 9],
            ['title' => 'Associate', 'hierarchy_level' => 10],
            ['title' => 'Intern', 'hierarchy_level' => 12],
            ['title' => 'HR Manager', 'hierarchy_level' => 6],
            ['title' => 'Finance Manager', 'hierarchy_level' => 6],
            ['title' => 'Marketing Manager', 'hierarchy_level' => 6],
            ['title' => 'Sales Manager', 'hierarchy_level' => 6],
        ];

        foreach ($designations as $designation) {
            Designation::firstOrCreate(
                ['title' => $designation['title']],
                array_merge($designation, ['is_active' => true])
            );
        }
    }
}
