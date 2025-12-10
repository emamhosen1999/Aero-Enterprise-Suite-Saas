<?php

namespace Tests\Feature;

use Tests\TestCase;
use Aero\Core\Services\RuntimeLoader;
use Illuminate\Support\Facades\File;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * RuntimeLoader Test
 * 
 * Tests the RuntimeLoader service for dynamic module loading
 * in Standalone mode.
 */
class RuntimeLoaderTest extends TestCase
{
    protected RuntimeLoader $loader;
    protected string $testModulesPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testModulesPath = base_path('tests/fixtures/modules');
        $this->loader = new RuntimeLoader($this->testModulesPath);
    }

    protected function tearDown(): void
    {
        // Clean up test modules
        if (File::exists($this->testModulesPath)) {
            File::deleteDirectory($this->testModulesPath);
        }

        parent::tearDown();
    }

    public function test_loader_discovers_modules(): void
    {
        // Create test module
        $this->createTestModule('test-module', 'Aero\\TestModule');

        $modules = $this->loader->loadModules();

        $this->assertArrayHasKey('test-module', $modules);
    }

    public function test_loader_registers_psr4_namespace(): void
    {
        $this->createTestModule('test-module', 'Aero\\TestModule');
        $this->loader->loadModules();

        // Check if class can be autoloaded
        $this->assertTrue(class_exists('Aero\\TestModule\\TestClass'));
    }

    public function test_loader_skips_composer_loaded_modules(): void
    {
        // Create a module that's already loaded via Composer
        $this->createTestModule('aero-core', 'Aero\\Core');

        $modules = $this->loader->loadModules();

        $this->assertEquals('composer_loaded', $modules['aero-core']['status']);
    }

    public function test_loader_handles_invalid_module_json(): void
    {
        // Create module with invalid JSON
        $modulePath = $this->testModulesPath . '/invalid-module';
        File::makeDirectory($modulePath, 0755, true);
        File::put($modulePath . '/module.json', '{invalid json}');

        $modules = $this->loader->loadModules();

        $this->assertArrayNotHasKey('invalid-module', $modules);
    }

    public function test_loader_loads_module_by_name(): void
    {
        $this->createTestModule('specific-module', 'Aero\\SpecificModule');

        $result = $this->loader->loadModuleByName('specific-module');

        $this->assertTrue($result);
        $this->assertTrue($this->loader->isModuleLoaded('specific-module'));
    }

    public function test_loader_gets_module_info(): void
    {
        $this->createTestModule('info-module', 'Aero\\InfoModule');
        $this->loader->loadModules();

        $info = $this->loader->getModuleInfo('info-module');

        $this->assertNotNull($info);
        $this->assertEquals('Aero\\InfoModule', $info['namespace']);
    }

    /**
     * Create a test module structure.
     *
     * @param string $name
     * @param string $namespace
     * @return void
     */
    protected function createTestModule(string $name, string $namespace): void
    {
        $modulePath = $this->testModulesPath . '/' . $name;
        $srcPath = $modulePath . '/src';

        // Create directories
        File::makeDirectory($srcPath, 0755, true);

        // Create module.json
        $moduleConfig = [
            'name' => $name,
            'namespace' => $namespace,
            'providers' => [
                $namespace . '\\ServiceProvider',
            ],
        ];

        File::put(
            $modulePath . '/module.json',
            json_encode($moduleConfig, JSON_PRETTY_PRINT)
        );

        // Create test class
        $className = str_replace('\\', '/', $namespace);
        $classContent = <<<PHP
<?php

namespace {$namespace};

class TestClass
{
    public function test()
    {
        return 'Hello from {$name}';
    }
}
PHP;

        File::put($srcPath . '/TestClass.php', $classContent);
    }
}
