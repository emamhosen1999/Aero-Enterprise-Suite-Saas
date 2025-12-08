<?php

namespace Database\Seeders;

use Aero\Platform\Models\Plan;
use App\Models\Shared\Module;
use Illuminate\Database\Seeder;

class PlanModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Links modules to subscription plans based on plan tier.
     * Core modules are always enabled for all plans.
     */
    public function run(): void
    {
        $plans = Plan::all();

        if ($plans->isEmpty()) {
            if ($this->command) {
                $this->command->warn('⚠️  No plans found. Please seed plans first.');
            }

            return;
        }

        $modules = Module::all()->keyBy('code');

        if ($modules->isEmpty()) {
            if ($this->command) {
                $this->command->error('❌ No modules found. Run ModuleSeeder first.');
            }

            return;
        }

        foreach ($plans as $plan) {
            $this->attachModulesToPlan($plan, $modules);
        }

        if ($this->command) {
            $this->command->info('✅ Plan-module relationships seeded successfully.');
        }
    }

    /**
     * Attach modules to a plan based on its tier.
     *
     * @param  \Illuminate\Support\Collection  $modules
     */
    protected function attachModulesToPlan(Plan $plan, $modules): void
    {
        $slug = strtolower($plan->slug ?? $plan->name);

        // Core module is always enabled
        if ($modules->has('core')) {
            $plan->modules()->syncWithoutDetaching([
                $modules->get('core')->id => [
                    'limits' => json_encode(['users' => $this->getUserLimit($slug)]),
                    'is_enabled' => true,
                ],
            ]);
        }

        // Determine which premium modules to enable based on plan tier
        $modulesToEnable = $this->getModulesForPlan($slug);

        foreach ($modulesToEnable as $moduleCode => $limits) {
            if ($modules->has($moduleCode)) {
                $plan->modules()->syncWithoutDetaching([
                    $modules->get($moduleCode)->id => [
                        'limits' => json_encode($limits),
                        'is_enabled' => true,
                    ],
                ]);
            }
        }
    }

    /**
     * Get modules that should be enabled for a specific plan.
     */
    protected function getModulesForPlan(string $planSlug): array
    {
        // Free/Starter: Only core
        if (str_contains($planSlug, 'free') || str_contains($planSlug, 'starter') || str_contains($planSlug, 'trial')) {
            return [];
        }

        // Basic: Core + HRM (limited)
        if (str_contains($planSlug, 'basic')) {
            return [
                'hrm' => [
                    'max_employees' => 10,
                    'attendance_tracking' => true,
                    'payroll_enabled' => false,
                ],
            ];
        }

        // Professional: Core + HRM + CRM + Project
        if (str_contains($planSlug, 'professional') || str_contains($planSlug, 'pro')) {
            return [
                'hrm' => [
                    'max_employees' => 50,
                    'attendance_tracking' => true,
                    'payroll_enabled' => true,
                ],
                'crm' => [
                    'max_contacts' => 1000,
                    'pipeline_enabled' => true,
                ],
                'project' => [
                    'max_projects' => 25,
                    'time_tracking' => true,
                ],
            ];
        }

        // Enterprise: All modules with unlimited access
        if (str_contains($planSlug, 'enterprise') || str_contains($planSlug, 'unlimited')) {
            return [
                'hrm' => [
                    'max_employees' => null, // unlimited
                    'attendance_tracking' => true,
                    'payroll_enabled' => true,
                ],
                'crm' => [
                    'max_contacts' => null,
                    'pipeline_enabled' => true,
                ],
                'project' => [
                    'max_projects' => null,
                    'time_tracking' => true,
                ],
                'finance' => [
                    'invoices_enabled' => true,
                    'expense_tracking' => true,
                    'reports_enabled' => true,
                ],
            ];
        }

        // Default: no premium modules
        return [];
    }

    /**
     * Get user limit for plan tier.
     */
    protected function getUserLimit(string $planSlug): ?int
    {
        if (str_contains($planSlug, 'free') || str_contains($planSlug, 'starter')) {
            return 3;
        }

        if (str_contains($planSlug, 'basic')) {
            return 10;
        }

        if (str_contains($planSlug, 'professional') || str_contains($planSlug, 'pro')) {
            return 50;
        }

        // Enterprise: unlimited
        return null;
    }
}
