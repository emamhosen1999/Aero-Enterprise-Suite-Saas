<?php

declare(strict_types=1);

namespace Tests\Feature;

use PHPUnit\Framework\TestCase;

class RouteConventionGuardTest extends TestCase
{
    public function test_core_module_provider_exposes_only_web_route_map(): void
    {
        $content = $this->read('packages/aero-core/src/Providers/CoreModuleProvider.php');

        $this->assertStringContainsString("'web' => \$this->getModulePath('routes/web.php')", $content);
        $this->assertStringNotContainsString("'api' => \$this->getModulePath('routes/api.php')", $content);
        $this->assertStringNotContainsString("'tenant' => \$this->getModulePath('routes/tenant.php')", $content);
        $this->assertStringNotContainsString("'admin' => \$this->getModulePath('routes/admin.php')", $content);
    }

    public function test_platform_provider_registers_web_and_admin_route_files_only(): void
    {
        $content = $this->read('packages/aero-platform/src/AeroPlatformServiceProvider.php');

        $this->assertStringContainsString("__DIR__.'/../routes/web.php'", $content);
        $this->assertStringContainsString("__DIR__.'/../routes/admin.php'", $content);
        $this->assertStringNotContainsString("__DIR__.'/../routes/api.php');", $content);
    }

    public function test_legacy_module_providers_do_not_load_api_or_tenant_route_files(): void
    {
        $providers = [
            'packages/aero-field-service/src/Providers/FieldServiceServiceProvider.php',
            'packages/aero-healthcare/src/Providers/HealthcareServiceProvider.php',
            'packages/aero-integration/src/Providers/IntegrationServiceProvider.php',
            'packages/aero-iot/src/Providers/IoTServiceProvider.php',
            'packages/aero-blockchain/src/Providers/BlockchainServiceProvider.php',
        ];

        foreach ($providers as $provider) {
            $content = $this->read($provider);

            $this->assertStringContainsString("routes/web.php", $content, $provider);
            $this->assertStringNotContainsString("routes/api.php", $content, $provider);
            $this->assertStringNotContainsString("routes/tenant.php", $content, $provider);
        }
    }

    public function test_rfi_module_provider_does_not_double_register_api_routes(): void
    {
        $content = $this->read('packages/aero-rfi/src/Providers/RfiModuleProvider.php');

        $this->assertStringContainsString('Intentionally no-op.', $content);
        $this->assertStringNotContainsString('routes/api.php', $content);
    }

    private function read(string $relativePath): string
    {
        $path = dirname(__DIR__, 2).'/'.$relativePath;
        $this->assertFileExists($path);

        $content = file_get_contents($path);
        $this->assertNotFalse($content);

        return (string) $content;
    }
}
