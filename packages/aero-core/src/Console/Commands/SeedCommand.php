<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Database\Seeders\CoreDatabaseSeeder;
use Illuminate\Console\Command;

/**
 * Seed Command for Aero Core
 *
 * Seeds the database with core data (roles, users, settings).
 * This command can be run standalone or will be called automatically
 * by the install command.
 */
class SeedCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aero:seed 
        {--fresh : Wipe and re-seed the data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed the database with Aero Core data (roles, users, settings)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🌱 Seeding Aero Core database...');

        $this->call('db:seed', [
            '--class' => CoreDatabaseSeeder::class,
            '--force' => $this->option('fresh') || app()->environment('production'),
        ]);

        $this->info('');
        $this->info('✅ Aero Core database seeded successfully!');
        $this->info('');
        $this->info('  📧 Admin Email: admin@example.com');
        $this->info('  🔑 Admin Password: password');
        $this->info('');

        return self::SUCCESS;
    }
}
