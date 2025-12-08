<?php

namespace Tests\Feature\Admin;

use Aero\Platform\Models\LandlordUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function admin_inertia_share_includes_session_and_permissions(): void
    {
        $user = LandlordUser::create([
            'user_name' => 'admin-tester',
            'name' => 'Admin Tester',
            'email' => 'admin-tester@example.com',
            'password' => Hash::make('password'),
            'active' => true,
        ]);
        $adminDomain = env('ADMIN_DOMAIN', 'admin.aero-enterprise-suite-saas.com');
        $response = $this->actingAs($user, 'landlord')
            ->withServerVariables(['HTTP_HOST' => $adminDomain])
            ->get("http://{$adminDomain}/dashboard");

        $response->assertStatus(200);

        $response->assertInertia(function (AssertableInertia $page) use ($user) {
            $page->where('auth.isAuthenticated', true)
                ->where('auth.sessionValid', true)
                ->where('auth.user.id', $user->id)
                ->has('auth.role'); // Admin shares 'role' (singular), not 'roles'
        });
    }
}
