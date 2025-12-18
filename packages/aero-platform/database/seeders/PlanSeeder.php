<?php

namespace Aero\Platform\Database\Seeders;

use Aero\Platform\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * Seeds the subscription plans for the SaaS platform.
 *
 * Creates a range of plans from Free to Enterprise.
 * 
 * Module Codes Available:
 * - core: Core functionality (always included)
 * - hrm: Human Resources Management
 * - crm: Customer Relationship Management
 * - project: Project Management
 * - finance: Finance & Accounting
 * - scm: Supply Chain Management
 * - ims: Inventory Management System
 * - pos: Point of Sale
 * - quality: Quality Management
 * - dms: Document Management System
 * - compliance: Compliance Management
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
                'module_codes' => ['core'],
                'features' => [
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
                'module_codes' => ['core', 'hrm'],
                'features' => [
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
                'module_codes' => ['core', 'hrm', 'crm', 'project'],
                'features' => [
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
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'Comprehensive solution for medium businesses',
                'monthly_price' => 149.00,
                'yearly_price' => 1490.00,
                'setup_fee' => 0,
                'currency' => 'USD',
                'module_codes' => ['core', 'hrm', 'crm', 'project', 'finance', 'dms'],
                'features' => [
                    'support' => 'priority',
                    'sso' => true,
                    'api_access' => true,
                ],
                'limits' => [
                    'max_users' => 100,
                    'max_storage_gb' => 250,
                ],
                'trial_days' => 14,
                'sort_order' => 4,
                'is_active' => true,
                'is_featured' => false,
                'duration_in_months' => 1,
                'max_users' => 100,
                'max_storage_gb' => 250,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Complete solution for large organizations',
                'monthly_price' => 299.00,
                'yearly_price' => 2990.00,
                'setup_fee' => 0,
                'currency' => 'USD',
                'module_codes' => ['core', 'hrm', 'crm', 'project', 'finance', 'scm', 'ims', 'pos', 'quality', 'dms', 'compliance'],
                'features' => [
                    'support' => 'dedicated',
                    'sso' => true,
                    'custom_domain' => true,
                    'api_access' => true,
                    'white_label' => true,
                ],
                'limits' => [
                    'max_users' => 0, // Unlimited
                    'max_storage_gb' => 0, // Unlimited
                ],
                'trial_days' => 30,
                'sort_order' => 5,
                'is_active' => true,
                'is_featured' => false,
                'duration_in_months' => 1,
                'max_users' => 0,
                'max_storage_gb' => 0,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }

        $this->command->info('✓ Created/Updated '.count($plans).' subscription plans');
    }
}
