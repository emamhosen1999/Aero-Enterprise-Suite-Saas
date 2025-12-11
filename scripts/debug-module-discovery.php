<?php

/**
 * Debug Module Discovery
 * Shows what module definitions are being found
 */

require __DIR__ . '/../apps/standalone-host/vendor/autoload.php';

$app = require_once __DIR__ . '/../apps/standalone-host/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== MODULE DISCOVERY DEBUG ===\n\n";

$discovery = app(\Aero\Core\Services\Module\ModuleDiscoveryService::class);
$definitions = $discovery->getModuleDefinitions();

echo "Total definitions found: " . $definitions->count() . "\n\n";

foreach ($definitions as $index => $def) {
    echo "Definition #" . ($index + 1) . ":\n";
    echo "  Code: " . ($def['code'] ?? 'MISSING') . "\n";
    echo "  Name: " . ($def['name'] ?? 'MISSING') . "\n";
    echo "  Scope: " . ($def['scope'] ?? 'MISSING') . "\n";
    echo "  Submodules: " . (isset($def['submodules']) ? count($def['submodules']) : 0) . "\n";
    echo "\n";
}

echo "=== END DEBUG ===\n";
