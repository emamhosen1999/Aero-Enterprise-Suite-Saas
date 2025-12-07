#!/usr/bin/env php
<?php

/**
 * Migration Health Check Script
 * 
 * Verifies that all migrations are properly organized and placed
 * in the correct context (central/landlord vs tenant).
 * 
 * Usage: php tools/check-migrations.php
 */

$rootPath = dirname(__DIR__);
$rootMigrationsPath = $rootPath . '/database/migrations';
$tenantMigrationsPath = $rootPath . '/database/migrations/tenant';

echo "🔍 Migration Health Check\n";
echo str_repeat("=", 60) . "\n\n";

// Count migrations
$rootMigrations = glob($rootMigrationsPath . '/*.php');
$tenantMigrations = glob($tenantMigrationsPath . '/*.php');

echo "📊 Migration Statistics:\n";
echo "   Central/Landlord: " . count($rootMigrations) . " migrations\n";
echo "   Tenant:          " . count($tenantMigrations) . " migrations\n";
echo "   Total:           " . (count($rootMigrations) + count($tenantMigrations)) . " migrations\n\n";

// Check for duplicates
$rootFiles = array_map('basename', $rootMigrations);
$tenantFiles = array_map('basename', $tenantMigrations);
$duplicates = array_intersect($rootFiles, $tenantFiles);

echo "🔄 Duplicate Migrations Check:\n";
if (empty($duplicates)) {
    echo "   ✅ No duplicates found\n\n";
} else {
    echo "   ⚠️  Found " . count($duplicates) . " duplicate(s):\n";
    foreach ($duplicates as $duplicate) {
        echo "      - $duplicate\n";
    }
    echo "\n   ℹ️  Note: Some duplicates are intentional (see MIGRATION_ORGANIZATION_GUIDE.md)\n\n";
}

// Expected duplicates (intentional)
$expectedDuplicates = [
    '2024_07_27_061640_create_media_table.php',
    '2025_11_29_000000_create_permission_tables.php',
    '2025_12_02_153410_create_grades_table.php',
    '2025_12_02_153442_create_job_types_table.php',
    '2025_12_04_110855_add_scope_and_protection_to_rbac_tables.php',
    '2025_12_05_000741_create_role_module_access_table.php',
];

$unexpectedDuplicates = array_diff($duplicates, $expectedDuplicates);
$missingExpectedDuplicates = array_diff($expectedDuplicates, $duplicates);

if (!empty($unexpectedDuplicates)) {
    echo "❌ UNEXPECTED DUPLICATES FOUND:\n";
    foreach ($unexpectedDuplicates as $unexpected) {
        echo "   - $unexpected\n";
    }
    echo "\n";
}

if (!empty($missingExpectedDuplicates)) {
    echo "⚠️  MISSING EXPECTED DUPLICATES:\n";
    foreach ($missingExpectedDuplicates as $missing) {
        echo "   - $missing\n";
    }
    echo "\n";
}

// Check for documentation comments in duplicates
echo "📝 Documentation Check:\n";
$documentedCount = 0;
foreach ($duplicates as $duplicate) {
    $rootFile = $rootMigrationsPath . '/' . $duplicate;
    $tenantFile = $tenantMigrationsPath . '/' . $duplicate;
    
    $rootContent = file_get_contents($rootFile);
    $tenantContent = file_get_contents($tenantFile);
    
    $rootHasDoc = strpos($rootContent, 'DUPLICATE MIGRATION') !== false;
    $tenantHasDoc = strpos($tenantContent, 'DUPLICATE MIGRATION') !== false;
    
    if ($rootHasDoc && $tenantHasDoc) {
        $documentedCount++;
    }
}

echo "   ✅ Documented: $documentedCount / " . count($duplicates) . " duplicates\n\n";

// Check for tables in wrong context
echo "🔍 Context Verification:\n";

// Tenant-specific keywords that should NOT be in root
$tenantKeywords = ['employee', 'attendance', 'leave', 'payroll', 'salary', 'tax', 'shift', 'training'];
$suspiciousRoot = [];

foreach ($rootMigrations as $migration) {
    $basename = basename($migration);
    foreach ($tenantKeywords as $keyword) {
        if (stripos($basename, $keyword) !== false) {
            // Check if it's an expected exception
            if (!in_array($basename, ['2025_12_02_153410_create_grades_table.php', '2025_12_02_153442_create_job_types_table.php'])) {
                $suspiciousRoot[] = $basename;
                break;
            }
        }
    }
}

// Platform-specific keywords that should NOT be in tenant
$platformKeywords = ['tenant', 'plan', 'subscription', 'platform_settings', 'landlord', 'billing'];
$suspiciousTenant = [];

foreach ($tenantMigrations as $migration) {
    $basename = basename($migration);
    foreach ($platformKeywords as $keyword) {
        if (stripos($basename, $keyword) !== false) {
            // tenant_invitations is OK in tenant folder
            if ($basename !== '2025_11_30_220338_create_tenant_invitations_table.php') {
                $suspiciousTenant[] = $basename;
                break;
            }
        }
    }
}

if (empty($suspiciousRoot) && empty($suspiciousTenant)) {
    echo "   ✅ All migrations appear to be in correct context\n\n";
} else {
    if (!empty($suspiciousRoot)) {
        echo "   ⚠️  Potentially misplaced in root:\n";
        foreach ($suspiciousRoot as $file) {
            echo "      - $file\n";
        }
        echo "\n";
    }
    
    if (!empty($suspiciousTenant)) {
        echo "   ⚠️  Potentially misplaced in tenant:\n";
        foreach ($suspiciousTenant as $file) {
            echo "      - $file\n";
        }
        echo "\n";
    }
}

// Final status
echo str_repeat("=", 60) . "\n";

if (empty($unexpectedDuplicates) && empty($suspiciousRoot) && empty($suspiciousTenant) && $documentedCount === count($duplicates)) {
    echo "✅ HEALTH CHECK PASSED\n";
    echo "   All migrations are properly organized and documented.\n";
    exit(0);
} else {
    echo "⚠️  HEALTH CHECK WARNINGS\n";
    echo "   Review the issues above and consult MIGRATION_ORGANIZATION_GUIDE.md\n";
    exit(1);
}
