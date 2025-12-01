<?php

namespace Database\Seeders;

use App\Models\LandlordUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminPanelUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminEmail = config('platform.admin.email', 'platform.super@aero-suite.test');
        $adminName = config('platform.admin.name', 'Platform Super Admin');
        $adminPassword = config('platform.admin.password', 'ChangeMe123!');

        $user = LandlordUser::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => $adminName,
                'user_name' => Str::slug($adminName),
                'phone' => null,
                'password' => Hash::make($adminPassword),
                'active' => true,
            ]
        );

        $roleSeeder = new AdminPanelRoleSeeder;
        if (method_exists($roleSeeder, 'setCommand') && $this->command) {
            $roleSeeder->setCommand($this->command);
        }
        $roleSeeder->run();

        $user->syncRoles(['Platform Super Admin']);

        if ($this->command) {
            $this->command->info('✅ Platform admin user seeded successfully.');
        }
    }
}
