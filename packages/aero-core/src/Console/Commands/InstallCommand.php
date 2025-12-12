<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Database\Seeders\CoreDatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Install Command for Aero Core
 *
 * Handles the complete installation of the aero-core package including:
 * - Publishing assets, config, and views
 * - Running migrations
 * - Seeding the database with initial data
 * - Setting up the host app for Inertia/React
 */
class InstallCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aero:install 
        {--force : Overwrite existing files}
        {--seed : Run database seeders after migration}
        {--migrate : Run database migrations}
        {--all : Run migrations and seed database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install Aero Core package - runs migrations, seeds database, and publishes assets';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('');
        $this->info('  ╔═══════════════════════════════════════╗');
        $this->info('  ║       AERO CORE INSTALLATION          ║');
        $this->info('  ╚═══════════════════════════════════════╝');
        $this->info('');

        // Determine what to run
        $runAll = $this->option('all');
        $runMigrate = $this->option('migrate') || $runAll;
        $runSeed = $this->option('seed') || $runAll;

        // If no options specified, ask interactively
        if (! $runMigrate && ! $runSeed && ! $this->option('force')) {
            $runMigrate = $this->confirm('Would you like to run database migrations?', true);
            $runSeed = $this->confirm('Would you like to seed the database with initial data?', true);
        }

        // Step 1: Publish assets
        $this->publishAssets();

        // Step 2: Run migrations
        if ($runMigrate) {
            $this->runMigrations();
        }

        // Step 3: Seed database
        if ($runSeed) {
            $this->seedDatabase();
        }

        // Step 4: Create DatabaseSeeder if it doesn't exist
        $this->ensureDatabaseSeeder();

        // Summary
        $this->info('');
        $this->info('  ┌───────────────────────────────────────┐');
        $this->info('  │  ✅ Aero Core installed successfully! │');
        $this->info('  └───────────────────────────────────────┘');
        $this->info('');
        $this->info('  Next steps:');
        $this->info('  1. Run: npm install && npm run build');
        $this->info('  2. Visit /login (email: admin@example.com, password: password)');
        $this->info('');

        return self::SUCCESS;
    }

    /**
     * Publish package assets.
     */
    protected function publishAssets(): void
    {
        $this->info('📦 Publishing assets...');

        $this->callSilently('vendor:publish', [
            '--tag' => 'aero-core-config',
            '--force' => $this->option('force'),
        ]);

        $this->info('  ✓ Config published');
    }

    /**
     * Run database migrations.
     */
    protected function runMigrations(): void
    {
        $this->info('🗄️  Running migrations...');

        $this->call('migrate', [
            '--force' => $this->option('force') || app()->environment('production'),
        ]);

        $this->info('  ✓ Migrations completed');
    }

    /**
     * Seed the database with core data.
     */
    protected function seedDatabase(): void
    {
        $this->info('🌱 Seeding database...');

        $this->call('db:seed', [
            '--class' => CoreDatabaseSeeder::class,
        ]);

        $this->info('  ✓ Database seeded');
    }

    /**
     * Ensure the host app has a DatabaseSeeder that calls our seeder.
     */
    protected function ensureDatabaseSeeder(): void
    {
        $seederPath = database_path('seeders/DatabaseSeeder.php');

        // If seeder doesn't exist, create it
        if (! File::exists($seederPath)) {
            $this->info('📝 Creating DatabaseSeeder...');

            $content = $this->getDatabaseSeederContent();
            File::ensureDirectoryExists(dirname($seederPath));
            File::put($seederPath, $content);

            $this->info('  ✓ DatabaseSeeder created');

            return;
        }

        // Check if our seeder is already called
        $existingContent = File::get($seederPath);

        if (str_contains($existingContent, 'CoreDatabaseSeeder')) {
            $this->info('  ✓ DatabaseSeeder already configured');

            return;
        }

        // Ask if we should modify existing seeder
        if ($this->confirm('Would you like to add Aero Core seeder to your existing DatabaseSeeder?', true)) {
            $this->info('📝 Updating DatabaseSeeder...');

            // Find the run method and add our seeder call
            $newContent = $this->addSeederCall($existingContent);
            File::put($seederPath, $newContent);

            $this->info('  ✓ DatabaseSeeder updated');
        }
    }

    /**
     * Get the content for a new DatabaseSeeder.
     */
    protected function getDatabaseSeederContent(): string
    {
        return <<<'PHP'
<?php

namespace Database\Seeders;

use Aero\Core\Database\Seeders\CoreDatabaseSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Aero Core (roles, users, settings)
        $this->call(CoreDatabaseSeeder::class);
    }
}
PHP;
    }

    /**
     * Add our seeder call to an existing DatabaseSeeder.
     */
    protected function addSeederCall(string $content): string
    {
        // Add import if not present
        if (! str_contains($content, 'use Aero\Core\Database\Seeders\CoreDatabaseSeeder;')) {
            $content = preg_replace(
                '/(namespace Database\\\\Seeders;)/',
                "$1\n\nuse Aero\\Core\\Database\\Seeders\\CoreDatabaseSeeder;",
                $content
            );
        }

        // Add the call in the run method
        // Look for the run method and add at the beginning
        $content = preg_replace(
            '/(public function run\(\).*?\{)/s',
            "$1\n        // Seed Aero Core (roles, users, settings)\n        \$this->call(CoreDatabaseSeeder::class);\n",
            $content,
            1
        );

        return $content;
    }
}
