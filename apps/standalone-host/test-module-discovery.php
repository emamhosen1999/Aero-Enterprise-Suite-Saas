<?php

/**
 * Module Discovery Test Script
 * Tests the ModuleManager functionality as outlined in FOUNDATION_IMPLEMENTATION_COMPLETE.md
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n";
echo "===========================================\n";
echo "  AERO MODULE DISCOVERY TEST\n";
echo "===========================================\n\n";

try {
    // Test 1: Get ModuleManager instance
    echo "✓ Testing app('aero.module')...\n";
    $moduleManager = app('aero.module');
    echo "  Type: " . get_class($moduleManager) . "\n\n";

    // Test 2: Get all discovered modules
    echo "✓ Testing Module::all()...\n";
    $allModules = \Aero\Core\Facades\Module::all();
    echo "  Total modules discovered: " . count($allModules) . "\n";
    if (!empty($allModules)) {
        echo "  Modules:\n";
        foreach ($allModules as $module) {
            $status = ($module['enabled'] ?? false) ? 'enabled' : 'disabled';
            echo "    - {$module['name']} (v{$module['version']}) - {$status}\n";
            echo "      Source: {$module['source']}\n";
            echo "      Short Name: {$module['short_name']}\n";
            echo "      Path: {$module['path']}\n\n";
        }
    }

    // Test 3: Get active modules
    echo "✓ Testing Module::active()...\n";
    $activeModules = \Aero\Core\Facades\Module::active();
    echo "  Active modules: " . count($activeModules) . "\n";
    if (!empty($activeModules)) {
        foreach ($activeModules as $module) {
            echo "    - {$module['name']}\n";
        }
    }
    echo "\n";

    // Test 4: Count methods
    echo "✓ Testing Module::count() and enabledCount()...\n";
    $totalCount = \Aero\Core\Facades\Module::count();
    $enabledCount = \Aero\Core\Facades\Module::enabledCount();
    echo "  Total modules: {$totalCount}\n";
    echo "  Enabled modules: {$enabledCount}\n\n";

    // Test 5: Check specific module
    echo "✓ Testing Module::get('hrm')...\n";
    $hrmModule = \Aero\Core\Facades\Module::get('hrm');
    if ($hrmModule) {
        echo "  HRM Module found:\n";
        echo "    Name: {$hrmModule['name']}\n";
        echo "    Version: {$hrmModule['version']}\n";
        echo "    Short Name: {$hrmModule['short_name']}\n";
        echo "    Namespace: {$hrmModule['namespace']}\n";
        echo "    Source: {$hrmModule['source']}\n";
        echo "    Enabled: " . ($hrmModule['enabled'] ? 'YES' : 'NO') . "\n";
    } else {
        echo "  ⚠ HRM module not found!\n";
    }
    echo "\n";

    // Test 6: Check if HRM is enabled
    echo "✓ Testing Module::isEnabled('hrm')...\n";
    $isHrmEnabled = \Aero\Core\Facades\Module::isEnabled('hrm');
    echo "  HRM enabled: " . ($isHrmEnabled ? 'YES' : 'NO') . "\n\n";

    // Test 7: Get modules by source
    echo "✓ Testing Module::bySource('package')...\n";
    $packageModules = \Aero\Core\Facades\Module::bySource('package');
    echo "  Modules from packages: " . count($packageModules) . "\n";
    foreach ($packageModules as $module) {
        echo "    - {$module['name']}\n";
    }
    echo "\n";

    echo "===========================================\n";
    echo "  ✅ ALL TESTS COMPLETED SUCCESSFULLY\n";
    echo "===========================================\n\n";

} catch (\Exception $e) {
    echo "\n";
    echo "===========================================\n";
    echo "  ❌ TEST FAILED\n";
    echo "===========================================\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
