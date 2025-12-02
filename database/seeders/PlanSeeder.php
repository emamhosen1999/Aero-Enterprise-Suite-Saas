<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get modules for assignment
        $coreModule = Module::where('code', 'core')->first();
        $hrmModule = Module::where('code', 'hrm')->first();
        $crmModule = Module::where('code', 'crm')->first();
        $projectModule = Module::where('code', 'project')->first();
        $financeModule = Module::where('code', 'finance')->first();

        // Starter Plan
        $starter = Plan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'description' => 'Operational launchpad for seed-stage teams.',
            'monthly_price' => 499.00,
            'yearly_price' => 4990.00,
            'trial_days' => 14,
            'is_active' => true,
            'features' => json_encode([
                'Core HR + Document management',
                'Guided provisioning checklist',
                'Shared support channel',
                '99.5% uptime SLA',
            ]),
            'limits' => json_encode([
                'storage' => '250 GB',
                'api' => '1M',
                'seats_included' => 50,
            ]),
        ]);

        // Attach core module
        if ($coreModule) {
            $starter->modules()->attach($coreModule->id, [
                'is_enabled' => true,
                'limits' => json_encode(['users' => 50]),
            ]);
        }

        // Growth Plan - Most Adopted
        $growth = Plan::create([
            'name' => 'Growth',
            'slug' => 'growth',
            'description' => 'Cross-functional automation with governance guardrails.',
            'monthly_price' => 2200.00,
            'yearly_price' => 22000.00,
            'trial_days' => 14,
            'is_active' => true,
            'is_featured' => true,
            'features' => json_encode([
                'Advanced automation rules',
                'Regional compliance pack',
                'Playbook library',
                '99.9% uptime SLA',
            ]),
            'limits' => json_encode([
                'storage' => '1.5 TB',
                'api' => '6M',
                'seats_included' => 250,
                'badge' => 'Most adopted',
            ]),
        ]);

        // Attach core, HRM, and CRM modules
        if ($coreModule) {
            $growth->modules()->attach($coreModule->id, [
                'is_enabled' => true,
                'limits' => json_encode(['users' => 250]),
            ]);
        }
        if ($hrmModule) {
            $growth->modules()->attach($hrmModule->id, [
                'is_enabled' => true,
            ]);
        }
        if ($crmModule) {
            $growth->modules()->attach($crmModule->id, [
                'is_enabled' => true,
            ]);
        }

        // Professional Plan - AI Suite
        $professional = Plan::create([
            'name' => 'Professional',
            'slug' => 'professional',
            'description' => 'Multi-entity orchestration with AI-first insights.',
            'monthly_price' => 5200.00,
            'yearly_price' => 52000.00,
            'trial_days' => 14,
            'is_active' => true,
            'features' => json_encode([
                'Private data lake connectors',
                'Predictive retention scores',
                'Dedicated solutions engineer',
                'Active-active failover',
            ]),
            'limits' => json_encode([
                'storage' => '4 TB',
                'api' => '18M',
                'seats_included' => 600,
                'badge' => 'AI Suite',
            ]),
        ]);

        // Attach all modules except finance
        foreach ([$coreModule, $hrmModule, $crmModule, $projectModule] as $module) {
            if ($module) {
                $professional->modules()->attach($module->id, [
                    'is_enabled' => true,
                ]);
            }
        }

        // Enterprise Plan - Regulated
        $enterprise = Plan::create([
            'name' => 'Enterprise',
            'slug' => 'enterprise',
            'description' => 'Regulated industry stack with bespoke controls.',
            'monthly_price' => 10800.00,
            'yearly_price' => 108000.00,
            'trial_days' => 30,
            'is_active' => true,
            'features' => json_encode([
                'Dedicated tenant shards',
                'Custom data residency',
                'Quarterly resilience drills',
                'Named TAM + compliance pod',
            ]),
            'limits' => json_encode([
                'storage' => 'Custom',
                'api' => 'Unlimited',
                'seats_included' => null,
                'badge' => 'Regulated',
            ]),
        ]);

        // Attach all modules
        foreach ([$coreModule, $hrmModule, $crmModule, $projectModule, $financeModule] as $module) {
            if ($module) {
                $enterprise->modules()->attach($module->id, [
                    'is_enabled' => true,
                ]);
            }
        }

        $this->command->info('✓ Created 4 subscription plans with module assignments');
    }
}
