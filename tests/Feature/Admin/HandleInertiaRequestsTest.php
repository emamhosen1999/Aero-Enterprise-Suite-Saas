<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_inertia_share_includes_session_and_permissions(): void
    {
        $user = User::create([
            'user_name' => 'admin-tester',
            'name' => 'Admin Tester',
            'email' => 'admin-tester@example.com',
            'password' => Hash::make('password'),
        ]);
        $adminDomain = env('ADMIN_DOMAIN', 'admin.aero-enterprise-suite-saas.com');
        $response = $this->actingAs($user)
            ->withServerVariables(['HTTP_HOST' => $adminDomain])
            ->get("http://{$adminDomain}/dashboard");

        $response->assertStatus(200);

        $response->assertInertia(function (AssertableInertia $page) use ($user) {
            $page->where('auth.isAuthenticated', true)
                ->where('auth.sessionValid', true)
                ->where('auth.user.id', $user->id)
                ->where('auth.roles', [])
                ->where('auth.permissions', []);
        });
    }
}
