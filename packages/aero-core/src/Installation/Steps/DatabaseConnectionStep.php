<?php

namespace Aero\Core\Installation\Steps;

use Illuminate\Support\Facades\DB;

/**
 * Database Connection Step
 *
 * Tests database connectivity and creates database if needed
 */
class DatabaseConnectionStep extends BaseInstallationStep
{
    public function name(): string
    {
        return 'database';
    }

    public function description(): string
    {
        return 'Test database connection and create if needed';
    }

    public function order(): int
    {
        return 2;
    }

    public function dependencies(): array
    {
        return ['config'];
    }

    public function execute(): array
    {
        try {
            // Test connection
            DB::connection()->getPdo();
            $this->log('Database connection successful');

            return [
                'connection_status' => 'connected',
                'database_exists' => true,
            ];

        } catch (\Exception $e) {
            // Connection failed - try to create database
            $this->log('Create database attempt');

            if ($this->tryCreateDatabase()) {
                // Test connection again
                DB::purge();
                DB::connection()->getPdo();

                return [
                    'connection_status' => 'connected',
                    'database_exists' => true,
                    'database_created' => true,
                ];
            }

            throw new \Exception('Database connection failed and creation not supported: ' . $e->getMessage());
        }
    }

    public function validate(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception) {
            return false;
        }
    }

    /**
     * Attempt to create database
     */
    protected function tryCreateDatabase(): bool
    {
        try {
            $driver = env('DB_CONNECTION', 'mysql');

            if ($driver === 'mysql') {
                return $this->createMysqlDatabase();
            } elseif ($driver === 'pgsql') {
                return $this->createPostgresDatabase();
            } elseif ($driver === 'sqlite') {
                return $this->createSqliteDatabase();
            }

            return false;

        } catch (\Exception $e) {
            $this->warn('Database creation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Create MySQL database
     */
    protected function createMysqlDatabase(): bool
    {
        $dbName = env('DB_DATABASE');
        $host = env('DB_HOST', 'localhost');
        $user = env('DB_USERNAME', 'root');
        $pass = env('DB_PASSWORD', '');

        try {
            $pdo = new \PDO(
                "mysql:host={$host}",
                $user,
                $pass
            );

            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = null;

            return true;

        } catch (\Exception) {
            return false;
        }
    }

    /**
     * Create PostgreSQL database
     */
    protected function createPostgresDatabase(): bool
    {
        $dbName = env('DB_DATABASE');
        $host = env('DB_HOST', 'localhost');
        $user = env('DB_USERNAME', 'postgres');
        $pass = env('DB_PASSWORD', '');

        try {
            $pdo = new \PDO(
                "pgsql:host={$host}",
                $user,
                $pass
            );

            $pdo->exec("CREATE DATABASE \"{$dbName}\"");
            $pdo = null;

            return true;

        } catch (\Exception) {
            return false;
        }
    }

    /**
     * Create SQLite database
     */
    protected function createSqliteDatabase(): bool
    {
        $path = env('DB_DATABASE');

        try {
            // SQLite auto-creates when we connect
            $pdo = new \PDO("sqlite:{$path}");
            $pdo = null;
            return true;
        } catch (\Exception) {
            return false;
        }
    }

    public function dependencies(): array
    {
        return ['config'];
    }

    public function canSkip(): bool
    {
        return false;
    }
}
