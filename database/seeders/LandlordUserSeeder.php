<?php

namespace Database\Seeders;

use App\Models\LandlordUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LandlordUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the default super admin user if it doesn't exist
        LandlordUser::firstOrCreate(
            ['email' => 'admin@aero-enterprise-suite-saas.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Landlord super admin user created/verified.');
    }
}
