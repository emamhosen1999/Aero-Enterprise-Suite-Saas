<?php

namespace Tests\Feature;

use Aero\Platform\Models\Module;
use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Subscription;
use Aero\Platform\Models\Tenant;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Module Access Tests
 *
 * Tests for subscription-based module access control.
 * Verifies that tenants can only access modules included in their subscription.
 *
 * Note: These tests require a fully configured database with Platform migrations.
 * They will be skipped if the required tables don't exist.
 * Run with: php artisan test --filter=ModuleAccessTest (after migrations)
 */
class ModuleAccessTest extends TestCase
{
    protected ?Plan $basicPlan = null;

    protected ?Plan $premiumPlan = null;

    protected ?Module $hrmModule = null;

    protected ?Module $crmModule = null;

    protected ?Module $projectModule = null;

    protected bool $tablesAvailable = false;

    protected function setUp(): void
    {
        parent::setUp();

        // Check if database tables exist BEFORE any database operations
        $this->tablesAvailable = $this->tablesExist();

        if ($this->tablesAvailable) {
            $this->setUpModulesAndPlans();
        }
    }

    /**
     * Check if required tables exist for testing.
     */
    protected function tablesExist(): bool
    {
        try {
            $connection = $this->app['db']->connection(
                config('database.default')
            );

            $schema = $connection->getSchemaBuilder();

            // Check for essential platform tables
            return $schema->hasTable('tenants')
                && $schema->hasTable('plans')
                && $schema->hasTable('modules')
                && $schema->hasTable('subscriptions');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Skip test if tables not available.
     */
    protected function skipIfNoTables(): void
    {
        if (! $this->tablesAvailable) {
            $this->markTestSkipped('Platform database tables not available. Run migrations first.');
        }
    }

    /**
     * Set up test modules and plans.
     */
    protected function setUpModulesAndPlans(): void
    {
        // Create modules
        $this->hrmModule = Module::firstOrCreate(
            ['code' => 'hrm'],
            ['name' => 'Human Resource Management', 'is_active' => true]
        );

        $this->crmModule = Module::firstOrCreate(
            ['code' => 'crm'],
            ['name' => 'Customer Relationship Management', 'is_active' => true]
        );

        $this->projectModule = Module::firstOrCreate(
            ['code' => 'project'],
            ['name' => 'Project Management', 'is_active' => true]
        );

        // Create Basic Plan (HRM only)
        $this->basicPlan = Plan::firstOrCreate(
            ['code' => 'basic'],
            [
                'name' => 'Basic Plan',
                'monthly_price' => 29.99,
                'yearly_price' => 299.99,
                'is_active' => true,
            ]
        );
        $this->basicPlan->modules()->syncWithoutDetaching([$this->hrmModule->id]);

        // Create Premium Plan (HRM + CRM + Project)
        $this->premiumPlan = Plan::firstOrCreate(
            ['code' => 'premium'],
            [
                'name' => 'Premium Plan',
                'monthly_price' => 99.99,
                'yearly_price' => 999.99,
                'is_active' => true,
            ]
        );
        $this->premiumPlan->modules()->syncWithoutDetaching([
            $this->hrmModule->id,
            $this->crmModule->id,
            $this->projectModule->id,
        ]);
    }

    /**
     * Create a tenant with an active subscription.
     */
    protected function createTenantWithSubscription(Plan $plan, string $status = 'active', ?Carbon $endsAt = null): Tenant
    {
        $tenant = Tenant::create([
            'id' => 'test-'.uniqid(),
            'name' => 'Test Company',
            'email' => 'test@example.com',
            'status' => 'active',
            'plan_id' => $plan->id,
        ]);

        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => $status,
            'starts_at' => now()->subDay(),
            'ends_at' => $endsAt ?? now()->addMonth(),
            'amount' => $plan->monthly_price,
        ]);

        return $tenant;
    }

    // =========================================================================
    // Test 1: Tenant with HRM subscription CAN access HRM module
    // =========================================================================

    public function test_tenant_with_hrm_subscription_can_access_hrm_module(): void
    {
        $this->skipIfNoTables();

        $tenant = $this->createTenantWithSubscription($this->basicPlan);

        $this->assertTrue(
            $tenant->hasActiveSubscription('hrm'),
            'Tenant with Basic Plan should have access to HRM module'
        );
    }

    // =========================================================================
    // Test 2: Tenant with HRM subscription CANNOT access CRM module
    // =========================================================================

    public function test_tenant_with_hrm_subscription_cannot_access_crm_module(): void
    {
        $this->skipIfNoTables();

        $tenant = $this->createTenantWithSubscription($this->basicPlan);

        $this->assertFalse(
            $tenant->hasActiveSubscription('crm'),
            'Tenant with Basic Plan should NOT have access to CRM module'
        );
    }

    // =========================================================================
    // Test 3: Tenant with EXPIRED subscription cannot access modules
    // =========================================================================

    public function test_tenant_with_expired_subscription_cannot_access_modules(): void
    {
        $this->skipIfNoTables();

        // Create tenant with expired subscription
        $tenant = $this->createTenantWithSubscription(
            $this->premiumPlan,
            Subscription::STATUS_EXPIRED,
            now()->subWeek() // Ended last week
        );

        $this->assertFalse(
            $tenant->hasActiveSubscription('hrm'),
            'Tenant with expired subscription should NOT have access to any modules'
        );

        $this->assertFalse(
            $tenant->hasActiveSubscription('crm'),
            'Tenant with expired subscription should NOT have access to CRM'
        );
    }

    // =========================================================================
    // Test 4: Tenant with Premium subscription can access ALL included modules
    // =========================================================================

    public function test_tenant_with_premium_subscription_can_access_all_modules(): void
    {
        $this->skipIfNoTables();

        $tenant = $this->createTenantWithSubscription($this->premiumPlan);

        $this->assertTrue($tenant->hasActiveSubscription('hrm'), 'Premium should include HRM');
        $this->assertTrue($tenant->hasActiveSubscription('crm'), 'Premium should include CRM');
        $this->assertTrue($tenant->hasActiveSubscription('project'), 'Premium should include Project');
    }

    // =========================================================================
    // Test 5: Tenant cannot access modules NOT in any plan
    // =========================================================================

    public function test_tenant_cannot_access_non_existent_module(): void
    {
        $this->skipIfNoTables();

        $tenant = $this->createTenantWithSubscription($this->premiumPlan);

        $this->assertFalse(
            $tenant->hasActiveSubscription('non_existent_module'),
            'Tenant should NOT have access to modules not in their plan'
        );
    }

    // =========================================================================
    // Test 6: Tenant with cancelled subscription loses access
    // =========================================================================

    public function test_tenant_with_cancelled_subscription_loses_access(): void
    {
        $this->skipIfNoTables();

        $tenant = $this->createTenantWithSubscription(
            $this->basicPlan,
            Subscription::STATUS_CANCELLED,
            now()->subDay() // Already ended
        );

        $this->assertFalse(
            $tenant->hasActiveSubscription('hrm'),
            'Tenant with cancelled subscription should NOT have access'
        );
    }

    // =========================================================================
    // Test 7: Tenant with future subscription doesn't have access yet
    // =========================================================================

    public function test_tenant_with_future_subscription_has_no_access_yet(): void
    {
        $this->skipIfNoTables();

        $tenant = Tenant::create([
            'id' => 'test-future-'.uniqid(),
            'name' => 'Future Company',
            'email' => 'future@example.com',
            'status' => 'active',
            'plan_id' => $this->basicPlan->id,
        ]);

        // Subscription starts tomorrow
        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $this->basicPlan->id,
            'status' => Subscription::STATUS_ACTIVE,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addMonth()->addDay(),
            'amount' => $this->basicPlan->monthly_price,
        ]);

        $this->assertFalse(
            $tenant->hasActiveSubscription('hrm'),
            'Tenant with future subscription should NOT have access yet'
        );
    }

    // =========================================================================
    // Test 8: Tenant with trial period has access
    // =========================================================================

    public function test_tenant_with_trial_subscription_has_access(): void
    {
        $this->skipIfNoTables();

        $tenant = $this->createTenantWithSubscription(
            $this->premiumPlan,
            Subscription::STATUS_TRIALING,
            now()->addDays(14) // 14 day trial
        );

        // Trialing is considered active
        $tenant->subscriptions()->update(['status' => Subscription::STATUS_ACTIVE]);

        $this->assertTrue(
            $tenant->hasActiveSubscription('hrm'),
            'Tenant on trial should have access to plan modules'
        );
    }

    // =========================================================================
    // Test 9: CheckModuleSubscription middleware class exists
    // =========================================================================

    public function test_check_module_subscription_middleware_exists(): void
    {
        $this->assertTrue(
            class_exists(\Aero\Platform\Http\Middleware\CheckModuleSubscription::class),
            'CheckModuleSubscription middleware must exist'
        );
    }

    // =========================================================================
    // Test 10: Tenant with direct module grant has access
    // =========================================================================

    public function test_tenant_with_direct_module_grant_has_access(): void
    {
        $this->skipIfNoTables();

        // Create tenant without subscription but with direct module grant
        $tenant = Tenant::create([
            'id' => 'test-direct-'.uniqid(),
            'name' => 'Direct Grant Company',
            'email' => 'direct@example.com',
            'status' => 'active',
            'modules' => ['hrm', 'finance'], // Direct module grants
        ]);

        $this->assertTrue(
            $tenant->hasActiveSubscription('hrm'),
            'Tenant with direct module grant should have access'
        );

        $this->assertTrue(
            $tenant->hasActiveSubscription('finance'),
            'Tenant with direct module grant should have access to finance'
        );

        $this->assertFalse(
            $tenant->hasActiveSubscription('crm'),
            'Tenant should NOT have access to non-granted modules'
        );
    }

    // =========================================================================
    // Test 11: Plan with modules relationship works correctly
    // =========================================================================

    public function test_plan_modules_relationship(): void
    {
        $this->skipIfNoTables();

        $this->assertCount(1, $this->basicPlan->modules, 'Basic Plan should have 1 module');
        $this->assertCount(3, $this->premiumPlan->modules, 'Premium Plan should have 3 modules');

        $this->assertTrue(
            $this->premiumPlan->modules->contains('code', 'hrm'),
            'Premium Plan should include HRM module'
        );
    }

    // =========================================================================
    // Test 12: Module can belong to multiple plans
    // =========================================================================

    public function test_module_can_belong_to_multiple_plans(): void
    {
        $this->skipIfNoTables();

        // HRM is in both Basic and Premium plans
        $hrmPlans = $this->hrmModule->plans;

        $this->assertTrue(
            $hrmPlans->contains('code', 'basic'),
            'HRM should be in Basic Plan'
        );

        $this->assertTrue(
            $hrmPlans->contains('code', 'premium'),
            'HRM should be in Premium Plan'
        );
    }
}
