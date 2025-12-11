<?php

/**
 * Check Navigation Registration
 * Verifies if Core and HRM navigations are registered
 */

require __DIR__ . '/../apps/standalone-host/vendor/autoload.php';

$app = require_once __DIR__ . '/../apps/standalone-host/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== NAVIGATION REGISTRATION CHECK ===\n\n";

// Check if navigation files exist
echo "1. NAVIGATION FILES:\n";
echo str_repeat("-", 50) . "\n";

$coreNavFile = __DIR__ . '/../packages/aero-core/resources/js/navigation/pages.jsx';
$hrmNavFile = __DIR__ . '/../packages/aero-hrm/resources/js/navigation/pages.jsx';

if (file_exists($coreNavFile)) {
    echo "✓ Core navigation file exists\n";
    echo "  Path: {$coreNavFile}\n";
} else {
    echo "✗ Core navigation file missing\n";
}

if (file_exists($hrmNavFile)) {
    echo "✓ HRM navigation file exists\n";
    echo "  Path: {$hrmNavFile}\n";
} else {
    echo "✗ HRM navigation file missing\n";
}
echo "\n";

// Check database for modules
echo "2. DATABASE MODULES:\n";
echo str_repeat("-", 50) . "\n";
$modules = DB::table('modules')
    ->select('id', 'code', 'name', 'scope', 'is_active')
    ->get();

foreach ($modules as $module) {
    echo "✓ {$module->code}: {$module->name} (scope: {$module->scope}, active: " . ($module->is_active ? 'yes' : 'no') . ")\n";
    
    // Count submodules
    $submoduleCount = DB::table('sub_modules')->where('module_id', $module->id)->count();
    echo "  └─ Submodules: {$submoduleCount}\n";
}
echo "\n";

// Check if navigation provider exists
echo "3. NAVIGATION PROVIDER:\n";
echo str_repeat("-", 50) . "\n";

$navProvider = __DIR__ . '/../packages/aero-core/resources/js/utils/navigationProvider.js';
if (file_exists($navProvider)) {
    echo "✓ Navigation provider exists\n";
    
    // Check if it references both modules
    $content = file_get_contents($navProvider);
    if (str_contains($content, 'coreNavigation')) {
        echo "✓ References Core navigation\n";
    }
    if (str_contains($content, 'hrmNavigation')) {
        echo "✓ References HRM navigation\n";
    }
} else {
    echo "✗ Navigation provider missing\n";
}
echo "\n";

// Check Inertia shared data
echo "4. CHECKING INERTIA SHARED NAVIGATION:\n";
echo str_repeat("-", 50) . "\n";
echo "Note: Navigation is typically shared via Inertia middleware\n";
echo "Check HandleInertiaRequests middleware for 'navigation' in shared data\n";

$middlewarePath = __DIR__ . '/../apps/standalone-host/app/Http/Middleware/HandleInertiaRequests.php';
if (file_exists($middlewarePath)) {
    echo "✓ Inertia middleware exists\n";
    $content = file_get_contents($middlewarePath);
    if (str_contains($content, 'navigation')) {
        echo "✓ Middleware includes 'navigation' in shared data\n";
    } else {
        echo "⚠ Middleware might not share navigation data\n";
    }
} else {
    echo "✗ Inertia middleware not found\n";
}

echo "\n=== CHECK COMPLETE ===\n";
