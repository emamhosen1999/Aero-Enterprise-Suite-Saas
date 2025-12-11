<?php

/**
 * Test App State Script
 * Checks the current state of the standalone app
 */

require __DIR__ . '/../apps/standalone-host/vendor/autoload.php';

$app = require_once __DIR__ . '/../apps/standalone-host/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== AERO STANDALONE APP STATE CHECK ===\n\n";

// 1. Check registered service providers
echo "1. REGISTERED AERO MODULES:\n";
echo str_repeat("-", 50) . "\n";
foreach ($app->getLoadedProviders() as $provider => $loaded) {
    if (str_contains($provider, 'Aero')) {
        echo "✓ " . basename(str_replace('\\', '/', $provider)) . "\n";
    }
}
echo "\n";

// 2. Check database connection
echo "2. DATABASE CONNECTION:\n";
echo str_repeat("-", 50) . "\n";
try {
    $dbName = DB::connection()->getDatabaseName();
    echo "✓ Connected to: {$dbName}\n";
    
    // Check tables
    $tables = DB::select('SHOW TABLES');
    echo "✓ Total tables: " . count($tables) . "\n";
    
    // Check users
    $userCount = DB::table('users')->count();
    echo "✓ Total users: {$userCount}\n";
} catch (\Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
echo "\n";

// 3. Check Core routes
echo "3. CORE MODULE ROUTES:\n";
echo str_repeat("-", 50) . "\n";
$coreRoutes = collect(Route::getRoutes())->filter(function($route) {
    return str_contains($route->getName() ?? '', 'dashboard') ||
           str_contains($route->getName() ?? '', 'users.') ||
           str_contains($route->getName() ?? '', 'roles.') ||
           str_contains($route->getName() ?? '', 'settings.');
})->take(10);

foreach ($coreRoutes as $route) {
    echo "✓ " . $route->getName() . " → " . $route->uri() . "\n";
}
echo "\n";

// 4. Check HRM routes
echo "4. HRM MODULE ROUTES:\n";
echo str_repeat("-", 50) . "\n";
$hrmRoutes = collect(Route::getRoutes())->filter(function($route) {
    return str_contains($route->getName() ?? '', 'hrm.');
})->take(10);

foreach ($hrmRoutes as $route) {
    echo "✓ " . $route->getName() . " → " . $route->uri() . "\n";
}
echo "\n";

// 5. Check build assets
echo "5. BUILD ASSETS:\n";
echo str_repeat("-", 50) . "\n";
$buildDir = __DIR__ . '/../apps/standalone-host/public/build';
if (file_exists($buildDir)) {
    echo "✓ Build directory exists\n";
    
    $manifestPath = $buildDir . '/manifest.json';
    if (file_exists($manifestPath)) {
        echo "✓ Manifest file exists\n";
        $manifest = json_decode(file_get_contents($manifestPath), true);
        echo "✓ Manifest entries: " . count($manifest) . "\n";
        
        // Check key entries
        if (isset($manifest['resources/js/app.jsx'])) {
            echo "✓ app.jsx entry found\n";
        }
        if (isset($manifest['resources/css/app.css'])) {
            echo "✓ app.css entry found\n";
        }
    } else {
        echo "✗ Manifest file missing\n";
    }
} else {
    echo "✗ Build directory missing\n";
}
echo "\n";

// 6. Check navigation structure
echo "6. NAVIGATION STRUCTURE:\n";
echo str_repeat("-", 50) . "\n";
$navFile = __DIR__ . '/../packages/aero-core/resources/js/navigation/pages.jsx';
if (file_exists($navFile)) {
    echo "✓ Core navigation file exists\n";
} else {
    echo "✗ Core navigation file missing\n";
}
echo "\n";

echo "=== TEST COMPLETE ===\n";
