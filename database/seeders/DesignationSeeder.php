<?php

namespace Database\Seeders;

use App\Models\HRM\Department;
use App\Models\HRM\Designation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DesignationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Designation seeding...');

        // Get department IDs by code for mapping
        $departments = Department::pluck('id', 'code');

        $designations = [
            // Executive Management
            ['title' => 'Chief Executive Officer', 'department_id' => $departments['EXEC'] ?? null, 'is_active' => true],
            ['title' => 'Chief Operating Officer', 'department_id' => $departments['EXEC'] ?? null, 'is_active' => true],
            // Human Resources
            ['title' => 'HR Manager', 'department_id' => $departments['HR'] ?? null, 'is_active' => true],
            ['title' => 'Recruitment Specialist', 'department_id' => $departments['HR'] ?? null, 'is_active' => true],
            ['title' => 'Training Coordinator', 'department_id' => $departments['HR'] ?? null, 'is_active' => true],
            // Finance
            ['title' => 'Finance Manager', 'department_id' => $departments['FIN'] ?? null, 'is_active' => true],
            ['title' => 'Accountant', 'department_id' => $departments['FIN'] ?? null, 'is_active' => true],
            ['title' => 'Payroll Officer', 'department_id' => $departments['FIN'] ?? null, 'is_active' => true],
            // IT
            ['title' => 'IT Manager', 'department_id' => $departments['IT'] ?? null, 'is_active' => true],
            ['title' => 'IT Support Specialist', 'department_id' => $departments['IT'] ?? null, 'is_active' => true],
            ['title' => 'Network Administrator', 'department_id' => $departments['IT'] ?? null, 'is_active' => true],
            // Marketing
            ['title' => 'Marketing Lead', 'department_id' => $departments['MKT'] ?? null, 'is_active' => true],
            ['title' => 'Brand Manager', 'department_id' => $departments['MKT'] ?? null, 'is_active' => true],
            // Operations
            ['title' => 'Operations Supervisor', 'department_id' => $departments['OPS'] ?? null, 'is_active' => true],
            ['title' => 'Logistics Coordinator', 'department_id' => $departments['OPS'] ?? null, 'is_active' => true],
            // Sales
            ['title' => 'Sales Executive', 'department_id' => $departments['SALES'] ?? null, 'is_active' => true],
            // Customer Support
            ['title' => 'Customer Support Agent', 'department_id' => $departments['CS'] ?? null, 'is_active' => true],
            // Legal
            ['title' => 'Legal Advisor', 'department_id' => $departments['LEGAL'] ?? null, 'is_active' => true],
            // Quality Assurance
            ['title' => 'QA Analyst', 'department_id' => $departments['QA'] ?? null, 'is_active' => true],
            // Facilities Management
            ['title' => 'Facilities Coordinator', 'department_id' => $departments['FAC'] ?? null, 'is_active' => false],
        ];

        // Remove existing designations
        DB::table('designations')->delete();

        // Insert new designations
        foreach ($designations as $designation) {
            if ($designation['department_id']) {
                Designation::create($designation);
            }
        }

        $this->command->info('Designation seeding completed successfully.');
        $this->command->info('Total designations created: '.Designation::count());
    }
}
