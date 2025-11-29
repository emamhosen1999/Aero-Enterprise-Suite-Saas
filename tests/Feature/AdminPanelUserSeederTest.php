<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminPanelUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminPanelUserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_panel_user_seeder_creates_super_admin(): void
    {
        config([
            'platform.admin.email' => 'seed-admin@example.com',
            'platform.admin.name' => 'Seed Admin',
            'platform.admin.password' => 'SeedPass123!',
        ]);

        $this->seed(AdminPanelUserSeeder::class);

        $user = User::whereEmail('seed-admin@example.com')->first();

        $this->assertNotNull($user, 'Expected seeded admin user to exist.');
        $this->assertTrue(Hash::check('SeedPass123!', $user->password));
        $this->assertTrue($user->hasRole('Platform Super Admin'));
    }
}
