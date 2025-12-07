<?php

/**
 * Module Extraction Validator
 * 
 * Validates manually extracted module packages.
 * Checks for completeness, correctness, and potential issues.
 * 
 * Usage:
 *   php tools/module-analysis/validate.php /path/to/package
 *   php tools/module-analysis/validate.php ../packages/aero-hrm --save
 */

// Try to load composer autoload, but continue if not available
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require __DIR__ . '/../../vendor/autoload.php';
}

require __DIR__ . '/ExtractionValidator.php';

use Tools\ModuleAnalysis\ExtractionValidator;

// Parse command line arguments
$packagePath = $argv[1] ?? null;
$saveReport = in_array('--save', $argv);

if (!$packagePath) {
    echo "❌ Error: Package path is required\n\n";
    echo "Usage:\n";
    echo "  php tools/module-analysis/validate.php <package-path> [--save]\n\n";
    echo "Examples:\n";
    echo "  php tools/module-analysis/validate.php ../packages/aero-hrm\n";
    echo "  php tools/module-analysis/validate.php /var/www/packages/aero-crm --save\n\n";
    exit(1);
}

if (!is_dir($packagePath)) {
    echo "❌ Error: Package path does not exist or is not a directory: {$packagePath}\n";
    exit(1);
}

echo "╔══════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                                                                              ║\n";
echo "║                       MODULE EXTRACTION VALIDATOR                            ║\n";
echo "║                                                                              ║\n";
echo "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";

try {
    $validator = new ExtractionValidator($packagePath);
    $results = $validator->validate();
    
    echo "\n";
    echo $validator->generateReport();
    
    if ($saveReport) {
        echo "\n";
        $filepath = $validator->saveReport();
        echo "\n✅ Validation complete! Reports saved.\n";
    } else {
        echo "\n✅ Validation complete!\n";
        echo "   Tip: Use --save flag to save the report to a file.\n";
    }
    
    // Exit with appropriate code
    exit($results['passed'] ? 0 : 1);
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
