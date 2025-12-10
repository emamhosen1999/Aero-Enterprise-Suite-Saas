<?php

namespace Aero\Core\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

/**
 * Install Aero Core package into a fresh Laravel application.
 *
 * This command sets up everything needed to run aero-core:
 * - Publishes all frontend files (JS, CSS, views) to app resources
 * - Publishes vite.config.js configured for local resources
 * - Publishes package.json with all dependencies
 * - Runs npm install and migrations
 * 
 * Backend files (Controllers, Models, Routes, Middleware) remain in the package.
 */
class InstallCommand extends Command
{
    protected $signature = 'aero:install 
        {--force : Overwrite existing files}
        {--no-npm : Skip npm install}';

    protected $description = 'Install Aero Core package - publishes frontend files and configures the application';

    protected Filesystem $files;

    public function __construct(Filesystem $files)
    {
        parent::__construct();
        $this->files = $files;
    }

    public function handle(): int
    {
        $this->info('Installing Aero Core...');
        $this->newLine();

        // Frontend files - published to app
        $this->info('Publishing frontend files...');
        $this->publishJavaScript();
        $this->publishCss();
        $this->publishViews();
        
        // Config files
        $this->newLine();
        $this->info('Publishing configuration files...');
        $this->publishViteConfig();
        $this->publishPostCssConfig();
        $this->publishPackageJson();
        $this->publishHeroTheme();

        // Bootstrap configuration and routes
        $this->newLine();
        $this->info('Updating bootstrap configuration...');
        $this->updateBootstrapApp();
        $this->updateWebRoutes();

        if (! $this->option('no-npm')) {
            $this->runNpmInstall();
        }

        $this->runNpmBuild();

        // Run migrations with fresh database
        $this->runMigrations();

        $this->newLine();
        $this->info('✅ Aero Core installed successfully!');
        $this->newLine();
        $this->line('<fg=green>What was installed:</>');
        $this->line('  • Frontend files: <fg=cyan>resources/js/</> (app.jsx + Core/ subdirectory)');
        $this->line('  • CSS files: <fg=cyan>resources/css/app.css</> (Tailwind + HeroUI)');
        $this->line('  • Views: <fg=cyan>resources/views/app.blade.php</> (Inertia root)');
        $this->line('  • Theme: <fg=cyan>hero.ts</> (HeroUI theme configuration)');
        $this->line('  • Bootstrap: <fg=cyan>bootstrap/app.php</> (route registration)');
        $this->line('  • Backend: <fg=yellow>Routes, Controllers, Models in vendor package</>');
        $this->newLine();
        $this->line('<fg=green>Default credentials:</>');
        $this->line('  Email: <fg=cyan>admin@example.com</>');
        $this->line('  Password: <fg=cyan>password</>');
        $this->line('  Role: <fg=cyan>Super Administrator</>');
        $this->newLine();
        $this->line('<fg=green>Next steps:</>');
        $this->line('  1. Run <fg=yellow>npm run build</> to compile assets');
        $this->line('  2. Run <fg=yellow>php artisan serve</> to start the server');
        $this->line('  3. Visit your app at <fg=cyan>http://localhost:8000</>');

        return self::SUCCESS;
    }

    protected function publishJavaScript(): void
    {
        $sourceDir = __DIR__.'/../../../resources/js';
        $targetDir = resource_path('js');

        if (! $this->files->isDirectory($sourceDir)) {
            $this->warn('  <fg=yellow>Warning:</> Source JS directory not found');
            return;
        }

        // Always delete existing JS directory to ensure package updates are applied
        if ($this->files->isDirectory($targetDir)) {
            $this->files->deleteDirectory($targetDir);
            $this->line('  <fg=yellow>Cleaned</> existing resources/js/');
        }

        // Copy entire JS directory fresh from package
        $this->copyDirectory($sourceDir, $targetDir);
        $this->line('  <fg=green>Published</> resources/js/ (app.jsx + Core/ subdirectory)');
    }

    protected function publishCss(): void
    {
        $sourceDir = __DIR__.'/../../../resources/css';
        $targetDir = resource_path('css');

        if (! $this->files->isDirectory($sourceDir)) {
            $this->warn('  <fg=yellow>Warning:</> Source CSS directory not found');
            return;
        }

        // Always delete existing CSS directory to ensure package updates are applied
        if ($this->files->isDirectory($targetDir)) {
            $this->files->deleteDirectory($targetDir);
            $this->line('  <fg=yellow>Cleaned</> existing resources/css/');
        }

        // Copy entire CSS directory fresh from package
        $this->copyDirectory($sourceDir, $targetDir);
        
        // Update app.css to use local paths instead of vendor paths
        $appCss = $targetDir.'/app.css';
        if ($this->files->exists($appCss)) {
            $content = $this->files->get($appCss);
            
            // Fix @plugin path - hero.ts is at app root
            $content = preg_replace(
                '/@plugin\s+["\'].*?hero\.ts["\'];?/',
                '@plugin "../../hero.ts";',
                $content
            );
            
            // Fix @source path for HeroUI theme
            $content = preg_replace(
                '/@source\s+["\'].*?@heroui\/theme.*?["\'];?/',
                '@source "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}";',
                $content
            );
            
            $this->files->put($appCss, $content);
        }
        
        $this->line('  <fg=green>Published</> resources/css/app.css');
    }

    protected function publishViews(): void
    {
        $stub = __DIR__.'/../../../stubs/app.blade.php.stub';
        $targetDir = resource_path('views');
        $target = $targetDir.'/app.blade.php';

        if (! $this->files->isDirectory($targetDir)) {
            $this->files->makeDirectory($targetDir, 0755, true);
        }

        // Always force overwrite to ensure package updates are applied
        // Backup existing if it exists
        if ($this->files->exists($target)) {
            $backupPath = $target.'.backup';
            $this->files->copy($target, $backupPath);
            $this->line('  <fg=yellow>Backed up</> existing app.blade.php to app.blade.php.backup');
        }

        // Read stub and update paths to use local resources
        $content = $this->files->get($stub);
        
        // Update Vite paths from vendor to local directory
        $content = str_replace(
            "vendor/aero/core/resources/css/app.css",
            "resources/css/app.css",
            $content
        );
        $content = str_replace(
            "vendor/aero/core/resources/js/app.jsx",
            "resources/js/app.jsx",
            $content
        );
        
        $this->files->put($target, $content);
        $this->line('  <fg=green>Published</> resources/views/app.blade.php');
    }

    protected function publishViteConfig(): void
    {
        $target = base_path('vite.config.js');

        // Always force overwrite to ensure package updates are applied
        // Backup existing if it exists
        if ($this->files->exists($target)) {
            $backupPath = $target.'.backup';
            $this->files->copy($target, $backupPath);
            $this->line('  <fg=yellow>Backed up</> existing vite.config.js');
        }

        // Create a vite config that uses LOCAL resources, not vendor
        $viteConfig = <<<'JS'
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx'
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '@core': path.resolve(__dirname, 'resources/js/Core'),
            'ziggy-js': path.resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },

    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
        cors: true,
    },
});
JS;

        $this->files->put($target, $viteConfig);
        $this->line('  <fg=green>Published</> vite.config.js');
    }

    protected function publishPostCssConfig(): void
    {
        $stub = __DIR__.'/../../../stubs/postcss.config.js.stub';
        $target = base_path('postcss.config.js');

        if ($this->files->exists($target) && ! $this->option('force')) {
            $this->line('  <fg=yellow>Skipped</> postcss.config.js (exists)');
            return;
        }

        $this->files->copy($stub, $target);
        $this->line('  <fg=green>Published</> postcss.config.js');
    }

    protected function publishPackageJson(): void
    {
        $stubPath = __DIR__.'/../../../stubs/package.json.stub';
        $targetPath = base_path('package.json');

        $stubContent = json_decode($this->files->get($stubPath), true);

        if ($this->files->exists($targetPath)) {
            $existingContent = json_decode($this->files->get($targetPath), true) ?: [];

            $existingContent['dependencies'] = array_merge(
                $existingContent['dependencies'] ?? [],
                $stubContent['dependencies'] ?? []
            );

            $existingContent['devDependencies'] = array_merge(
                $existingContent['devDependencies'] ?? [],
                $stubContent['devDependencies'] ?? []
            );

            $existingContent['type'] = 'module';

            $existingContent['scripts'] = array_merge(
                $stubContent['scripts'] ?? [],
                $existingContent['scripts'] ?? []
            );

            $this->files->put(
                $targetPath,
                json_encode($existingContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n"
            );
            $this->line('  <fg=green>Merged</> package.json dependencies');
        } else {
            $this->files->put(
                $targetPath,
                json_encode($stubContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n"
            );
            $this->line('  <fg=green>Published</> package.json');
        }
    }

    protected function publishHeroTheme(): void
    {
        $source = __DIR__.'/../../../hero.ts';
        $target = base_path('hero.ts');

        // Always force overwrite to ensure package updates are applied
        // Backup existing if it exists
        if ($this->files->exists($target)) {
            $backupPath = $target.'.backup';
            $this->files->copy($target, $backupPath);
            $this->line('  <fg=yellow>Backed up</> existing hero.ts');
        }

        // Read and update hero.ts to use standard import (no dynamic require needed)
        $content = $this->files->get($source);
        
        // Replace the dynamic require with standard import since we're now at app root
        $content = preg_replace(
            '/\/\/ hero\.ts.*?export default heroui\(\{/s',
            "// hero.ts - HeroUI theme configuration\nimport { heroui } from \"@heroui/react\";\n\nexport default heroui({",
            $content
        );

        $this->files->put($target, $content);
        $this->line('  <fg=green>Published</> hero.ts');
    }

    protected function copyDirectory(string $source, string $target): void
    {
        if (! $this->files->isDirectory($target)) {
            $this->files->makeDirectory($target, 0755, true);
        }

        $items = $this->files->allFiles($source, true);

        foreach ($items as $item) {
            $relativePath = str_replace($source, '', $item->getPathname());
            $targetPath = $target.$relativePath;
            $targetDirPath = dirname($targetPath);

            if (! $this->files->isDirectory($targetDirPath)) {
                $this->files->makeDirectory($targetDirPath, 0755, true);
            }

            // Always copy/overwrite to ensure package updates are applied
            $this->files->copy($item->getPathname(), $targetPath);
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

     protected function runNpmBuild(): void
    {
        $this->newLine();
        $this->info('Running npm build...');

        // Clean build directory first to ensure fresh build
        $buildPath = public_path('build');
        if ($this->files->isDirectory($buildPath)) {
            $this->files->deleteDirectory($buildPath);
            $this->line('  <fg=yellow>Cleaned</> existing build directory');
        }

        $process = proc_open(
            'npm run build',
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
            // Use migrate:fresh with --seed to start with clean database and seed data
            $this->call('migrate:fresh', [
                '--force' => true,
                '--seed' => true,
                '--seeder' => 'Aero\\Core\\Database\\Seeders\\CoreDatabaseSeeder',
            ]);
            $this->line('  <fg=green>✓</> Database migrated and seeded successfully');
        } catch (\Throwable $e) {
            $this->error('  <fg=red>Failed</> to run migrations: '.$e->getMessage());
        }
    }

    /**
     * Update bootstrap/app.php to register Aero Core routes.
     * 
     * The AeroCoreServiceProvider automatically loads all routes from the package.
     * Remove any references to routes/api.php if present, as these don't exist in test app.
     */
    protected function updateBootstrapApp(): void
    {
        $bootstrapPath = base_path('bootstrap/app.php');

        if (! $this->files->exists($bootstrapPath)) {
            $this->warn('  <fg=yellow>Warning:</> bootstrap/app.php not found');
            return;
        }

        $content = $this->files->get($bootstrapPath);
        $originalContent = $content;
        
        // Remove api: routes/api.php line if present (since test app doesn't have this file)
        $content = preg_replace(
            '/\s*api:\s*__DIR__\.\s*[\'"]\.\.\/routes\/api\.php[\'"],?\s*\n/',
            '',
            $content
        );

        if ($content !== $originalContent) {
            $this->files->put($bootstrapPath, $content);
            $this->line('  <fg=green>Updated</> bootstrap/app.php (removed api routes reference)');
            $this->line('  <fg=cyan>Info:</> API routes will be loaded from vendor/aero/core package');
        } else {
            $this->line('  <fg=green>✓</> bootstrap/app.php is correctly configured');
        }

        // Inform about route registration
        $this->line('  <fg=cyan>Info:</> Routes are automatically registered via AeroCoreServiceProvider');
        $this->line('  <fg=cyan>Info:</> Web routes: vendor/aero/core/routes/web.php');
        $this->line('  <fg=cyan>Info:</> API routes: vendor/aero/core/routes/api.php (with /api prefix)');
    }

    /**
     * Update routes/web.php to remove default welcome route.
     * 
     * The package provides all necessary routes including the root route.
     * We need to clear the default Laravel welcome route.
     */
    protected function updateWebRoutes(): void
    {
        $webRoutesPath = base_path('routes/web.php');

        if (! $this->files->exists($webRoutesPath)) {
            $this->warn('  <fg=yellow>Warning:</> routes/web.php not found');
            return;
        }

        $content = $this->files->get($webRoutesPath);

        // Check if it contains the default welcome route
        if (str_contains($content, "return view('welcome')")) {
            // Replace with a comment explaining routes come from package
            $newContent = <<<'PHP'
<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All web routes are automatically loaded from the aero-core package.
| The package routes are registered via AeroCoreServiceProvider.
|
| Package routes include:
| - Authentication (login, register, forgot password, etc.)
| - Dashboard
| - User Management
| - Role Management
| - Settings
|
| You can add custom routes here if needed for your application.
|
*/

// Custom application routes go here...

PHP;

            $this->files->put($webRoutesPath, $newContent);
            $this->line('  <fg=green>Updated</> routes/web.php (removed welcome route)');
            $this->line('  <fg=cyan>Info:</> Root route (/) now comes from aero-core package');
        } else {
            $this->line('  <fg=green>✓</> routes/web.php is correctly configured');
        }
    }
}
