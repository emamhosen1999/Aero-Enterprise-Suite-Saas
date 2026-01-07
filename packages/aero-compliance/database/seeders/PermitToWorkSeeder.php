<?php

namespace Aero\Compliance\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Aero\Compliance\Models\PermitToWork;

/**
 * PermitToWorkSeeder - PATENTABLE CORE IP
 * 
 * Seeds demo permits for testing RequiresPermit trait validation.
 * Creates sample permits covering different work types and chainages.
 */
class PermitToWorkSeeder extends Seeder
{
    public function run(): void
    {
        // Check if any project exists
        $project = DB::table('projects')->first();
        
        if (!$project) {
            $this->command->warn('No projects found. Please create a project first.');
            return;
        }

        $this->command->info("Seeding permits for project: {$project->project_name}");

        // Clear existing permits for this project
        DB::table('permit_to_works')->where('project_id', $project->id)->delete();

        $permits = [];

        // 1. Hot Work Permit (Welding) - Ch 0.000 to Ch 2.000
        $permits[] = [
            'project_id' => $project->id,
            'permit_type' => PermitToWork::TYPE_HOT_WORK,
            'work_description' => 'Welding of steel reinforcement for bridge deck at Ch 1.250',
            'activity_types' => json_encode(['welding', 'grinding', 'cutting']),
            'valid_from' => Carbon::now()->subDays(5),
            'valid_until' => Carbon::now()->addDays(10),
            'time_from' => '08:00:00',
            'time_until' => '17:00:00',
            'start_chainage' => 0.000,
            'end_chainage' => 2.000,
            'requested_by' => 1,
            'approved_by' => 1,
            'approved_at' => Carbon::now()->subDays(4),
            'authorized_workers' => json_encode([1, 2, 3]),
            'authorized_equipment' => json_encode(['Welding machine', 'Angle grinder', 'Fire extinguisher']),
            'permit_conditions' => json_encode([
                'Fire watch required',
                'Hot work blanket in place',
                'Minimum 2m clearance from flammable materials',
                'Fire extinguisher within 10m',
            ]),
            'equipment_check_required' => true,
            'equipment_last_checked' => Carbon::now()->subHours(2),
            'personnel_requirement_met' => true,
            'environmental_check_done' => true,
            'risk_level' => PermitToWork::RISK_HIGH,
            'identified_hazards' => json_encode(['Fire risk', 'Burns', 'Eye damage', 'Fumes']),
            'control_measures' => json_encode([
                'Fire blankets and extinguishers',
                'PPE: Welding helmet, gloves, apron',
                'Ventilation system active',
                'Fire watch for 1 hour post-work',
            ]),
            'status' => PermitToWork::STATUS_ACTIVE,
            'created_at' => Carbon::now()->subDays(5),
            'updated_at' => Carbon::now(),
        ];

        // 2. Work at Height Permit - Ch 3.000 to Ch 5.000
        $permits[] = [
            'project_id' => $project->id,
            'permit_type' => PermitToWork::TYPE_WORK_AT_HEIGHT,
            'work_description' => 'Installation of bridge girders at elevation >15m',
            'activity_types' => json_encode(['scaffolding', 'crane_operations', 'steel_erection']),
            'valid_from' => Carbon::now()->subDays(3),
            'valid_until' => Carbon::now()->addDays(7),
            'time_from' => '07:00:00',
            'time_until' => '18:00:00',
            'start_chainage' => 3.000,
            'end_chainage' => 5.000,
            'requested_by' => 1,
            'approved_by' => 1,
            'approved_at' => Carbon::now()->subDays(2),
            'authorized_workers' => json_encode([1, 2, 3, 4, 5]),
            'authorized_equipment' => json_encode(['Mobile crane 50T', 'Scaffolding', 'Safety harnesses']),
            'permit_conditions' => json_encode([
                'Wind speed < 40 km/h',
                'All workers must wear harnesses',
                'Fall protection system inspected',
                'Rescue plan in place',
            ]),
            'equipment_check_required' => true,
            'equipment_last_checked' => Carbon::now()->subHours(4),
            'personnel_requirement_met' => true,
            'environmental_check_done' => true,
            'risk_level' => PermitToWork::RISK_CRITICAL,
            'identified_hazards' => json_encode(['Falls from height', 'Falling objects', 'Crane accidents']),
            'control_measures' => json_encode([
                'Edge protection barriers',
                'Hard barricading below work area',
                'Crane operator certified',
                'Rescue equipment on standby',
            ]),
            'status' => PermitToWork::STATUS_ACTIVE,
            'created_at' => Carbon::now()->subDays(3),
            'updated_at' => Carbon::now(),
        ];

        // 3. Excavation Permit - Ch 6.000 to Ch 8.000
        $permits[] = [
            'project_id' => $project->id,
            'permit_type' => PermitToWork::TYPE_EXCAVATION,
            'work_description' => 'Deep excavation for foundation (depth >3m)',
            'activity_types' => json_encode(['excavation', 'shoring', 'dewatering']),
            'valid_from' => Carbon::now()->subDays(7),
            'valid_until' => Carbon::now()->addDays(14),
            'time_from' => '06:00:00',
            'time_until' => '18:00:00',
            'start_chainage' => 6.000,
            'end_chainage' => 8.000,
            'requested_by' => 1,
            'approved_by' => 1,
            'approved_at' => Carbon::now()->subDays(6),
            'authorized_workers' => json_encode([1, 2, 3, 4, 5, 6]),
            'authorized_equipment' => json_encode(['Excavator CAT 320', 'Dewatering pumps', 'Shoring equipment']),
            'permit_conditions' => json_encode([
                'Utility clearance obtained',
                'Shoring design approved',
                'Competent person supervising',
                'Daily excavation inspection',
            ]),
            'equipment_check_required' => true,
            'equipment_last_checked' => Carbon::now()->subDays(1),
            'personnel_requirement_met' => true,
            'environmental_check_done' => true,
            'risk_level' => PermitToWork::RISK_HIGH,
            'identified_hazards' => json_encode(['Cave-in', 'Underground utilities', 'Water ingress', 'Asphyxiation']),
            'control_measures' => json_encode([
                'Proper shoring system',
                'Utility locating completed',
                'Ladder access every 7.5m',
                'Gas monitoring in place',
            ]),
            'status' => PermitToWork::STATUS_ACTIVE,
            'created_at' => Carbon::now()->subDays(7),
            'updated_at' => Carbon::now(),
        ];

        // 4. Expired Permit (for testing expiration alerts)
        $permits[] = [
            'project_id' => $project->id,
            'permit_type' => PermitToWork::TYPE_ELECTRICAL,
            'work_description' => 'High voltage cable installation - EXPIRED',
            'activity_types' => json_encode(['electrical_work', 'cable_pulling']),
            'valid_from' => Carbon::now()->subDays(15),
            'valid_until' => Carbon::now()->subDays(2),
            'start_chainage' => 8.500,
            'end_chainage' => 9.500,
            'requested_by' => 1,
            'approved_by' => 1,
            'approved_at' => Carbon::now()->subDays(14),
            'authorized_workers' => json_encode([1, 2]),
            'risk_level' => PermitToWork::RISK_CRITICAL,
            'status' => PermitToWork::STATUS_EXPIRED,
            'created_at' => Carbon::now()->subDays(15),
            'updated_at' => Carbon::now(),
        ];

        // 5. Expiring Soon Permit (for testing proactive monitoring)
        $permits[] = [

            'project_id' => $project->id,
            'permit_type' => PermitToWork::TYPE_LIFTING_OPERATIONS,
            'work_description' => 'Crane operations for precast beam installation - EXPIRING SOON',
            'activity_types' => json_encode(['crane_operations', 'lifting', 'rigging']),
            'valid_from' => Carbon::now()->subDays(10),
            'valid_until' => Carbon::now()->addDays(3), // Expires in 3 days
            'time_from' => '07:00:00',
            'time_until' => '17:00:00',
            'start_chainage' => 4.500,
            'end_chainage' => 5.500,
            'requested_by' => 1,
            'approved_by' => 1,
            'approved_at' => Carbon::now()->subDays(9),
            'authorized_workers' => json_encode([1, 2, 3, 4]),
            'authorized_equipment' => json_encode(['Mobile crane 100T', 'Rigging equipment']),
            'equipment_check_required' => true,
            'equipment_last_checked' => Carbon::now()->subHours(6),
            'personnel_requirement_met' => true,
            'environmental_check_done' => true,
            'risk_level' => PermitToWork::RISK_CRITICAL,
            'status' => PermitToWork::STATUS_ACTIVE,
            'created_at' => Carbon::now()->subDays(10),
            'updated_at' => Carbon::now(),
        ];

        // Insert all permits using the model so permit_number auto-generates
        foreach ($permits as $permitData) {
            // Remove permit_number - let model generate it
            unset($permitData['permit_number']);
            PermitToWork::create($permitData);
        }

        $this->command->info("✓ Created " . count($permits) . " sample permits");
        $this->command->info("  - 3 Active permits (Hot Work, Work at Height, Excavation)");
        $this->command->info("  - 1 Expired permit (for testing alerts)");
        $this->command->info("  - 1 Expiring soon (for proactive monitoring)");
        $this->command->info("  Permit validation is now functional!");
    }
}
