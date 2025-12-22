<?php

namespace Aero\Core\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Standalone Installation Service
 * 
 * Provides helper methods for standalone installation process.
 */
class StandaloneInstallationService
{
    /**
     * Check database connection and status
     */
    public function checkDatabaseStatus(): array
    {
        $status = [
            'connected' => false,
            'tables_exist' => false,
            'migrations_pending' => true,
            'message' => '',
        ];

        try {
            // Test connection
            DB::connection()->getPdo();
            $status['connected'] = true;

            // Check if essential tables exist
            $requiredTables = ['users', 'roles', 'permissions', 'modules'];
            $existingTables = [];
            
            foreach ($requiredTables as $table) {
                if (Schema::hasTable($table)) {
                    $existingTables[] = $table;
                }
            }

            $status['tables_exist'] = count($existingTables) === count($requiredTables);
            $status['existing_tables'] = $existingTables;
            $status['missing_tables'] = array_diff($requiredTables, $existingTables);

            if ($status['tables_exist']) {
                $status['migrations_pending'] = false;
                $status['message'] = 'Database is ready.';
            } else {
                $status['message'] = 'Database connected, but migrations need to be run.';
            }

        } catch (\Exception $e) {
            $status['message'] = 'Database connection failed: ' . $e->getMessage();
        }

        return $status;
    }

    /**
     * Check if installation marker exists
     */
    public function isInstalled(): bool
    {
        $markerPath = storage_path('app/.installed');
        return file_exists($markerPath);
    }

    /**
     * Get installation info
     */
    public function getInstallationInfo(): ?array
    {
        $markerPath = storage_path('app/.installed');
        
        if (!file_exists($markerPath)) {
            return null;
        }

        $content = file_get_contents($markerPath);
        return json_decode($content, true);
    }

    /**
     * Test database connection with custom credentials
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
     * Create database if it doesn't exist
     */
    public function createDatabaseIfNotExists(
        string $host,
        int $port,
        string $database,
        string $username,
        ?string $password = null
    ): array {
        try {
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $database)) {
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

            // Check if database exists
            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$database]);

            if ($stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => "Database '{$database}' already exists.",
                    'created' => false,
                ];
            }

            // Create database
            $pdo->exec("CREATE DATABASE `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            return [
                'success' => true,
                'message' => "Database '{$database}' created successfully.",
                'created' => true,
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => 'Failed to create database: ' . $e->getMessage(),
                'created' => false,
            ];
        }
    }
}
