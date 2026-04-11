<?php

/**
 * Migration Tagging Script
 *
 * Auto-tags all migrations based on naming conventions and package structure.
 * Can be run as: php scripts/tag-migrations.php [--dry-run] [--verbose]
 *
 * Tags are assigned using these rules:
 * 1. Package-based: aero-core -> core:*, aero-platform -> platform:*, aero-hrm -> hrm:*, etc.
 * 2. Name-based: "create_users" -> auth, "create_tenants" -> tenancy, etc.
 * 3. Manual mapping: Hardcoded mappings for migrations that don't follow naming conventions
 *
 * Usage:
 *   php scripts/tag-migrations.php --dry-run          # Preview changes
 *   php scripts/tag-migrations.php                    # Actually tag migrations
 *   php scripts/tag-migrations.php --verbose          # Detailed output
 */

// Run from artisan command context or standalone
$debug = in_array('--verbose', $_SERVER['argv'] ?? []);
$dryRun = in_array('--dry-run', $_SERVER['argv'] ?? []);

// Migration tag patterns (name => tag)
$tagPatterns = [
    // CORE: Foundation
    'cache_table' => 'core:foundation',
    'jobs_table' => 'core:foundation',
    'app_key' => 'core:foundation',

    // CORE: Authentication
    'users_table' => 'core:auth',
    'user_sessions' => 'core:auth',
    'password_reset' => 'core:auth',
    'two_factor' => 'core:auth',
    'user_devices' => 'core:auth',
    'failed_login' => 'core:auth',
    'user_impersonation' => 'core:auth',
    'phone_verification' => 'core:auth',

    // CORE: RBAC
    'permission' => 'core:rbac',
    'roles_table' => 'core:rbac',
    'role_module_access' => 'core:rbac',
    'scope_and_protection' => 'core:rbac',

    // CORE: Audit & Notifications
    'audit_logs' => 'core:audit',
    'notification' => 'core:notifications',

    // PLATFORM: Tenancy
    'tenants_table' => 'platform:tenancy',
    'domains_table' => 'platform:tenancy',

    // PLATFORM: Billing
    'plans_table' => 'platform:billing',
    'subscriptions_table' => 'platform:billing',
    'invoices_table' => 'platform:billing',
    'stripe' => 'platform:billing',
    'cashier' => 'platform:billing',

    // PLATFORM: Modules
    'modules_table' => 'platform:modules',
    'sub_modules' => 'platform:modules',
    'components' => 'platform:modules',
    'component_actions' => 'platform:modules',
    'module_purchases' => 'platform:modules',
    'module_licenses' => 'platform:modules',

    // PLATFORM: Settings
    'system_settings' => 'platform:settings',
    'app_settings' => 'platform:settings',

    // HRM: Base
    'employees_table' => 'hrm:base',
    'departments_table' => 'hrm:base',
    'designations_table' => 'hrm:base',
    'shifts_table' => 'hrm:base',
    'employee_onboarding' => 'hrm:base',
    'employee_offboarding' => 'hrm:base',

    // HRM: Payroll
    'salary_components' => 'hrm:payroll',
    'salary_structure' => 'hrm:payroll',
    'payroll' => 'hrm:payroll',
    'tax_configuration' => 'hrm:payroll',
    'employee_salary' => 'hrm:payroll',

    // HRM: Leave
    'leave_type' => 'hrm:leave',
    'leave_application' => 'hrm:leave',
    'leaves' => 'hrm:leave',

    // HRM: Benefits
    'benefits' => 'hrm:base',
    'employee_benefits' => 'hrm:base',

    // HRM: Other
    'asset' => 'hrm:base',
    'employee_asset' => 'hrm:base',
    'expense' => 'hrm:base',
    'employee_expense' => 'hrm:base',
    'incident' => 'hrm:base',
    'disciplinary' => 'hrm:base',

    // CRM: Base
    'leads_table' => 'crm:base',
    'accounts_table' => 'crm:base',
    'opportunities_table' => 'crm:base',
    'contact' => 'crm:base',

    // CRM: Campaigns
    'campaign' => 'crm:campaigns',

    // PROJECT: Base
    'projects_table' => 'project:base',
    'tasks_table' => 'project:base',
    'timesheet' => 'project:base',
    'boq' => 'project:base',

    // CMS
    'pages_table' => 'cms:base',
    'page_blocks' => 'cms:base',
    'blocks_table' => 'cms:base',
    'publishing_workflow' => 'cms:publishing',
    'seo' => 'cms:seo',
    'keywords' => 'cms:seo',

    // RFI: Daily Work
    'daily_work' => 'rfi:base',

    // Other modules
    'media_table' => 'core:audit',
];

// Package to package tag mapping
$packageTagMap = [
    'aero-core' => 'core',
    'aero-platform' => 'platform',
    'aero-hrm' => 'hrm',
    'aero-crm' => 'crm',
    'aero-project' => 'project',
    'aero-cms' => 'cms',
    'aero-rfi' => 'rfi',
    'aero-finance' => 'finance',
    'aero-ims' => 'ims',
    'aero-quality' => 'quality',
    'aero-scm' => 'scm',
    'aero-dms' => 'dms',
    'aero-compliance' => 'compliance',
    'aero-pos' => 'pos',
    'aero-iot' => 'iot',
];

// Default tag mapping for untaggable migrations
$defaultTags = [
    'fix_' => 'core:foundation',
    'add_' => 'core:foundation',
    'update_' => 'core:foundation',
    'alter_' => 'core:foundation',
];

/**
 * Get tag for a migration based on filename and package
 */
function getMigrationTag($migrationName, $package = null) {
    global $tagPatterns, $packageTagMap, $defaultTags;

    $name = strtolower($migrationName);

    // Exact pattern match first
    foreach ($tagPatterns as $pattern => $tag) {
        if (strpos($name, strtolower($pattern)) !== false) {
            return $tag;
        }
    }

    // Package-based fallback
    if ($package && isset($packageTagMap[$package])) {
        $pkgTag = $packageTagMap[$package];
        
        // Guess category from migration name
        if (strpos($name, 'create') !== false) {
            return "{$pkgTag}:base";
        } elseif (strpos($name, 'payroll') !== false) {
            return "hrm:payroll";
        } elseif (strpos($name, 'leave') !== false) {
            return "hrm:leave";
        } elseif (strpos($name, 'tenancy') !== false || strpos($name, 'tenant') !== false) {
            return "platform:tenancy";
        } elseif (strpos($name, 'billing') !== false || strpos($name, 'plan') !== false || strpos($name, 'subscription') !== false) {
            return "platform:billing";
        } elseif (strpos($name, 'module') !== false) {
            return "platform:modules";
        }
        
        return "{$pkgTag}:base";
    }

    // Default based on prefix
    foreach ($defaultTags as $prefix => $tag) {
        if (strpos($name, $prefix) === 0) {
            return $tag;
        }
    }

    return null; // Unable to determine tag
}

/**
 * Scan migrations and generate tags
 */
function scanMigrations() {
    global $debug;

    $basePaths = [
        'database/migrations' => null,  // aeos365
        'packages/aero-core/database/migrations' => 'aero-core',
        'packages/aero-platform/database/migrations' => 'aero-platform',
        'packages/aero-hrm/database/migrations' => 'aero-hrm',
        'packages/aero-crm/database/migrations' => 'aero-crm',
        'packages/aero-project/database/migrations' => 'aero-project',
        'packages/aero-cms/database/migrations' => 'aero-cms',
        'packages/aero-rfi/database/migrations' => 'aero-rfi',
        'packages/aero-finance/database/migrations' => 'aero-finance',
        'packages/aero-ims/database/migrations' => 'aero-ims',
        'packages/aero-quality/database/migrations' => 'aero-quality',
        'packages/aero-scm/database/migrations' => 'aero-scm',
        'packages/aero-dms/database/migrations' => 'aero-dms',
        'packages/aero-compliance/database/migrations' => 'aero-compliance',
        'packages/aero-pos/database/migrations' => 'aero-pos',
    ];

    $migrations = [];

    foreach ($basePaths as $path => $package) {
        $fullPath = base_path($path);

        if (!is_dir($fullPath)) {
            if ($debug) echo "Path not found: $fullPath\n";
            continue;
        }

        $files = array_diff(scandir($fullPath), ['.', '..']);

        foreach ($files as $file) {
            if (substr($file, -4) !== '.php') continue;

            $migrationName = str_replace('.php', '', $file);
            $tag = getMigrationTag($migrationName, $package);

            $migrations[] = [
                'path' => $path,
                'package' => $package,
                'name' => $migrationName,
                'tag' => $tag,
                'file' => $file,
            ];

            if ($debug) {
                echo sprintf(
                    "  [%s] %s -> %s\n",
                    $package ?? 'host',
                    $migrationName,
                    $tag ?? 'UNKNOWN'
                );
            }
        }
    }

    return $migrations;
}

// MAIN EXECUTION
echo "=== Migration Tagging Script ===\n\n";

$migrations = scanMigrations();

// Group by tag
$byTag = [];
foreach ($migrations as $m) {
    $tag = $m['tag'] ?? 'UNTAGGED';
    if (!isset($byTag[$tag])) {
        $byTag[$tag] = [];
    }
    $byTag[$tag][] = $m;
}

// Summary
echo "Migration Summary:\n";
echo str_repeat("-", 80) . "\n";
foreach ($byTag as $tag => $items) {
    echo sprintf("  %s: %d migrations\n", $tag, count($items));
}
echo str_repeat("-", 80) . "\n";
echo "Total migrations scanned: " . count($migrations) . "\n";
echo "Total tags: " . count($byTag) . "\n";

if ($dryRun) {
    echo "\n[DRY RUN] No changes made. Run without --dry-run to apply tags to database.\n";
} else {
    echo "\n[TODO] Database tagging not yet implemented in this script.\n";
    echo "Next steps:\n";
    echo "  1. Review tags above\n";
    echo "  2. Update tagPatterns in this script if needed\n";
    echo "  3. Run database update via artisan command: php artisan aero:tag-migrations\n";
}

echo "\nDone.\n";
