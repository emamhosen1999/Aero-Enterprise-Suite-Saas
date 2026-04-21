<?php

/**
 * Test bootstrap for aero-hrm package.
 *
 * Loads the host application's autoloader and registers the package's test
 * namespace, since autoload-dev entries are excluded from path-repository installs.
 */

// Search for the vendor autoloader — try CWD first (when run from host app),
// then common relative paths from the package root.
$possibleAutoloaders = [
    getcwd().'/vendor/autoload.php',          // cwd = host app directory
    __DIR__.'/../vendor/autoload.php',        // package has its own vendor
    __DIR__.'/../../../vendor/autoload.php',  // 3 levels up
    __DIR__.'/../../../../vendor/autoload.php',
    __DIR__.'/../../../../../aeos365/vendor/autoload.php',
];

$loader = null;
foreach ($possibleAutoloaders as $autoloader) {
    if (file_exists($autoloader)) {
        $loader = require $autoloader;
        break;
    }
}

if ($loader === null) {
    echo "Could not locate vendor/autoload.php. Run from host app directory.\n";
    exit(1);
}

// Register the package test namespace manually since autoload-dev is excluded
// from path-repository installs in the host app's vendor
$loader->addPsr4('Aero\\HRM\\Tests\\', __DIR__);
