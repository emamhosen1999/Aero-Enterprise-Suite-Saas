<?php

/**
 * Module Dependency Analyzer
 * 
 * Analyzes module dependencies without performing extraction.
 * Generates reports for manual extraction planning.
 * 
 * Usage:
 *   php tools/module-analysis/analyze.php hrm
 *   php tools/module-analysis/analyze.php hrm --save
 *   php tools/module-analysis/analyze.php crm --format=json
 */

// Try to load composer autoload, but continue if not available
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require __DIR__ . '/../../vendor/autoload.php';
}

require __DIR__ . '/DependencyAnalyzer.php';

use Tools\ModuleAnalysis\DependencyAnalyzer;

// Parse command line arguments
$moduleName = $argv[1] ?? null;
$saveReport = in_array('--save', $argv);
$format = 'text';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--format=')) {
        $format = str_replace('--format=', '', $arg);
    }
}

if (!$moduleName) {
    echo "❌ Error: Module name is required\n\n";
    echo "Usage:\n";
    echo "  php tools/module-analysis/analyze.php <module-name> [--save] [--format=text|json]\n\n";
    echo "Examples:\n";
    echo "  php tools/module-analysis/analyze.php hrm\n";
    echo "  php tools/module-analysis/analyze.php hrm --save\n";
    echo "  php tools/module-analysis/analyze.php crm --format=json\n\n";
    exit(1);
}

echo "╔══════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                                                                              ║\n";
echo "║                       MODULE DEPENDENCY ANALYZER                             ║\n";
echo "║                                                                              ║\n";
echo "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";

try {
    $analyzer = new DependencyAnalyzer($moduleName);
    $results = $analyzer->analyze();
    
    echo "\n";
    
    if ($format === 'json') {
        echo json_encode($results, JSON_PRETTY_PRINT);
    } else {
        echo $analyzer->generateReport();
    }
    
    if ($saveReport) {
        echo "\n";
        $filepath = $analyzer->saveReport();
        echo "\n✅ Analysis complete! Reports saved.\n";
    } else {
        echo "\n✅ Analysis complete!\n";
        echo "   Tip: Use --save flag to save the report to a file.\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
