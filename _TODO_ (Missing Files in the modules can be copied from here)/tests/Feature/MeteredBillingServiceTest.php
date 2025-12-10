<?php

namespace Tests\Feature;

use App\Services\Billing\MeteredBillingService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class MeteredBillingServiceTest extends TestCase
{
    protected MeteredBillingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MeteredBillingService;
        Cache::flush();
    }

    public function test_metric_constants_are_defined(): void
    {
        $this->assertEquals('api_calls', MeteredBillingService::METRIC_API_CALLS);
        $this->assertEquals('storage_gb', MeteredBillingService::METRIC_STORAGE_GB);
        $this->assertEquals('emails_sent', MeteredBillingService::METRIC_EMAILS_SENT);
        $this->assertEquals('sms_sent', MeteredBillingService::METRIC_SMS_SENT);
        $this->assertEquals('active_users', MeteredBillingService::METRIC_ACTIVE_USERS);
        $this->assertEquals('documents', MeteredBillingService::METRIC_DOCUMENTS);
        $this->assertEquals('projects', MeteredBillingService::METRIC_PROJECTS);
        $this->assertEquals('employees', MeteredBillingService::METRIC_EMPLOYEES);
    }

    public function test_metric_units_are_correct(): void
    {
        // Use reflection to test the protected method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getMetricUnit');
        $method->setAccessible(true);

        $this->assertEquals('calls', $method->invoke($this->service, 'api_calls'));
        $this->assertEquals('GB', $method->invoke($this->service, 'storage_gb'));
        $this->assertEquals('emails', $method->invoke($this->service, 'emails_sent'));
        $this->assertEquals('messages', $method->invoke($this->service, 'sms_sent'));
        $this->assertEquals('users', $method->invoke($this->service, 'active_users'));
        $this->assertEquals('documents', $method->invoke($this->service, 'documents'));
        $this->assertEquals('projects', $method->invoke($this->service, 'projects'));
        $this->assertEquals('employees', $method->invoke($this->service, 'employees'));
        $this->assertEquals('units', $method->invoke($this->service, 'unknown_metric'));
    }

    public function test_cache_key_includes_tenant_and_period(): void
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getUsageCacheKey');
        $method->setAccessible(true);

        $tenantId = 'test-tenant-123';
        $metricName = 'api_calls';

        $cacheKey = $method->invoke($this->service, $tenantId, $metricName);

        $this->assertStringContainsString('usage:', $cacheKey);
        $this->assertStringContainsString($tenantId, $cacheKey);
        $this->assertStringContainsString($metricName, $cacheKey);
        $this->assertStringContainsString(now()->format('Y-m'), $cacheKey);
    }

    public function test_usage_cache_updates_correctly(): void
    {
        $reflection = new \ReflectionClass($this->service);

        $updateMethod = $reflection->getMethod('updateUsageCache');
        $updateMethod->setAccessible(true);

        $getKeyMethod = $reflection->getMethod('getUsageCacheKey');
        $getKeyMethod->setAccessible(true);

        $tenantId = 'test-tenant-456';
        $metricName = 'api_calls';

        // Update cache with initial value
        $updateMethod->invoke($this->service, $tenantId, $metricName, 10.0);

        $cacheKey = $getKeyMethod->invoke($this->service, $tenantId, $metricName);
        $this->assertEquals(10.0, Cache::get($cacheKey));

        // Update cache with additional value
        $updateMethod->invoke($this->service, $tenantId, $metricName, 5.0);
        $this->assertEquals(15.0, Cache::get($cacheKey));
    }

    public function test_set_usage_cache_replaces_value(): void
    {
        $reflection = new \ReflectionClass($this->service);

        $setMethod = $reflection->getMethod('setUsageCache');
        $setMethod->setAccessible(true);

        $getKeyMethod = $reflection->getMethod('getUsageCacheKey');
        $getKeyMethod->setAccessible(true);

        $tenantId = 'test-tenant-789';
        $metricName = 'storage_gb';

        // Set initial value
        $setMethod->invoke($this->service, $tenantId, $metricName, 50.0);

        $cacheKey = $getKeyMethod->invoke($this->service, $tenantId, $metricName);
        $this->assertEquals(50.0, Cache::get($cacheKey));

        // Set new value (should replace, not add)
        $setMethod->invoke($this->service, $tenantId, $metricName, 75.0);
        $this->assertEquals(75.0, Cache::get($cacheKey));
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }
}
