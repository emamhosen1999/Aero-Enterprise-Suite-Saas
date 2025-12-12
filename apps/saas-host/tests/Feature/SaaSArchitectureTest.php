<?php

namespace Tests\Feature;

use Aero\Core\Contracts\TenantScopeInterface;
use Aero\Platform\Services\SaaSTenantScope;
use Tests\TestCase;

/**
 * SaaS Architecture Compliance Tests
 *
 * These tests verify that the SaaS architecture is properly configured:
 * - Platform Detection Bootstrapper (aero.mode = 'saas')
 * - TenantScopeInterface bound to SaaSTenantScope
 * - Module Access middleware registered
 * - Tenant lifecycle events configured
 */
class SaaSArchitectureTest extends TestCase
{
    /**
     * Test that aero.mode is set to 'saas' when Platform is loaded.
     */
    public function test_aero_mode_is_set_to_saas(): void
    {
        $this->assertEquals('saas', config('aero.mode'));
    }

    /**
     * Test that TenantScopeInterface is bound to SaaSTenantScope.
     */
    public function test_tenant_scope_interface_is_bound_to_saas_implementation(): void
    {
        $this->assertTrue(app()->bound(TenantScopeInterface::class));

        $tenantScope = app(TenantScopeInterface::class);

        $this->assertInstanceOf(SaaSTenantScope::class, $tenantScope);
        $this->assertEquals('saas', $tenantScope->getMode());
    }

    /**
     * Test that module access middleware is available.
     */
    public function test_module_access_middleware_is_registered(): void
    {
        $router = app('router');

        // Check middleware aliases are registered using getMiddleware()
        $middlewareAliases = $router->getMiddleware();

        $this->assertArrayHasKey('check.module', $middlewareAliases);
        $this->assertArrayHasKey('module', $middlewareAliases);
        $this->assertArrayHasKey('enforce.subscription', $middlewareAliases);
    }

    /**
     * Test that ModuleAccessService is available.
     */
    public function test_module_access_service_is_available(): void
    {
        $this->assertTrue(app()->bound(\Aero\Platform\Services\ModuleAccessService::class));
    }

    /**
     * Test that RoleModuleAccessService is available.
     */
    public function test_role_module_access_service_is_available(): void
    {
        $this->assertTrue(app()->bound(\Aero\Platform\Services\RoleModuleAccessService::class));
    }

    /**
     * Test that landlord auth guard is configured.
     */
    public function test_landlord_auth_guard_is_configured(): void
    {
        $guards = config('auth.guards');

        $this->assertArrayHasKey('landlord', $guards);
        $this->assertEquals('session', $guards['landlord']['driver']);
        $this->assertEquals('landlord_users', $guards['landlord']['provider']);
    }

    /**
     * Test that central database connection is configured.
     */
    public function test_central_database_connection_is_configured(): void
    {
        $connections = config('database.connections');

        $this->assertArrayHasKey('central', $connections);
    }

    /**
     * Test tenancy config is loaded.
     */
    public function test_tenancy_config_is_loaded(): void
    {
        // Verify tenancy config exists
        $this->assertNotNull(config('tenancy'));
        $this->assertTrue(is_array(config('tenancy')));
    }

    /**
     * Test that Tenant model has hasActiveSubscription method.
     */
    public function test_tenant_model_has_active_subscription_method(): void
    {
        $tenant = new \Aero\Platform\Models\Tenant;

        $this->assertTrue(
            method_exists($tenant, 'hasActiveSubscription'),
            'Tenant model must have hasActiveSubscription method for module gating'
        );
    }

    /**
     * Test that tenancy config uses custom Tenant model.
     */
    public function test_tenancy_uses_custom_tenant_model(): void
    {
        $this->assertEquals(
            \Aero\Platform\Models\Tenant::class,
            config('tenancy.tenant_model'),
            'Tenancy must use the custom Tenant model with hasActiveSubscription'
        );
    }

    /**
     * Test that CheckModuleSubscription middleware is registered.
     */
    public function test_check_subscription_middleware_is_registered(): void
    {
        $router = app('router');
        $middlewareAliases = $router->getMiddleware();

        $this->assertArrayHasKey('check.subscription', $middlewareAliases);
    }

    /**
     * Test that TenantCreated event listener is registered.
     */
    public function test_tenant_created_listener_is_registered(): void
    {
        $this->assertTrue(
            class_exists(\Aero\Platform\Listeners\TenantCreatedListener::class),
            'TenantCreatedListener must exist for running module migrations'
        );
    }

    /**
     * Test that HandleInertiaRequests middleware has getTenantSubscribedModules method.
     */
    public function test_handle_inertia_requests_has_subscription_helper(): void
    {
        $middleware = new \Aero\Platform\Http\Middleware\HandleInertiaRequests;

        $this->assertTrue(
            method_exists($middleware, 'getTenantSubscribedModules'),
            'HandleInertiaRequests must have getTenantSubscribedModules method for frontend sharing'
        );
    }
}
