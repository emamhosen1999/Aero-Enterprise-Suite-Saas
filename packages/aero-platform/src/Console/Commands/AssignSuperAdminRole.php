<?php

namespace Aero\Platform\Console\Commands;

use Aero\Core\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignSuperAdminRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assign:super-admin {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign Super Administrator role to a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        if (! $email) {
            // Get first user if no email provided
            $user = User::first();
            if (! $user) {
                $this->error('No users found in the database.');

                return 1;
            }
        } else {
            $user = User::where('email', $email)->first();
            if (! $user) {
                $this->error("User with email {$email} not found.");

                return 1;
            }
        }

        // Check if Super Administrator role exists
        $superAdminRole = Role::where('name', 'Super Administrator')->first();
        if (! $superAdminRole) {
            $this->error('Super Administrator role not found. Please run the seeder first.');

            return 1;
        }

        // Assign the role
        $user->assignRole('Super Administrator');

        $this->info("Super Administrator role assigned to: {$user->name} ({$user->email})");

        return 0;
    }
}
