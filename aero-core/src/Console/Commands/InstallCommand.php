<?php

namespace Aero\Core\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

/**
 * Install Aero Core package into a fresh Laravel application.
 *
 * This command sets up everything needed to run aero-core:
 * - Publishes vite.config.js (if not exists)
 * - Publishes package.json dependencies
 * - Publishes CSS file
 * - Runs npm install
 */
class InstallCommand extends Command
{
    protected $signature = 'aero:install 
        {--force : Overwrite existing files}
        {--no-npm : Skip npm install}';

    protected $description = 'Install Aero Core package - sets up frontend configuration';

    protected Filesystem $files;

    public function __construct(Filesystem $files)
    {
        parent::__construct();
        $this->files = $files;
    }

    public function handle(): int
    {
        $this->info('Installing Aero Core...');

        $this->publishViteConfig();
        $this->publishPackageJson();
        $this->publishHeroTheme();
        $this->publishCss();

        if (! $this->option('no-npm')) {
            $this->runNpmInstall();
        }

        // Run migrations
        $this->runMigrations();

        // Run seeders
        $this->runSeeder();

        $this->newLine();
        $this->info('✅ Aero Core installed successfully!');
        $this->newLine();
        $this->line('Default credentials:');
        $this->line('  Email: <fg=cyan>admin@example.com</>');
        $this->line('  Password: <fg=cyan>password</>');
        $this->newLine();
        $this->line('Next steps:');
        $this->line('  1. Run <fg=yellow>npm install</> (if not already done)');
        $this->line('  2. Run <fg=yellow>npm run build</> to compile assets');
        $this->line('  3. Visit your app at <fg=cyan>http://localhost:8000</>');

        return self::SUCCESS;
    }

    protected function publishViteConfig(): void
    {
        $stub = __DIR__.'/../../../stubs/vite.config.js.stub';
        $target = base_path('vite.config.js');

        if ($this->files->exists($target) && ! $this->option('force')) {
            if (! $this->confirm('vite.config.js already exists. Overwrite?', false)) {
                $this->line('  <fg=yellow>Skipped</> vite.config.js');

                return;
            }
        }

        $this->files->copy($stub, $target);
        $this->line('  <fg=green>Published</> vite.config.js');
    }

    protected function publishPackageJson(): void
    {
        $stubPath = __DIR__.'/../../../stubs/package.json.stub';
        $targetPath = base_path('package.json');

        // Read stub content
        $stubContent = json_decode($this->files->get($stubPath), true);

        if ($this->files->exists($targetPath)) {
            // Merge with existing package.json
            $existingContent = json_decode($this->files->get($targetPath), true) ?: [];

            // Merge dependencies
            $existingContent['dependencies'] = array_merge(
                $existingContent['dependencies'] ?? [],
                $stubContent['dependencies'] ?? []
            );

            // Merge devDependencies
            $existingContent['devDependencies'] = array_merge(
                $existingContent['devDependencies'] ?? [],
                $stubContent['devDependencies'] ?? []
            );

            // Ensure type is module
            $existingContent['type'] = 'module';

            // Add scripts if missing
            $existingContent['scripts'] = array_merge(
                $existingContent['scripts'] ?? [],
                array_filter($stubContent['scripts'] ?? [], function ($key) use ($existingContent) {
                    return ! isset($existingContent['scripts'][$key]);
                }, ARRAY_FILTER_USE_KEY)
            );

            $this->files->put(
                $targetPath,
                json_encode($existingContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n"
            );
            $this->line('  <fg=green>Merged</> package.json dependencies');
        } else {
            // Create new package.json
            $this->files->put(
                $targetPath,
                json_encode($stubContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n"
            );
            $this->line('  <fg=green>Published</> package.json');
        }
    }

    protected function publishHeroTheme(): void
    {
        $stub = __DIR__.'/../../../hero.ts';
        $target = base_path('hero.ts');

        if ($this->files->exists($target) && ! $this->option('force')) {
            if (! $this->confirm('hero.ts already exists. Overwrite?', false)) {
                $this->line('  <fg=yellow>Skipped</> hero.ts');
                return;
            }
        }

        $this->files->copy($stub, $target);
        $this->line('  <fg=green>Published</> hero.ts');
    }

    protected function publishCss(): void
    {
        $source = __DIR__.'/../../../resources/css/app.css';
        $targetDir = resource_path('css');
        $target = $targetDir.'/app.css';

        // Ensure directory exists
        if (! $this->files->isDirectory($targetDir)) {
            $this->files->makeDirectory($targetDir, 0755, true);
        }

        // Only create a minimal CSS that imports from the package
        if (! $this->files->exists($target) || $this->option('force')) {
            $cssContent = <<<'CSS'
/* Aero Core Styles */
/* The main styles are loaded from vendor/aero/core/resources/css/app.css via Vite */
@import "tailwindcss";
CSS;

            $this->files->put($target, $cssContent);
            $this->line('  <fg=green>Created</> resources/css/app.css');
        }
    }

    protected function runNpmInstall(): void
    {
        $this->newLine();
        $this->info('Running npm install...');

        $process = proc_open(
            'npm install',
            [
                0 => STDIN,
                1 => STDOUT,
                2 => STDERR,
            ],
            $pipes,
            base_path()
        );

        if (is_resource($process)) {
            proc_close($process);
        }
    }

    protected function runMigrations(): void
    {
        $this->newLine();
        $this->info('Running migrations...');

        try {
            $this->call('migrate', ['--force' => true]);
            $this->line('  <fg=green>Migrated</> database tables');
        } catch (\Throwable $e) {
            // Check if error is due to existing tables
            if (str_contains($e->getMessage(), 'already exists')) {
                $this->line('  <fg=yellow>Skipped</> migrations: Tables already exist');
            } else {
                $this->error('  <fg=red>Failed</> to run migrations: ' . $e->getMessage());
            }
        }
    }

    protected function runSeeder(): void
    {
        $this->newLine();
        $this->info('Seeding database...');

        try {
            $seeder = new \Aero\Core\Database\Seeders\CoreDatabaseSeeder();
            $seeder->setCommand($this);
            $seeder->run();
            $this->line('  <fg=green>Seeded</> database');
        } catch (\Throwable $e) {
            $this->warn('  <fg=yellow>Skipped</> seeding: ' . $e->getMessage());
        }
    }
}
