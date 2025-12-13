<?php

namespace Aero\Platform\Database\Seeders;

use Aero\Platform\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * Seeds the subscription plans for the SaaS platform.
 *
 * Creates a range of plans from Free to Enterprise.
 */
class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Get started with basic features',
                'monthly_price' => 0,
                'yearly_price' => 0,
                'setup_fee' => 0,
                'currency' => 'USD',
                'features' => [
                    'modules' => ['core'],
                    'support' => 'community',
                ],
                'limits' => [
                    'max_users' => 3,
                    'max_storage_gb' => 1,
                ],
                'trial_days' => 0,
                'sort_order' => 1,
                'is_active' => true,
                'is_featured' => false,
                'duration_in_months' => 1,
                'max_users' => 3,
                'max_storage_gb' => 1,
            ],
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Perfect for small teams getting started',
                'monthly_price' => 29.00,
                'yearly_price' => 290.00,
                'setup_fee' => 0,
                'currency' => 'USD',
                'features' => [
                    'modules' => ['core', 'hrm'],
                    'support' => 'email',
                ],
                'limits' => [
                    'max_users' => 10,
                    'max_storage_gb' => 10,
                ],
                'trial_days' => 14,
                'sort_order' => 2,
                'is_active' => true,
                'is_featured' => false,
                'duration_in_months' => 1,
                'max_users' => 10,
                'max_storage_gb' => 10,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'For growing businesses with advanced needs',
                'monthly_price' => 79.00,
                'yearly_price' => 790.00,
                'setup_fee' => 0,
                'currency' => 'USD',
                'features' => [
                    'modules' => ['core', 'hrm', 'crm', 'project'],
                    'support' => 'priority',
                    'sso' => true,
                ],
                'limits' => [
                    'max_users' => 50,
                    'max_storage_gb' => 100,
                ],
                'trial_days' => 14,
                'sort_order' => 3,
                'is_active' => true,
                'is_featured' => true,
                'duration_in_months' => 1,
                'max_users' => 50,
                'max_storage_gb' => 100,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Complete solution for large organizations',
                'monthly_price' => 199.00,
                'yearly_price' => 1990.00,
                'setup_fee' => 0,
                'currency' => 'USD',
                'features' => [
                    'modules' => ['core', 'hrm', 'crm', 'project', 'finance', 'scm', 'ims'],
                    'support' => 'dedicated',
                    'sso' => true,
                    'custom_domain' => true,
                    'api_access' => true,
                ],
                'limits' => [
                    'max_users' => 0, // Unlimited
                    'max_storage_gb' => 0, // Unlimited
                ],
                'trial_days' => 30,
                'sort_order' => 4,
                'is_active' => true,
                'is_featured' => false,
                'duration_in_months' => 1,
                'max_users' => 0,
                'max_storage_gb' => 0,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::firstOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }

        $this->command->info('✓ Created '.count($plans).' subscription plans');
    }
}
