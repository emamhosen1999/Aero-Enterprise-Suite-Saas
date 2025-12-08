<?php

namespace Aero\Platform\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class UpdateAppVersion extends Command
{
    protected $signature = 'app:version {version? : The new version (e.g., 1.2.3)} {--type= : Version type: patch, minor, or major}';

    protected $description = 'Update the application version in .env and package.json';

    public function handle()
    {
        $version = $this->argument('version');
        $type = $this->option('type');

        if (! $version && ! $type) {
            $this->error('Please provide either a version number or a version type (patch, minor, major)');

            return 1;
        }

        if ($type && ! in_array($type, ['patch', 'minor', 'major'])) {
            $this->error('Version type must be one of: patch, minor, major');

            return 1;
        }

        // Get current version
        $currentVersion = config('app.version', '1.0.0');

        if ($type) {
            $version = $this->incrementVersion($currentVersion, $type);
        }

        if (! $this->isValidSemVer($version)) {
            $this->error('Invalid semantic version format. Use format: x.y.z');

            return 1;
        }

        $this->info("Updating application version from {$currentVersion} to {$version}");

        // Update .env file
        $this->updateEnvFile($version);

        // Update package.json
        $this->updatePackageJson($version);

        $this->info("✅ Application version updated to {$version}");
        $this->info("💡 Run 'npm run build' to update PWA version");

        return 0;
    }

    private function incrementVersion($version, $type)
    {
        $parts = explode('.', $version);
        $major = (int) ($parts[0] ?? 1);
        $minor = (int) ($parts[1] ?? 0);
        $patch = (int) ($parts[2] ?? 0);

        switch ($type) {
            case 'major':
                $major++;
                $minor = 0;
                $patch = 0;
                break;
            case 'minor':
                $minor++;
                $patch = 0;
                break;
            case 'patch':
                $patch++;
                break;
        }

        return "{$major}.{$minor}.{$patch}";
    }

    private function isValidSemVer($version)
    {
        return preg_match('/^\d+\.\d+\.\d+$/', $version);
    }

    private function updateEnvFile($version)
    {
        $envPath = base_path('.env');

        if (! File::exists($envPath)) {
            $this->warn('.env file not found, skipping .env update');

            return;
        }

        $envContent = File::get($envPath);

        if (strpos($envContent, 'APP_VERSION=') !== false) {
            $envContent = preg_replace('/^APP_VERSION=.*$/m', "APP_VERSION={$version}", $envContent);
        } else {
            $envContent .= "\nAPP_VERSION={$version}\n";
        }

        File::put($envPath, $envContent);
        $this->line('Updated .env file');
    }

    private function updatePackageJson($version)
    {
        $packagePath = base_path('package.json');

        if (! File::exists($packagePath)) {
            $this->warn('package.json file not found, skipping package.json update');

            return;
        }

        $packageContent = json_decode(File::get($packagePath), true);
        $packageContent['version'] = $version;

        File::put($packagePath, json_encode($packageContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");
        $this->line('Updated package.json file');
    }
}
