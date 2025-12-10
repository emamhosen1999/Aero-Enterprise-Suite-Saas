<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Module Discovery Debug\n";
echo "================================\n\n";

$moduleManager = app('aero.module');

// Use reflection to access protected properties
$reflection = new ReflectionClass($moduleManager);

$modulesPathProp = $reflection->getProperty('modulesPath');
$modulesPathProp->setAccessible(true);
$modulesPath = $modulesPathProp->getValue($moduleManager);

$packagesPathProp = $reflection->getProperty('packagesPath');
$packagesPathProp->setAccessible(true);
$packagesPath = $packagesPathProp->getValue($moduleManager);

echo "Modules Path: {$modulesPath}\n";
echo "Packages Path: {$packagesPath}\n\n";

echo "Modules Path exists? " . (file_exists($modulesPath) ? 'YES' : 'NO') . "\n";
echo "Packages Path exists? " . (file_exists($packagesPath) ? 'YES' : 'NO') . "\n\n";

if (file_exists($packagesPath)) {
    echo "Directories in packages path:\n";
    $dirs = glob($packagesPath . '/*', GLOB_ONLYDIR);
    foreach ($dirs as $dir) {
        $modulejson = $dir . '/module.json';
        echo "  - " . basename($dir) . " -> module.json " . (file_exists($modulejson) ? 'EXISTS' : 'MISSING') . "\n";
        
        if (file_exists($modulejson)) {
            $content = json_decode(file_get_contents($modulejson), true);
            echo "    Name: " . ($content['name'] ?? 'MISSING') . "\n";
            echo "    Short Name: " . ($content['short_name'] ?? 'MISSING') . "\n";
            echo "    Namespace: " . ($content['namespace'] ?? 'MISSING') . "\n";
        }
    }
}

echo "\n\nCalling discoverModules()...\n";
$discoverMethod = $reflection->getMethod('discoverModules');
$discoverMethod->setAccessible(true);
$modules = $discoverMethod->invoke($moduleManager);

echo "Discovered " . count($modules) . " modules\n";
foreach ($modules as $module) {
    print_r($module);
}
