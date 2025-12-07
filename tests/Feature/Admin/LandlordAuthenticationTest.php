<?php

namespace Tests\Feature\Admin;

use App\Models\Platform\LandlordUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class LandlordAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected string $adminDomain;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminDomain = env('ADMIN_DOMAIN', 'admin.aero-enterprise-suite-saas.com');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function landlord_login_page_is_accessible(): void
    {
        $response = $this->withServerVariables(['HTTP_HOST' => $this->adminDomain])
            ->get("http://{$this->adminDomain}/login");

        $response->assertStatus(200);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function landlord_user_can_login_with_valid_credentials(): void
    {
        $uniqueId = Str::random(8);
        $user = LandlordUser::create([
            'user_name' => "admin-{$uniqueId}",
            'name' => 'Admin Test',
            'email' => "admin-{$uniqueId}@example.com",
            'password' => Hash::make('password123'),
            'active' => true,
        ]);

        $response = $this->withServerVariables(['HTTP_HOST' => $this->adminDomain])
            ->post("http://{$this->adminDomain}/login", [
                'email' => "admin-{$uniqueId}@example.com",
                'password' => 'password123',
            ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user, 'landlord');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function landlord_user_cannot_login_with_invalid_credentials(): void
    {
        $uniqueId = Str::random(8);
        LandlordUser::create([
            'user_name' => "admin-{$uniqueId}",
            'name' => 'Admin Test',
            'email' => "admin-{$uniqueId}@example.com",
            'password' => Hash::make('password123'),
            'active' => true,
        ]);

        $response = $this->withServerVariables(['HTTP_HOST' => $this->adminDomain])
            ->post("http://{$this->adminDomain}/login", [
                'email' => "admin-{$uniqueId}@example.com",
                'password' => 'wrong-password',
            ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest('landlord');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function inactive_landlord_user_cannot_login(): void
    {
        $uniqueId = Str::random(8);
        LandlordUser::create([
            'user_name' => "admin-{$uniqueId}",
            'name' => 'Admin Test',
            'email' => "admin-{$uniqueId}@example.com",
            'password' => Hash::make('password123'),
            'active' => false,
        ]);

        $response = $this->withServerVariables(['HTTP_HOST' => $this->adminDomain])
            ->post("http://{$this->adminDomain}/login", [
                'email' => "admin-{$uniqueId}@example.com",
                'password' => 'password123',
            ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest('landlord');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function landlord_admin_dashboard_requires_authentication(): void
    {
        $response = $this->withServerVariables(['HTTP_HOST' => $this->adminDomain])
            ->get("http://{$this->adminDomain}/dashboard");

        $response->assertRedirect("http://{$this->adminDomain}/login");
    }
}
