<?php

namespace Tools\ModuleExtraction;

/**
 * Test Extractor
 * 
 * Extracts and adapts tests for the module
 */
class TestExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("🧪 Extracting tests...");

        $featureCount = $this->extractFeatureTests();
        $unitCount = $this->extractUnitTests();
        $totalCount = $featureCount + $unitCount;

        if ($totalCount === 0) {
            $this->log("   ℹ No tests found for this module");
            $this->createDefaultTests();
        } else {
            $this->log("   📊 Extracted {$totalCount} test(s) ({$featureCount} feature, {$unitCount} unit)");
        }

        // Create PHPUnit configuration
        $this->createPhpUnitConfig();

        $this->log("");
    }

    /**
     * Extract feature tests
     */
    protected function extractFeatureTests(): int
    {
        $sourceDir = $this->extractor->getBasePath() . "/tests/Feature";
        
        if (!is_dir($sourceDir)) {
            return 0;
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            if ($this->isModuleFile($file)) {
                $relativePath = $this->getRelativePath($file, $sourceDir);
                $destinationPath = $this->outputPath . "/tests/Feature/" . $relativePath;
                
                if ($this->copyAndTransformTest($file, $destinationPath)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Extract unit tests
     */
    protected function extractUnitTests(): int
    {
        $sourceDir = $this->extractor->getBasePath() . "/tests/Unit";
        
        if (!is_dir($sourceDir)) {
            return 0;
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            if ($this->isModuleFile($file)) {
                $relativePath = $this->getRelativePath($file, $sourceDir);
                $destinationPath = $this->outputPath . "/tests/Unit/" . $relativePath;
                
                if ($this->copyAndTransformTest($file, $destinationPath)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Copy and transform test file
     */
    protected function copyAndTransformTest(string $sourcePath, string $destinationPath): bool
    {
        if (!file_exists($sourcePath)) {
            return false;
        }

        $content = file_get_contents($sourcePath);

        // Transform namespaces
        $content = str_replace(
            'namespace Tests\\',
            'namespace ' . $this->namespace . '\\Tests\\',
            $content
        );

        // Transform use statements
        $content = $this->transformImports($content);

        // Ensure destination directory exists
        $destinationDir = dirname($destinationPath);
        if (!is_dir($destinationDir)) {
            mkdir($destinationDir, 0755, true);
        }

        file_put_contents($destinationPath, $content);

        $this->extractor->recordExtractedFile($sourcePath, $destinationPath);

        return true;
    }

    /**
     * Create default tests
     */
    protected function createDefaultTests(): void
    {
        $this->createDefaultFeatureTest();
        $this->createDefaultUnitTest();
        $this->createTestCase();
    }

    /**
     * Create default feature test
     */
    protected function createDefaultFeatureTest(): void
    {
        $variants = $this->getModuleNameVariants();
        $moduleName = $variants['studly'];

        $content = <<<PHP
<?php

namespace {$this->namespace}\Tests\Feature;

use {$this->namespace}\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * {$moduleName} Module Feature Test
 */
class {$moduleName}Test extends TestCase
{
    use RefreshDatabase;

    /**
     * Test module installation
     */
    public function test_module_routes_are_accessible(): void
    {
        \$response = \$this->get('/{$variants['lower']}');
        
        // Adjust based on your actual routes
        \$response->assertStatus(200);
    }

    /**
     * Add more feature tests here
     */
}

PHP;

        $testPath = $this->outputPath . "/tests/Feature/{$moduleName}Test.php";
        file_put_contents($testPath, $content);

        $this->log("   ✓ Created default feature test");
    }

    /**
     * Create default unit test
     */
    protected function createDefaultUnitTest(): void
    {
        $variants = $this->getModuleNameVariants();

        $content = <<<PHP
<?php

namespace {$this->namespace}\Tests\Unit;

use {$this->namespace}\Tests\TestCase;

/**
 * {$variants['studly']} Module Unit Test
 */
class {$variants['studly']}UnitTest extends TestCase
{
    /**
     * Basic unit test example
     */
    public function test_example(): void
    {
        \$this->assertTrue(true);
    }

    /**
     * Add more unit tests here
     */
}

PHP;

        $testPath = $this->outputPath . "/tests/Unit/{$variants['studly']}UnitTest.php";
        file_put_contents($testPath, $content);

        $this->log("   ✓ Created default unit test");
    }

    /**
     * Create TestCase base class
     */
    protected function createTestCase(): void
    {
        $content = <<<PHP
<?php

namespace {$this->namespace}\Tests;

use Orchestra\Testbench\TestCase as Orchestra;
use {$this->namespace}\\{$this->getModuleNameVariants()['studly']}ServiceProvider;

/**
 * Base TestCase for package tests
 */
class TestCase extends Orchestra
{
    protected function setUp(): void
    {
        parent::setUp();

        // Additional setup
    }

    /**
     * Get package providers
     */
    protected function getPackageProviders(\$app): array
    {
        return [
            {$this->getModuleNameVariants()['studly']}ServiceProvider::class,
        ];
    }

    /**
     * Define environment setup
     */
    protected function getEnvironmentSetUp(\$app): void
    {
        // Setup default database to use sqlite :memory:
        \$app['config']->set('database.default', 'testbench');
        \$app['config']->set('database.connections.testbench', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);
    }
}

PHP;

        $testCasePath = $this->outputPath . "/tests/TestCase.php";
        file_put_contents($testCasePath, $content);

        $this->log("   ✓ Created TestCase base class");
    }

    /**
     * Create PHPUnit configuration
     */
    protected function createPhpUnitConfig(): void
    {
        $variants = $this->getModuleNameVariants();

        $content = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         failOnRisky="true"
         failOnWarning="true">
    <testsuites>
        <testsuite name="{$variants['studly']} Test Suite">
            <directory suffix="Test.php">./tests</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./src</directory>
        </include>
    </coverage>
</phpunit>

XML;

        $configPath = $this->outputPath . "/phpunit.xml";
        file_put_contents($configPath, $content);

        $this->log("   ✓ Created phpunit.xml");
    }
}
