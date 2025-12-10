<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    /**
     * Test basic health check endpoint returns healthy status.
     */
    public function test_basic_health_check_returns_healthy(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
            ])
            ->assertJson([
                'status' => 'healthy',
            ]);
    }

    /**
     * Test detailed health check returns all check categories.
     */
    public function test_detailed_health_check_returns_all_checks(): void
    {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'version',
                'environment',
                'checks' => [
                    'database' => ['status'],
                    'cache' => ['status'],
                    'storage' => ['status'],
                    'queue' => ['status'],
                    'memory' => ['status'],
                    'disk' => ['status'],
                ],
            ]);
    }

    /**
     * Test health check returns correct timestamp format.
     */
    public function test_health_check_returns_iso8601_timestamp(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);

        $data = $response->json();

        // Verify timestamp is valid ISO8601
        $this->assertNotFalse(
            strtotime($data['timestamp']),
            'Timestamp should be a valid ISO8601 date string'
        );
    }

    /**
     * Test detailed health check includes database driver info.
     */
    public function test_detailed_health_check_includes_database_info(): void
    {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200);

        $data = $response->json();

        $this->assertArrayHasKey('driver', $data['checks']['database']);
        $this->assertArrayHasKey('latency_ms', $data['checks']['database']);
    }

    /**
     * Test health check includes memory information.
     */
    public function test_detailed_health_check_includes_memory_info(): void
    {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200);

        $data = $response->json();

        $this->assertArrayHasKey('current', $data['checks']['memory']);
        $this->assertArrayHasKey('peak', $data['checks']['memory']);
        $this->assertArrayHasKey('usage_percent', $data['checks']['memory']);
    }

    /**
     * Test health check includes disk information.
     */
    public function test_detailed_health_check_includes_disk_info(): void
    {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200);

        $data = $response->json();

        $this->assertArrayHasKey('total', $data['checks']['disk']);
        $this->assertArrayHasKey('free', $data['checks']['disk']);
        $this->assertArrayHasKey('usage_percent', $data['checks']['disk']);
    }

    /**
     * Test health check is accessible without authentication.
     */
    public function test_health_check_is_publicly_accessible(): void
    {
        // No auth, should still work
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
    }
}
