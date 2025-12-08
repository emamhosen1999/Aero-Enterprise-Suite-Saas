<?php

namespace Database\Seeders;

use Aero\Platform\Models\Plan;
use App\Models\Shared\Module;
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
        $starter = Plan::updateOrCreate(
            ['slug' => 'starter'],
            [
                'name' => 'Starter',
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
            ]
        );

        // Attach core module
        if ($coreModule) {
            $starter->modules()->syncWithoutDetaching([
                $coreModule->id => [
                    'is_enabled' => true,
                    'limits' => json_encode(['users' => 50]),
                ],
            ]);
        }

        // Growth Plan - Most Adopted
        $growth = Plan::updateOrCreate(
            ['slug' => 'growth'],
            [
                'name' => 'Growth',
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
            ]
        );

        // Attach core, HRM, and CRM modules
        $growthModules = [];
        if ($coreModule) {
            $growthModules[$coreModule->id] = [
                'is_enabled' => true,
                'limits' => json_encode(['users' => 250]),
            ];
        }
        if ($hrmModule) {
            $growthModules[$hrmModule->id] = ['is_enabled' => true];
        }
        if ($crmModule) {
            $growthModules[$crmModule->id] = ['is_enabled' => true];
        }
        if (! empty($growthModules)) {
            $growth->modules()->syncWithoutDetaching($growthModules);
        }

        // Professional Plan - AI Suite
        $professional = Plan::updateOrCreate(
            ['slug' => 'professional'],
            [
                'name' => 'Professional',
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
            ]
        );

        // Attach all modules except finance
        $professionalModules = [];
        foreach ([$coreModule, $hrmModule, $crmModule, $projectModule] as $module) {
            if ($module) {
                $professionalModules[$module->id] = ['is_enabled' => true];
            }
        }
        if (! empty($professionalModules)) {
            $professional->modules()->syncWithoutDetaching($professionalModules);
        }

        // Enterprise Plan - Regulated
        $enterprise = Plan::updateOrCreate(
            ['slug' => 'enterprise'],
            [
                'name' => 'Enterprise',
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
            ]
        );

        // Attach all modules
        $enterpriseModules = [];
        foreach ([$coreModule, $hrmModule, $crmModule, $projectModule, $financeModule] as $module) {
            if ($module) {
                $enterpriseModules[$module->id] = ['is_enabled' => true];
            }
        }
        if (! empty($enterpriseModules)) {
            $enterprise->modules()->syncWithoutDetaching($enterpriseModules);
        }

        $this->command->info('✓ Created/updated 4 subscription plans with module assignments');
    }
}
