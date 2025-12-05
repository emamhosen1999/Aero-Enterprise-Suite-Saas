<?php

namespace Tests\Feature;

use App\Models\ErrorLog;
use App\Models\LandlordUser;
use Tests\TestCase;

class ErrorLogApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Clean up any test error logs
        ErrorLog::query()->whereIn('trace_id', [
            'ERR-TEST-123',
            'ERR-VIEW-789',
            'ERR-STAT-001',
            'ERR-STAT-002',
            'ERR-RESOLVE-001',
            'ERR-DELETE-001',
        ])->forceDelete();
    }

    protected function tearDown(): void
    {
        // Clean up test error logs
        ErrorLog::query()->whereIn('trace_id', [
            'ERR-TEST-123',
            'ERR-VIEW-789',
            'ERR-STAT-001',
            'ERR-STAT-002',
            'ERR-RESOLVE-001',
            'ERR-DELETE-001',
        ])->forceDelete();

        parent::tearDown();
    }

    /**
     * Test that frontend errors can be logged via API
     */
    public function test_can_log_frontend_error(): void
    {
        $response = $this->postJson('/api/error-log', [
            'trace_id' => 'ERR-TEST-123',
            'error_type' => 'ReactError',
            'error_message' => 'Test error message',
            'stack_trace' => 'Error: Test\n    at Component.render',
            'url' => 'http://localhost/dashboard',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'timestamp' => now()->toIso8601String(),
            'module' => 'Dashboard',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('error_logs', [
            'error_type' => 'ReactError',
            'error_message' => 'Test error message',
            'origin' => 'frontend',
        ]);
    }

    /**
     * Test validation - frontend errors should log even without trace_id (it will be generated)
     */
    public function test_frontend_error_works_without_trace_id(): void
    {
        $response = $this->postJson('/api/error-log', [
            'error_message' => 'Test error message without trace',
            'url' => 'http://localhost/dashboard',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['trace_id']);
    }

    /**
     * Test that authenticated landlord users can list error logs
     */
    public function test_authenticated_user_can_list_error_logs(): void
    {
        // Get an existing landlord user
        $user = LandlordUser::first();

        if (! $user) {
            $this->markTestSkipped('No landlord users found in database');
        }

        ErrorLog::create([
            'trace_id' => 'ERR-VIEW-789',
            'error_type' => 'TestError',
            'http_code' => 500,
            'error_message' => 'Test error',
            'origin' => 'backend',
            'request_url' => '/test',
        ]);

        $response = $this->actingAs($user, 'landlord')
            ->getJson('/api/error-logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data',
                    'meta',
                ],
            ]);
    }

    /**
     * Test unauthenticated users cannot list error logs
     */
    public function test_unauthenticated_user_cannot_list_error_logs(): void
    {
        $response = $this->getJson('/api/error-logs');

        $response->assertStatus(401);
    }

    /**
     * Test that users can view a single error log
     */
    public function test_can_view_single_error_log(): void
    {
        $user = LandlordUser::first();

        if (! $user) {
            $this->markTestSkipped('No landlord users found in database');
        }

        $errorLog = ErrorLog::create([
            'trace_id' => 'ERR-VIEW-789',
            'error_type' => 'ViewTestError',
            'http_code' => 500,
            'error_message' => 'View test error',
            'origin' => 'backend',
            'request_url' => '/view-test',
        ]);

        $response = $this->actingAs($user, 'landlord')
            ->getJson("/api/error-logs/{$errorLog->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'trace_id' => 'ERR-VIEW-789',
                    'error_type' => 'ViewTestError',
                ],
            ]);
    }

    /**
     * Test error log statistics endpoint
     */
    public function test_can_get_error_log_stats(): void
    {
        $user = LandlordUser::first();

        if (! $user) {
            $this->markTestSkipped('No landlord users found in database');
        }

        ErrorLog::create([
            'trace_id' => 'ERR-STAT-001',
            'error_type' => 'ValidationException',
            'http_code' => 422,
            'error_message' => 'Validation failed',
            'origin' => 'backend',
            'request_url' => '/stat-test',
        ]);

        ErrorLog::create([
            'trace_id' => 'ERR-STAT-002',
            'error_type' => 'ServerError',
            'http_code' => 500,
            'error_message' => 'Server error',
            'origin' => 'frontend',
            'request_url' => '/stat-test-2',
        ]);

        $response = $this->actingAs($user, 'landlord')
            ->getJson('/api/error-logs/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_errors',
                    'unresolved_errors',
                    'frontend_errors',
                    'backend_errors',
                    'errors_today',
                    'top_error_types',
                    'errors_by_day',
                ],
            ]);
    }

    /**
     * Test marking an error as resolved
     */
    public function test_can_resolve_error_log(): void
    {
        $user = LandlordUser::first();

        if (! $user) {
            $this->markTestSkipped('No landlord users found in database');
        }

        $errorLog = ErrorLog::create([
            'trace_id' => 'ERR-RESOLVE-001',
            'error_type' => 'TestError',
            'http_code' => 500,
            'error_message' => 'Test error to resolve',
            'origin' => 'backend',
            'request_url' => '/resolve-test',
        ]);

        $this->assertNull($errorLog->resolved_at);

        $response = $this->actingAs($user, 'landlord')
            ->postJson("/api/error-logs/{$errorLog->id}/resolve");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $errorLog->refresh();
        $this->assertNotNull($errorLog->resolved_at);
    }

    /**
     * Test soft deleting an error log
     */
    public function test_can_soft_delete_error_log(): void
    {
        $user = LandlordUser::first();

        if (! $user) {
            $this->markTestSkipped('No landlord users found in database');
        }

        $errorLog = ErrorLog::create([
            'trace_id' => 'ERR-DELETE-001',
            'error_type' => 'TestError',
            'http_code' => 500,
            'error_message' => 'Test error to delete',
            'origin' => 'backend',
            'request_url' => '/delete-test',
        ]);

        $response = $this->actingAs($user, 'landlord')
            ->deleteJson("/api/error-logs/{$errorLog->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertSoftDeleted('error_logs', [
            'id' => $errorLog->id,
        ]);
    }
}
