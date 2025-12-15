<?php

namespace Aero\Platform\Services\Monitoring;

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
     * Check if database server is reachable (without specifying database)
     */
    public function testServerConnection(
        string $host,
        int $port,
        string $username,
        ?string $password = null
    ): array {
        try {
            $dsn = "mysql:host={$host};port={$port}";
            $pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 5,
            ]);

            // Test if we can query
            $pdo->query('SELECT 1');

            return [
                'success' => true,
                'message' => 'Server connection successful',
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check if a database exists
     */
    public function databaseExists(
        string $host,
        int $port,
        string $database,
        string $username,
        ?string $password = null
    ): bool {
        try {
            $dsn = "mysql:host={$host};port={$port}";
            $pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 5,
            ]);

            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$database]);

            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            return false;
        }
    }

    /**
     * Create database if it doesn't exist
     *
     * @return array{success: bool, message: string, created: bool}
     */
    public function createDatabaseIfNotExists(
        string $host,
        int $port,
        string $database,
        string $username,
        ?string $password = null
    ): array {
        try {
            // Validate database name (prevent SQL injection)
            if (! preg_match('/^[a-zA-Z0-9_]+$/', $database)) {
                return [
                    'success' => false,
                    'message' => 'Invalid database name. Use only letters, numbers, and underscores.',
                    'created' => false,
                ];
            }

            $dsn = "mysql:host={$host};port={$port}";
            $pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 10,
            ]);

            // Check if database already exists
            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$database]);

            if ($stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => "Database '{$database}' already exists.",
                    'created' => false,
                ];
            }

            // Create the database with proper charset
            $pdo->exec("CREATE DATABASE `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            return [
                'success' => true,
                'message' => "Database '{$database}' created successfully.",
                'created' => true,
            ];
        } catch (\PDOException $e) {
            $errorMessage = $e->getMessage();

            // Provide user-friendly error messages
            if (str_contains($errorMessage, 'Access denied')) {
                return [
                    'success' => false,
                    'message' => 'Access denied. The database user does not have CREATE DATABASE privileges.',
                    'created' => false,
                ];
            }

            return [
                'success' => false,
                'message' => "Failed to create database: {$errorMessage}",
                'created' => false,
            ];
        }
    }

    /**
     * Get list of available databases for the user
     *
     * @return array{success: bool, databases: array<string>, message: string}
     */
    public function listDatabases(
        string $host,
        int $port,
        string $username,
        ?string $password = null
    ): array {
        try {
            $dsn = "mysql:host={$host};port={$port}";
            $pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 5,
            ]);

            $stmt = $pdo->query("SHOW DATABASES");
            $databases = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            // Filter out system databases
            $systemDbs = ['information_schema', 'mysql', 'performance_schema', 'sys'];
            $userDatabases = array_filter($databases, fn ($db) => ! in_array($db, $systemDbs));

            return [
                'success' => true,
                'databases' => array_values($userDatabases),
                'message' => 'Databases retrieved successfully',
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'databases' => [],
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Validate environment prerequisites
     *
     * @return array{valid: bool, issues: array<string>}
     */
    public function validateEnvironmentPrerequisites(): array
    {
        $issues = [];

        // Check if .env exists
        $envPath = base_path('.env');
        if (! File::exists($envPath)) {
            if (File::exists(base_path('.env.example'))) {
                $issues[] = '.env file missing. Will be created from .env.example during installation.';
            } else {
                $issues[] = 'CRITICAL: Neither .env nor .env.example exists. Please create .env file manually.';
            }
        }

        // Check if APP_KEY is set
        $appKey = config('app.key');
        if (empty($appKey)) {
            $issues[] = 'APP_KEY is not set. Run "php artisan key:generate" before installation.';
        }

        // Check if installation secret hash is configured
        $secretHash = config('app.installation_secret_hash') ?: config('platform.installation_secret_hash');
        if (empty($secretHash)) {
            $issues[] = 'INSTALLATION_SECRET_HASH is not configured. Add it to your .env file.';
        }

        // Check storage directory permissions
        $storagePath = storage_path();
        if (! is_writable($storagePath)) {
            $issues[] = "Storage directory is not writable: {$storagePath}";
        }

        // Check bootstrap/cache permissions
        $cachePath = base_path('bootstrap/cache');
        if (! is_writable($cachePath)) {
            $issues[] = "Bootstrap cache directory is not writable: {$cachePath}";
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
        ];
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
        $envContent = $this->updateEnvValue($envContent, 'APP_TIMEZONE', $platformConfig['app_timezone'] ?? 'UTC');
        $envContent = $this->updateEnvValue($envContent, 'APP_LOCALE', $platformConfig['app_locale'] ?? 'en');
        $envContent = $this->updateEnvValue($envContent, 'APP_DEBUG', $platformConfig['app_debug'] ? 'true' : 'false');

        // Email configuration - write to .env as fallback
        $envContent = $this->updateEnvValue($envContent, 'MAIL_MAILER', $platformConfig['mail_mailer'] ?? 'smtp');
        $envContent = $this->updateEnvValue($envContent, 'MAIL_HOST', $platformConfig['mail_host'] ?? '127.0.0.1');
        $envContent = $this->updateEnvValue($envContent, 'MAIL_PORT', $platformConfig['mail_port'] ?? 587);
        $envContent = $this->updateEnvValue($envContent, 'MAIL_USERNAME', $platformConfig['mail_username'] ?? '');
        $envContent = $this->updateEnvValue($envContent, 'MAIL_PASSWORD', $platformConfig['mail_password'] ?? '');
        $envContent = $this->updateEnvValue($envContent, 'MAIL_ENCRYPTION', $platformConfig['mail_encryption'] ?? 'tls');
        $envContent = $this->updateEnvValue($envContent, 'MAIL_FROM_ADDRESS', $platformConfig['mail_from_address']);
        $envContent = $this->updateEnvValue($envContent, 'MAIL_FROM_NAME', $platformConfig['mail_from_name']);

        // Backend driver configuration
        $envContent = $this->updateEnvValue($envContent, 'QUEUE_CONNECTION', $platformConfig['queue_connection'] ?? 'sync');
        $envContent = $this->updateEnvValue($envContent, 'SESSION_DRIVER', $platformConfig['session_driver'] ?? 'database');
        $envContent = $this->updateEnvValue($envContent, 'CACHE_STORE', $platformConfig['cache_driver'] ?? 'database');
        $envContent = $this->updateEnvValue($envContent, 'FILESYSTEM_DISK', $platformConfig['filesystem_disk'] ?? 'local');

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
