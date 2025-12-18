<?php

namespace Aero\Platform\TenantDatabaseManagers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Contracts\TenantDatabaseManager;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

/**
 * cPanel Database Manager
 *
 * Creates and manages MySQL databases through cPanel's UAPI.
 * Required for shared hosting where direct CREATE DATABASE is not allowed.
 *
 * Required Environment Variables:
 * - CPANEL_HOST: cPanel hostname (e.g., "aeos365.com" or "cpanel.aeos365.com")
 * - CPANEL_USERNAME: cPanel username (e.g., "aeos365")
 * - CPANEL_API_TOKEN: cPanel API token (generate in cPanel → Manage API Tokens)
 * - CPANEL_PORT: cPanel port (default: 2083 for HTTPS)
 *
 * Database Naming:
 * On cPanel, databases are prefixed with username (e.g., "aeos365_tenantdb")
 * Max database name length: 64 characters (prefix + _ + dbname)
 */
class CpanelDatabaseManager implements TenantDatabaseManager
{
    /**
     * Create a database for a tenant.
     */
    public function createDatabase(TenantWithDatabase $tenant): bool
    {
        $dbName = $this->getShortDatabaseName($tenant);
        $fullDbName = $this->getFullDatabaseName($tenant);

        Log::info('📦 cPanel: Creating database', [
            'tenant_id' => $tenant->getTenantKey(),
            'db_name' => $dbName,
            'full_db_name' => $fullDbName,
        ]);

        try {
            // Step 1: Create the database
            $response = $this->callCpanelApi('Mysql', 'create_database', [
                'name' => $dbName,
            ]);

            if (!$response['success']) {
                throw new \RuntimeException('Failed to create database: ' . ($response['error'] ?? 'Unknown error'));
            }

            Log::info('✅ cPanel: Database created successfully', ['db_name' => $fullDbName]);

            // Step 2: Grant privileges to the database user
            $dbUser = $this->getDatabaseUser();
            
            $response = $this->callCpanelApi('Mysql', 'set_privileges_on_database', [
                'user' => $dbUser,
                'database' => $dbName,
                'privileges' => 'ALL PRIVILEGES',
            ]);

            if (!$response['success']) {
                Log::warning('⚠️ cPanel: Failed to set privileges, trying alternative method', [
                    'error' => $response['error'] ?? 'Unknown error',
                ]);
                
                // Alternative: Try adding user to database with all privileges
                $response = $this->callCpanelApi('Mysql', 'add_user_to_database', [
                    'user' => $dbUser,
                    'database' => $dbName,
                    'privileges' => [
                        'ALTER', 'ALTER ROUTINE', 'CREATE', 'CREATE ROUTINE',
                        'CREATE TEMPORARY TABLES', 'CREATE VIEW', 'DELETE',
                        'DROP', 'EVENT', 'EXECUTE', 'INDEX', 'INSERT',
                        'LOCK TABLES', 'REFERENCES', 'SELECT', 'SHOW VIEW',
                        'TRIGGER', 'UPDATE',
                    ],
                ]);
                
                if (!$response['success']) {
                    throw new \RuntimeException('Failed to set database privileges: ' . ($response['error'] ?? 'Unknown error'));
                }
            }

            Log::info('✅ cPanel: Database privileges granted', [
                'db_name' => $fullDbName,
                'user' => $dbUser,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('❌ cPanel: Database creation failed', [
                'db_name' => $fullDbName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a tenant's database.
     */
    public function deleteDatabase(TenantWithDatabase $tenant): bool
    {
        $dbName = $this->getShortDatabaseName($tenant);
        $fullDbName = $this->getFullDatabaseName($tenant);

        Log::info('🗑️ cPanel: Deleting database', [
            'tenant_id' => $tenant->getTenantKey(),
            'db_name' => $fullDbName,
        ]);

        try {
            $response = $this->callCpanelApi('Mysql', 'delete_database', [
                'name' => $dbName,
            ]);

            if (!$response['success']) {
                // Don't throw if database doesn't exist
                if (str_contains($response['error'] ?? '', 'does not exist')) {
                    Log::info('ℹ️ cPanel: Database does not exist, nothing to delete', [
                        'db_name' => $fullDbName,
                    ]);
                    return true;
                }
                throw new \RuntimeException('Failed to delete database: ' . ($response['error'] ?? 'Unknown error'));
            }

            Log::info('✅ cPanel: Database deleted successfully', ['db_name' => $fullDbName]);
            return true;
        } catch (\Exception $e) {
            Log::error('❌ cPanel: Database deletion failed', [
                'db_name' => $fullDbName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Check if the database exists.
     */
    public function databaseExists(TenantWithDatabase $tenant): bool
    {
        $dbName = $this->getShortDatabaseName($tenant);
        
        try {
            $response = $this->callCpanelApi('Mysql', 'list_databases', []);
            
            if (!$response['success']) {
                return false;
            }

            $databases = $response['data'] ?? [];
            $fullDbName = $this->getFullDatabaseName($tenant);
            
            return in_array($fullDbName, array_column($databases, 'database'));
        } catch (\Exception $e) {
            Log::error('❌ cPanel: Failed to check database existence', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Make the API call to cPanel.
     *
     * @return array{success: bool, data?: mixed, error?: string}
     */
    protected function callCpanelApi(string $module, string $function, array $params = []): array
    {
        $host = config('tenancy.cpanel.host');
        $username = config('tenancy.cpanel.username');
        $token = config('tenancy.cpanel.api_token');
        $port = config('tenancy.cpanel.port', 2083);

        if (!$host || !$username || !$token) {
            throw new \RuntimeException('cPanel API credentials not configured. Set CPANEL_HOST, CPANEL_USERNAME, and CPANEL_API_TOKEN in .env');
        }

        $url = "https://{$host}:{$port}/execute/{$module}/{$function}";

        Log::debug('🔗 cPanel API Request', [
            'url' => $url,
            'module' => $module,
            'function' => $function,
            'params' => $params,
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => "cpanel {$username}:{$token}",
            ])
            ->timeout(30)
            ->get($url, $params);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'error' => "HTTP {$response->status()}: " . $response->body(),
                ];
            }

            $data = $response->json();

            // cPanel API response structure
            if (isset($data['status']) && $data['status'] == 1) {
                return [
                    'success' => true,
                    'data' => $data['data'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => $data['errors'][0] ?? $data['error'] ?? 'Unknown cPanel API error',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get the short database name (without cPanel prefix).
     * 
     * cPanel has a max database name length, so we need to truncate the UUID.
     * Format: tenant_{first8chars_of_uuid}
     */
    protected function getShortDatabaseName(TenantWithDatabase $tenant): string
    {
        $tenantId = $tenant->getTenantKey();
        
        // Use subdomain if available, otherwise truncated UUID
        if (method_exists($tenant, 'getAttribute') && $tenant->getAttribute('subdomain')) {
            $subdomain = preg_replace('/[^a-z0-9]/i', '', $tenant->getAttribute('subdomain'));
            // Max 16 chars for the short name (cPanel username typically 8 chars + _ + 16 = 25 chars, well under 64)
            return 'tn_' . substr(strtolower($subdomain), 0, 16);
        }
        
        // Fallback: use first 16 chars of UUID
        $shortId = str_replace('-', '', substr($tenantId, 0, 16));
        return 'tn_' . $shortId;
    }

    /**
     * Get the full database name with cPanel prefix.
     */
    protected function getFullDatabaseName(TenantWithDatabase $tenant): string
    {
        $username = config('tenancy.cpanel.username');
        $shortName = $this->getShortDatabaseName($tenant);
        
        return "{$username}_{$shortName}";
    }

    /**
     * Get the database user (typically same as cPanel username with prefix).
     */
    protected function getDatabaseUser(): string
    {
        $username = config('tenancy.cpanel.username');
        $dbUser = config('tenancy.cpanel.db_user', $username);
        
        // If db_user doesn't have prefix, add it
        if (!str_starts_with($dbUser, $username . '_')) {
            return "{$username}_{$dbUser}";
        }
        
        return $dbUser;
    }

    /**
     * Provide the tenant database connection configuration.
     */
    public function makeConnectionConfig(array $baseConfig, string $databaseName): array
    {
        return array_merge($baseConfig, [
            'database' => $databaseName,
        ]);
    }

    /**
     * Set the connection for tenant database operations.
     */
    public function setConnection(string $connection): void
    {
        // No-op: We use HTTP API, not direct connection
    }
}
