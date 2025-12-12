<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Basic platform routes test.
 *
 * Note: Full authentication tests require proper database setup.
 * These tests verify route registration is working.
 */
class PlatformRoutesTest extends TestCase
{
    /**
     * Test landing page is accessible.
     */
    public function test_landing_page_is_accessible(): void
    {
        // Disable Vite manifest check for testing (no frontend build)
        $this->withoutVite();

        $response = $this->get('/');

        $response->assertStatus(200);
    }

    /**
     * Test that platform routes are registered.
     */
    public function test_platform_routes_are_registered(): void
    {
        // Check that key registration routes exist
        $this->assertTrue(\Route::has('platform.register.plan'));
        $this->assertTrue(\Route::has('platform.register.details'));
        $this->assertTrue(\Route::has('platform.register.payment'));
        $this->assertTrue(\Route::has('platform.register.success'));
    }

    /**
     * Test that admin routes are registered.
     */
    public function test_admin_routes_are_registered(): void
    {
        // Check that admin routes exist
        $this->assertTrue(\Route::has('admin.dashboard'));
        $this->assertTrue(\Route::has('admin.tenants.index'));
        $this->assertTrue(\Route::has('admin.users.index'));
        $this->assertTrue(\Route::has('admin.roles.index'));
        $this->assertTrue(\Route::has('admin.billing.index'));
    }

    /**
     * Test that billing routes are registered.
     */
    public function test_billing_routes_are_registered(): void
    {
        $this->assertTrue(\Route::has('admin.billing.subscriptions'));
        $this->assertTrue(\Route::has('admin.billing.invoices'));
    }

    /**
     * Test that settings routes are registered.
     */
    public function test_settings_routes_are_registered(): void
    {
        $this->assertTrue(\Route::has('admin.settings.index'));
        $this->assertTrue(\Route::has('admin.settings.branding'));
        $this->assertTrue(\Route::has('admin.settings.email'));
    }
}
