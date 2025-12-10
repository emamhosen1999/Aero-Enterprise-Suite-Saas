#!/usr/bin/env php
<?php

/**
 * Test Script for Module Decentralization
 * 
 * Tests the ModuleDiscoveryService and verifies module configs are discoverable.
 * Run: php test-module-discovery.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Aero\Core\Services\ModuleDiscoveryService;

echo "🔍 Testing Module Discovery Service\n";
echo str_repeat("=", 60) . "\n\n";

$service = new ModuleDiscoveryService();

// Test 1: Get Available Packages
echo "📦 Available Packages:\n";
$packages = $service->getAvailablePackages();
foreach ($packages as $package) {
    $status = $package['has_config'] ? '✅' : '❌';
    echo "  {$status} {$package['name']}\n";
}
echo "\n";

// Test 2: Get Module Definitions
echo "📋 Module Definitions:\n";
$definitions = $service->getModuleDefinitions();
echo "  Found {$definitions->count()} modules\n\n";

foreach ($definitions as $module) {
    echo "  • {$module['name']} ({$module['code']})\n";
    if (isset($module['submodules'])) {
        echo "    Submodules: " . count($module['submodules']) . "\n";
    }
}
echo "\n";

// Test 3: Extract Permissions
echo "🔐 Extracted Permissions:\n";
$permissions = $service->getAllPermissions();
echo "  Total permissions: {$permissions->count()}\n\n";

// Show first 10 permissions as sample
$sample = $permissions->take(10);
foreach ($sample as $permission) {
    echo "  • {$permission['name']}\n";
    echo "    Display: {$permission['display_name']}\n";
    if ($permission['description']) {
        echo "    Desc: {$permission['description']}\n";
    }
    echo "\n";
}

if ($permissions->count() > 10) {
    echo "  ... and " . ($permissions->count() - 10) . " more\n\n";
}

echo "✅ Module Discovery Service test complete!\n";
echo str_repeat("=", 60) . "\n";
