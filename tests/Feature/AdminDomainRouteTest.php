<?php

namespace Tests\Feature;

use Aero\Platform\Http\Middleware\IdentifyDomainContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * AdminDomainRouteTest
 * 
 * Tests that the admin domain root path redirects correctly to login or dashboard.
 */
class AdminDomainRouteTest extends TestCase
{
    /**
     * Test that admin domain root redirects to login when not authenticated.
     *
     * @return void
     */
    public function test_admin_root_redirects_to_login_when_not_authenticated(): void
    {
        // Create a request that simulates admin.domain.com
        $request = Request::create('http://admin.localhost/', 'GET');
        
        // Manually set the domain context as admin
        $request->attributes->set('domain_context', IdentifyDomainContext::CONTEXT_ADMIN);
        
        // Make the request to the root path
        $response = $this->get('/', ['HTTP_HOST' => 'admin.localhost']);
        
        // Assert it redirects to login
        $response->assertRedirect(route('admin.login'));
    }
    
    /**
     * Test that admin domain root redirects to dashboard when authenticated.
     *
     * @return void
     */
    public function test_admin_root_redirects_to_dashboard_when_authenticated(): void
    {
        // Note: This test requires a landlord user to be created and authenticated
        // This is a placeholder test structure
        $this->markTestSkipped('Requires landlord authentication setup');
        
        // TODO: Create a landlord user
        // TODO: Authenticate with landlord guard
        // $response = $this->actingAs($landlordUser, 'landlord')
        //     ->get('/', ['HTTP_HOST' => 'admin.localhost']);
        // $response->assertRedirect(route('admin.dashboard'));
    }
    
    /**
     * Test that platform domain root does not match admin routes.
     *
     * @return void
     */
    public function test_platform_domain_root_does_not_match_admin_routes(): void
    {
        // Make a request to the platform domain
        $response = $this->get('/', ['HTTP_HOST' => 'localhost']);
        
        // Should not redirect to admin routes
        // Platform domain has its own landing page
        $response->assertStatus(200);
    }
}
