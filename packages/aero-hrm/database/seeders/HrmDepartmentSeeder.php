<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\Department;
use Illuminate\Database\Seeder;

class HrmDepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'Human Resources',
                'code' => 'HR',
                'description' => 'Manages recruitment, employee relations, benefits, and organizational development.',
            ],
            [
                'name' => 'Finance & Accounting',
                'code' => 'FIN',
                'description' => 'Handles financial planning, reporting, budgeting, and accounting operations.',
            ],
            [
                'name' => 'Engineering',
                'code' => 'ENG',
                'description' => 'Responsible for product development, software engineering, and technical architecture.',
            ],
            [
                'name' => 'Marketing',
                'code' => 'MKT',
                'description' => 'Drives brand strategy, digital marketing, campaigns, and market research.',
            ],
            [
                'name' => 'Sales',
                'code' => 'SLS',
                'description' => 'Manages client acquisition, revenue generation, and sales pipeline.',
            ],
            [
                'name' => 'Operations',
                'code' => 'OPS',
                'description' => 'Oversees day-to-day business operations, logistics, and process optimization.',
            ],
            [
                'name' => 'Customer Support',
                'code' => 'CS',
                'description' => 'Provides customer assistance, issue resolution, and service quality management.',
            ],
            [
                'name' => 'Legal',
                'code' => 'LGL',
                'description' => 'Manages legal compliance, contracts, intellectual property, and risk management.',
            ],
            [
                'name' => 'Research & Development',
                'code' => 'RND',
                'description' => 'Conducts research, innovation initiatives, and new product exploration.',
            ],
            [
                'name' => 'Administration',
                'code' => 'ADM',
                'description' => 'Manages office facilities, procurement, and general administrative functions.',
            ],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(
                ['name' => $department['name']],
                array_merge($department, ['is_active' => true])
            );
        }
    }
}
