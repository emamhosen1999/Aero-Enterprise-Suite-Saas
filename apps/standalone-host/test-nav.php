<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$nav = app(\Aero\Core\Services\NavigationRegistry::class);
$navigation = $nav->toFrontend();

echo "=== NAVIGATION OUTPUT ===\n";
echo json_encode($navigation, JSON_PRETTY_PRINT);
echo "\n";
