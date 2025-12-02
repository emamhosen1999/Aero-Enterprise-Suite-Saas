<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Find duplicate tenants with subdomain 'dbedc'
$duplicates = DB::table('tenants')
    ->where('subdomain', 'dbedc')
    ->get(['id', 'subdomain', 'status', 'tenancy_db_name', 'created_at']);

echo "Found " . $duplicates->count() . " tenant(s) with subdomain 'dbedc':\n\n";

foreach ($duplicates as $tenant) {
    echo "ID: {$tenant->id}\n";
    echo "Status: {$tenant->status}\n";
    echo "Database: {$tenant->tenancy_db_name}\n";
    echo "Created: {$tenant->created_at}\n";
    
    // Check if database exists
    $dbExists = DB::select("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", [$tenant->tenancy_db_name]);
    echo "Database exists: " . (!empty($dbExists) ? 'YES' : 'NO') . "\n";
    echo str_repeat('-', 50) . "\n";
}

// Ask for confirmation to delete
if ($duplicates->count() > 0) {
    echo "\nDo you want to delete these tenants and their databases? (yes/no): ";
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    $answer = trim(strtolower($line));
    
    if ($answer === 'yes') {
        foreach ($duplicates as $tenant) {
            // Drop database if exists
            if (!empty($tenant->tenancy_db_name)) {
                try {
                    DB::statement("DROP DATABASE IF EXISTS `{$tenant->tenancy_db_name}`");
                    echo "✓ Dropped database: {$tenant->tenancy_db_name}\n";
                } catch (\Exception $e) {
                    echo "✗ Failed to drop database {$tenant->tenancy_db_name}: {$e->getMessage()}\n";
                }
            }
            
            // Delete tenant record
            DB::table('tenants')->where('id', $tenant->id)->delete();
            echo "✓ Deleted tenant: {$tenant->id}\n";
            
            // Delete domain records
            DB::table('domains')->where('tenant_id', $tenant->id)->delete();
            echo "✓ Deleted domain records for tenant: {$tenant->id}\n";
        }
        
        echo "\n✓ Cleanup completed!\n";
    } else {
        echo "Cleanup cancelled.\n";
    }
}
