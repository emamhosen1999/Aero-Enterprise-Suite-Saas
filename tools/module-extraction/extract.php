<?php

/**
 * Module Extraction CLI
 * 
 * Command-line interface for extracting modules from the monolithic application
 * 
 * Usage:
 *   php tools/module-extraction/extract.php <module-name> [options]
 * 
 * Examples:
 *   php tools/module-extraction/extract.php hrm
 *   php tools/module-extraction/extract.php crm --output=../packages/aero-crm
 *   php tools/module-extraction/extract.php finance --dry-run
 */

// Autoload dependencies
require __DIR__ . '/../../vendor/autoload.php';

// Require all extractor classes
require_once __DIR__ . '/ModuleExtractor.php';
require_once __DIR__ . '/BaseExtractor.php';
require_once __DIR__ . '/ModelExtractor.php';
require_once __DIR__ . '/ControllerExtractor.php';
require_once __DIR__ . '/ServiceExtractor.php';
require_once __DIR__ . '/MiddlewareExtractor.php';
require_once __DIR__ . '/RequestExtractor.php';
require_once __DIR__ . '/PolicyExtractor.php';
require_once __DIR__ . '/MigrationExtractor.php';
require_once __DIR__ . '/SeederExtractor.php';
require_once __DIR__ . '/RouteExtractor.php';
require_once __DIR__ . '/ConfigExtractor.php';
require_once __DIR__ . '/FrontendExtractor.php';
require_once __DIR__ . '/TestExtractor.php';
require_once __DIR__ . '/ComposerJsonGenerator.php';
require_once __DIR__ . '/ServiceProviderGenerator.php';
require_once __DIR__ . '/ReadmeGenerator.php';
require_once __DIR__ . '/LicenseGenerator.php';
require_once __DIR__ . '/ChangelogGenerator.php';
require_once __DIR__ . '/PackageValidator.php';

use Tools\ModuleExtraction\ModuleExtractor;

/**
 * Parse command-line arguments
 */
function parseArguments(array $argv): array
{
    $moduleName = $argv[1] ?? null;
    $options = [];

    for ($i = 2; $i < count($argv); $i++) {
        $arg = $argv[$i];
        
        if (strpos($arg, '--') === 0) {
            $parts = explode('=', substr($arg, 2), 2);
            $key = $parts[0];
            $value = $parts[1] ?? true;
            $options[$key] = $value;
        }
    }

    return [$moduleName, $options];
}

/**
 * Display usage information
 */
function displayUsage()
{
    echo <<<'HELP'

╔════════════════════════════════════════════════════════════════════════╗
║                    MODULE EXTRACTION TOOL                              ║
╚════════════════════════════════════════════════════════════════════════╝

Extract a module from the monolithic application into an independent
Composer package that can be distributed and used standalone or in
multi-tenant platforms.

USAGE:
  php tools/module-extraction/extract.php <module> [options]

ARGUMENTS:
  module          Name of the module to extract (e.g., hrm, crm, finance)

OPTIONS:
  --output=PATH   Output directory path (default: packages/aero-<module>)
  --dry-run       Show what would be extracted without actually extracting
  --help          Display this help message

EXAMPLES:
  # Extract HRM module to default location
  php tools/module-extraction/extract.php hrm

  # Extract CRM module to custom location
  php tools/module-extraction/extract.php crm --output=../my-packages/crm

  # Dry run to see what would be extracted
  php tools/module-extraction/extract.php finance --dry-run

AVAILABLE MODULES:
  - hrm           Human Resource Management
  - crm           Customer Relationship Management
  - finance       Financial Management
  - project       Project Management
  - dms           Document Management System
  - quality       Quality Management
  - compliance    Compliance Management
  - analytics     Analytics & Reporting
  - pos           Point of Sale
  - ecommerce     E-Commerce

For more information, visit: https://docs.aero.com/module-extraction

HELP;
}

/**
 * Main execution
 */
function main(array $argv): int
{
    [$moduleName, $options] = parseArguments($argv);

    // Check for help
    if (isset($options['help']) || $moduleName === null) {
        displayUsage();
        return 0;
    }

    // Validate module name
    if (empty($moduleName)) {
        echo "❌ Error: Module name is required\n\n";
        displayUsage();
        return 1;
    }

    // Build configuration from options
    $config = [];
    if (isset($options['output'])) {
        $config['output_path'] = $options['output'];
    }

    // Dry run mode
    if (isset($options['dry-run'])) {
        echo "🔍 DRY RUN MODE - No files will be created\n\n";
        // TODO: Implement dry-run mode
        return 0;
    }

    // Create extractor and run
    try {
        $extractor = new ModuleExtractor($moduleName, $config);
        $result = $extractor->extract();

        return 0;
    } catch (\Exception $e) {
        echo "\n❌ Extraction failed: " . $e->getMessage() . "\n";
        echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
        return 1;
    }
}

// Execute
exit(main($argv));
