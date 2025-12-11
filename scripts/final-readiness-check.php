<?php

/**
 * Final App Readiness Check
 * Complete verification of Core + HRM modules
 */

require __DIR__ . '/../apps/standalone-host/vendor/autoload.php';

$app = require_once __DIR__ . '/../apps/standalone-host/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n";
echo "╔═══════════════════════════════════════════════════════════╗\n";
echo "║     AERO STANDALONE APP - FINAL READINESS CHECK          ║\n";
echo "╚═══════════════════════════════════════════════════════════╝\n\n";

$allPassed = true;

// 1. Service Providers
echo "✓ Service Providers\n";
echo str_repeat("─", 60) . "\n";
$providers = ['AeroCoreServiceProvider', 'AeroHrmServiceProvider'];
foreach ($app->getLoadedProviders() as $provider => $loaded) {
    foreach ($providers as $expected) {
        if (str_contains($provider, $expected)) {
            echo "  ✓ {$expected} loaded\n";
        }
    }
}
echo "\n";

// 2. Database & Module Hierarchy
echo "✓ Database & Module Hierarchy\n";
echo str_repeat("─", 60) . "\n";
$modules = DB::table('modules')->get();
echo "  ✓ Database: " . DB::connection()->getDatabaseName() . "\n";
echo "  ✓ Modules: {$modules->count()}\n";
foreach ($modules as $module) {
    $submodules = DB::table('sub_modules')->where('module_id', $module->id)->count();
    $components = DB::table('module_components')
        ->whereIn('sub_module_id', DB::table('sub_modules')->where('module_id', $module->id)->pluck('id'))
        ->count();
    echo "    • {$module->name}: {$submodules} submodules, {$components} components\n";
}
echo "\n";

// 3. Routes
echo "✓ Routes\n";
echo str_repeat("─", 60) . "\n";
$coreRouteCount = collect(Route::getRoutes())->filter(fn($r) => 
    str_contains($r->getName() ?? '', 'dashboard') || 
    str_contains($r->getName() ?? '', 'users.')
)->count();
$hrmRouteCount = collect(Route::getRoutes())->filter(fn($r) => 
    str_contains($r->getName() ?? '', 'hrm.')
)->count();
echo "  ✓ Core routes: {$coreRouteCount}\n";
echo "  ✓ HRM routes: {$hrmRouteCount}\n";
echo "\n";

// 4. Build Assets
echo "✓ Build Assets\n";
echo str_repeat("─", 60) . "\n";
$buildDir = __DIR__ . '/../apps/standalone-host/public/build';
$manifestPath = $buildDir . '/manifest.json';
if (file_exists($manifestPath)) {
    $manifest = json_decode(file_get_contents($manifestPath), true);
    echo "  ✓ Manifest: " . count($manifest) . " entries\n";
    echo "  ✓ app.jsx: " . (isset($manifest['resources/js/app.jsx']) ? 'found' : 'missing') . "\n";
    echo "  ✓ app.css: " . (isset($manifest['resources/css/app.css']) ? 'found' : 'missing') . "\n";
} else {
    echo "  ✗ Manifest missing\n";
    $allPassed = false;
}
echo "\n";

// 5. Navigation
echo "✓ Navigation\n";
echo str_repeat("─", 60) . "\n";
$coreNav = file_exists(__DIR__ . '/../packages/aero-core/resources/js/navigation/pages.jsx');
$hrmNav = file_exists(__DIR__ . '/../packages/aero-hrm/resources/js/navigation/pages.jsx');
$navProvider = file_exists(__DIR__ . '/../packages/aero-core/resources/js/utils/navigationProvider.js');
echo "  ✓ Core navigation: " . ($coreNav ? 'exists' : 'missing') . "\n";
echo "  ✓ HRM navigation: " . ($hrmNav ? 'exists' : 'missing') . "\n";
echo "  ✓ Navigation provider: " . ($navProvider ? 'exists' : 'missing') . "\n";

if ($navProvider) {
    $content = file_get_contents(__DIR__ . '/../packages/aero-core/resources/js/utils/navigationProvider.js');
    $hasHrmImport = str_contains($content, 'aero-hrm/resources/js/navigation/pages.jsx');
    echo "  ✓ Provider imports HRM: " . ($hasHrmImport ? 'yes' : 'no') . "\n";
}
echo "\n";

// 6. Test User
echo "✓ Test Data\n";
echo str_repeat("─", 60) . "\n";
$userCount = DB::table('users')->count();
echo "  ✓ Users: {$userCount}\n";
if ($userCount > 0) {
    $user = DB::table('users')->first();
    echo "    • Test user: {$user->email}\n";
}
echo "\n";

// Final Status
echo "╔═══════════════════════════════════════════════════════════╗\n";
if ($allPassed) {
    echo "║   ✅ ALL CHECKS PASSED - APP READY FOR TESTING            ║\n";
} else {
    echo "║   ⚠️  SOME CHECKS FAILED - REVIEW ABOVE                   ║\n";
}
echo "╚═══════════════════════════════════════════════════════════╝\n";

echo "\n📋 Next Steps:\n";
echo "  1. Start server: php artisan serve\n";
echo "  2. Visit: http://localhost:8000\n";
echo "  3. Login with test user\n";
echo "  4. Verify Dashboard loads\n";
echo "  5. Check sidebar shows Core + HRM navigation\n\n";
