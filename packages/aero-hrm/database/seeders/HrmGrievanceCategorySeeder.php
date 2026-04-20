<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\GrievanceCategory;
use Illuminate\Database\Seeder;

class HrmGrievanceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Workplace Harassment', 'code' => 'WH', 'description' => 'Reports of verbal, physical, or sexual harassment.', 'requires_investigation' => true, 'default_priority' => 'high', 'escalation_days' => 3],
            ['name' => 'Discrimination', 'code' => 'DSC', 'description' => 'Complaints related to unfair treatment based on protected characteristics.', 'requires_investigation' => true, 'default_priority' => 'high', 'escalation_days' => 3],
            ['name' => 'Work Conditions', 'code' => 'WC', 'description' => 'Issues with workplace environment, facilities, or resources.', 'requires_investigation' => false, 'default_priority' => 'medium', 'escalation_days' => 7],
            ['name' => 'Compensation & Benefits', 'code' => 'CB', 'description' => 'Disputes regarding salary, bonuses, or employee benefits.', 'requires_investigation' => false, 'default_priority' => 'medium', 'escalation_days' => 7],
            ['name' => 'Management Issues', 'code' => 'MI', 'description' => 'Concerns about managerial behavior, decisions, or leadership.', 'requires_investigation' => false, 'default_priority' => 'medium', 'escalation_days' => 5],
            ['name' => 'Policy Violation', 'code' => 'PV', 'description' => 'Reports of company policy breaches by employees or management.', 'requires_investigation' => true, 'default_priority' => 'high', 'escalation_days' => 3],
            ['name' => 'Safety Concerns', 'code' => 'SC', 'description' => 'Workplace safety hazards and health risk reports.', 'requires_investigation' => true, 'default_priority' => 'critical', 'escalation_days' => 1],
            ['name' => 'Bullying', 'code' => 'BLY', 'description' => 'Reports of intimidation, coercion, or bullying behavior.', 'requires_investigation' => true, 'default_priority' => 'high', 'escalation_days' => 3],
            ['name' => 'Workload', 'code' => 'WL', 'description' => 'Concerns about excessive or unfair workload distribution.', 'requires_investigation' => false, 'default_priority' => 'low', 'escalation_days' => 10],
            ['name' => 'Other', 'code' => 'OTH', 'description' => 'General grievances not covered by specific categories.', 'requires_investigation' => false, 'default_priority' => 'low', 'escalation_days' => 7],
        ];

        foreach ($categories as $index => $category) {
            GrievanceCategory::firstOrCreate(
                ['code' => $category['code']],
                array_merge($category, [
                    'is_active' => true,
                    'display_order' => $index + 1,
                ])
            );
        }
    }
}
