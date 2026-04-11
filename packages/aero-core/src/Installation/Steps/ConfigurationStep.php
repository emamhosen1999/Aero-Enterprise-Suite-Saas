<?php

namespace Aero\Core\Installation\Steps;

/**
 * Configuration Step
 *
 * Ensures environment configuration is complete:
 * - APP_KEY is set
 * - Database credentials are configured
 * - Critical env vars are present
 */
class ConfigurationStep extends BaseInstallationStep
{
    public function name(): string
    {
        return 'config';
    }

    public function description(): string
    {
        return 'Verify environment configuration';
    }

    public function order(): int
    {
        return 1;
    }

    public function dependencies(): array
    {
        return []; // No dependencies
    }

    public function execute(): array
    {
        $missingVars = [];
        $requiredVars = [
            'APP_KEY',
            'APP_URL',
            'DB_CONNECTION',
            'DB_HOST',
            'DB_PORT',
            'DB_DATABASE',
            'DB_USERNAME',
        ];

        foreach ($requiredVars as $var) {
            if (empty(env($var))) {
                $missingVars[] = $var;
            }
        }

        if (!empty($missingVars)) {
            throw new \Exception('Missing environment variables: ' . implode(', ', $missingVars));
        }

        // Generate APP_KEY if not present
        if (env('APP_KEY') === null) {
            $this->log('Generating application key');
            $this->executeCommand('artisan', ['key:generate', '--force']);
        }

        return [
            'app_key_set' => env('APP_KEY') !== null,
            'database_configured' => env('DB_DATABASE') !== null,
            'required_vars_present' => count($missingVars) === 0,
        ];
    }

    public function validate(): bool
    {
        return env('APP_KEY') !== null
            && env('DB_DATABASE') !== null
            && env('DB_HOST') !== null;
    }

    /**
     * Execute artisan command
     */
    protected function executeCommand(string $command, array $args = []): void
    {
        if (function_exists('exec')) {
            $cmd = "php {$command} " . implode(' ', $args);
            exec($cmd);
        }
    }

    public function canSkip(): bool
    {
        return false; // Configuration is always required
    }
}
