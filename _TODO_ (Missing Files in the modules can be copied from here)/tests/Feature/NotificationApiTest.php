<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * NotificationApiTest
 *
 * Tests for the Notification API endpoints.
 * Note: Since notifications use tenant Users which require tenant context,
 * we test route protection and endpoint availability here.
 * Full CRUD tests should be run in a tenant context.
 */
class NotificationApiTest extends TestCase
{
    public function test_notification_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertUnauthorized();
    }

    public function test_notification_unread_count_requires_authentication(): void
    {
        $response = $this->getJson('/api/notifications/unread-count');

        $response->assertUnauthorized();
    }

    public function test_mark_as_read_requires_authentication(): void
    {
        $response = $this->postJson('/api/notifications/test-id/read');

        $response->assertUnauthorized();
    }

    public function test_mark_all_as_read_requires_authentication(): void
    {
        $response = $this->postJson('/api/notifications/read-all');

        $response->assertUnauthorized();
    }

    public function test_delete_notification_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/notifications/test-id');

        $response->assertUnauthorized();
    }

    public function test_preferences_requires_authentication(): void
    {
        $response = $this->getJson('/api/notifications/preferences');

        $response->assertUnauthorized();
    }

    public function test_update_preferences_requires_authentication(): void
    {
        $response = $this->putJson('/api/notifications/preferences', [
            'email' => false,
        ]);

        $response->assertUnauthorized();
    }

    public function test_routes_exist_and_are_named_correctly(): void
    {
        // Verify routes are properly named
        $this->assertTrue(app('router')->has('api.notifications.index'));
        $this->assertTrue(app('router')->has('api.notifications.unread-count'));
        $this->assertTrue(app('router')->has('api.notifications.mark-read'));
        $this->assertTrue(app('router')->has('api.notifications.mark-all-read'));
        $this->assertTrue(app('router')->has('api.notifications.destroy'));
        $this->assertTrue(app('router')->has('api.notifications.preferences'));
        $this->assertTrue(app('router')->has('api.notifications.preferences.update'));
    }
}
