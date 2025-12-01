<?php

namespace Tests\Feature\Auth;

use App\Http\Controllers\Auth\SocialAuthController;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    /**
     * Test that unsupported providers return error.
     */
    public function test_redirect_fails_for_unsupported_provider(): void
    {
        // Create a controller instance to test
        $controller = new SocialAuthController(
            $this->app->make(\App\Services\ModernAuthenticationService::class)
        );

        // Test the provider validation method via reflection
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('isProviderSupported');
        $method->setAccessible(true);

        $this->assertTrue($method->invoke($controller, 'google'));
        $this->assertTrue($method->invoke($controller, 'microsoft'));
        $this->assertTrue($method->invoke($controller, 'github'));
        $this->assertFalse($method->invoke($controller, 'facebook'));
        $this->assertFalse($method->invoke($controller, 'invalid'));
    }

    /**
     * Test that unconfigured providers are detected.
     */
    public function test_unconfigured_providers_are_detected(): void
    {
        // When no config is set, provider should be detected as unconfigured
        config(['services.google.client_id' => null]);
        config(['services.google.client_secret' => null]);

        $controller = new SocialAuthController(
            $this->app->make(\App\Services\ModernAuthenticationService::class)
        );

        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('isProviderConfigured');
        $method->setAccessible(true);

        $this->assertFalse($method->invoke($controller, 'google'));

        // Now configure it
        config(['services.google.client_id' => 'test-id']);
        config(['services.google.client_secret' => 'test-secret']);

        $this->assertTrue($method->invoke($controller, 'google'));
    }

    /**
     * Test provider-specific scopes are returned correctly.
     */
    public function test_provider_scopes_are_correct(): void
    {
        $controller = new SocialAuthController(
            $this->app->make(\App\Services\ModernAuthenticationService::class)
        );

        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('getProviderScopes');
        $method->setAccessible(true);

        $googleScopes = $method->invoke($controller, 'google');
        $this->assertContains('openid', $googleScopes);
        $this->assertContains('email', $googleScopes);

        $microsoftScopes = $method->invoke($controller, 'microsoft');
        $this->assertContains('User.Read', $microsoftScopes);

        $githubScopes = $method->invoke($controller, 'github');
        $this->assertContains('user:email', $githubScopes);
    }

    /**
     * Test provider labels are correct.
     */
    public function test_provider_labels_are_correct(): void
    {
        $controller = new SocialAuthController(
            $this->app->make(\App\Services\ModernAuthenticationService::class)
        );

        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('getProviderLabel');
        $method->setAccessible(true);

        $this->assertEquals('Google', $method->invoke($controller, 'google'));
        $this->assertEquals('Microsoft', $method->invoke($controller, 'microsoft'));
        $this->assertEquals('GitHub', $method->invoke($controller, 'github'));
    }

    /**
     * Test provider icons are correct.
     */
    public function test_provider_icons_are_correct(): void
    {
        $controller = new SocialAuthController(
            $this->app->make(\App\Services\ModernAuthenticationService::class)
        );

        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('getProviderIcon');
        $method->setAccessible(true);

        $this->assertEquals('google', $method->invoke($controller, 'google'));
        $this->assertEquals('microsoft', $method->invoke($controller, 'microsoft'));
        $this->assertEquals('github', $method->invoke($controller, 'github'));
    }
}
