<?php

namespace App\Services\Platform;

use Illuminate\Support\Facades\File;

class InstallationService
{
    /**
     * Test database connection
     */
    public function testDatabaseConnection(
        string $host,
        int $port,
        string $database,
        string $username,
        ?string $password = null
    ): array {
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$database}";
            $pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 5,
            ]);

            // Test if we can query
            $pdo->query('SELECT 1');

            return [
                'success' => true,
                'message' => 'Connection successful',
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Update .env file with configuration
     */
    public function updateEnvironmentFile(array $dbConfig, array $platformConfig): void
    {
        $envPath = base_path('.env');

        if (! File::exists($envPath)) {
            // Copy from .env.example if .env doesn't exist
            if (File::exists(base_path('.env.example'))) {
                File::copy(base_path('.env.example'), $envPath);
            } else {
                throw new \Exception('.env file not found and .env.example is missing');
            }
        }

        $envContent = File::get($envPath);

        // Database configuration
        $envContent = $this->updateEnvValue($envContent, 'DB_HOST', $dbConfig['host']);
        $envContent = $this->updateEnvValue($envContent, 'DB_PORT', $dbConfig['port']);
        $envContent = $this->updateEnvValue($envContent, 'DB_DATABASE', $dbConfig['database']);
        $envContent = $this->updateEnvValue($envContent, 'DB_USERNAME', $dbConfig['username']);
        $envContent = $this->updateEnvValue($envContent, 'DB_PASSWORD', $dbConfig['password'] ?? '');

        // Platform configuration
        $envContent = $this->updateEnvValue($envContent, 'APP_NAME', $platformConfig['app_name']);
        $envContent = $this->updateEnvValue($envContent, 'APP_URL', $platformConfig['app_url']);
        $envContent = $this->updateEnvValue($envContent, 'MAIL_FROM_ADDRESS', $platformConfig['mail_from_address']);
        $envContent = $this->updateEnvValue($envContent, 'MAIL_FROM_NAME', $platformConfig['mail_from_name']);

        File::put($envPath, $envContent);
    }

    /**
     * Update a single environment variable
     */
    private function updateEnvValue(string $envContent, string $key, mixed $value): string
    {
        // Escape special characters in value
        $value = str_replace('"', '\"', (string) $value);

        // Check if value needs quotes
        $needsQuotes = preg_match('/[\s#]/', $value) || empty($value);
        $formattedValue = $needsQuotes ? "\"{$value}\"" : $value;

        // Check if key exists
        if (preg_match("/^{$key}=.*/m", $envContent)) {
            // Update existing key
            return preg_replace(
                "/^{$key}=.*/m",
                "{$key}={$formattedValue}",
                $envContent
            );
        }

        // Add new key
        return $envContent."\n{$key}={$formattedValue}";
    }
}
