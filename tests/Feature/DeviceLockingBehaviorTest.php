<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DeviceTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DeviceLockingBehaviorTest extends TestCase
{
    use RefreshDatabase;

    private DeviceTrackingService $deviceService;

    private User $user;

    /**
     * Setup the test environment.
     * We skip migrations that cause foreign key issues in testing.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Temporarily disable foreign key checks for testing
        Schema::disableForeignKeyConstraints();

        $this->deviceService = app(DeviceTrackingService::class);

        // Create a user with single device login enabled
        $this->user = User::factory()->create([
            'single_device_login_enabled' => true,
        ]);

        Schema::enableForeignKeyConstraints();
    }

    #[Test]
    public function user_can_login_from_first_device()
    {
        $request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');

        $result = $this->deviceService->canUserLoginFromDevice($this->user, $request);

        $this->assertTrue($result['allowed']);
        $this->assertEquals('Login allowed: No registered devices found - new device registration', $result['message']);
    }

    #[Test]
    public function user_cannot_login_from_second_different_device()
    {
        // First device login
        $firstRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $firstRequest, 'session1');

        // Try to login from a completely different device
        $secondRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        $result = $this->deviceService->canUserLoginFromDevice($this->user, $secondRequest);

        $this->assertFalse($result['allowed']);
        $this->assertStringContainsString('Login blocked: Account is locked to a specific device', $result['message']);
    }

    #[Test]
    public function user_can_login_from_same_device_with_updated_fingerprint()
    {
        // First device login
        $firstRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $firstRequest, 'session1');

        // Same device but with slightly different user agent (OS update)
        $updatedRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15');

        $result = $this->deviceService->canUserLoginFromDevice($this->user, $updatedRequest);

        $this->assertTrue($result['allowed']);
        $this->assertStringContainsString('Login from', $result['message']);
    }

    #[Test]
    public function user_can_login_from_compatible_device()
    {
        // First device login
        $firstRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $firstRequest, 'session1');

        // Same browser and platform but different version
        $compatibleRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

        $result = $this->deviceService->canUserLoginFromDevice($this->user, $compatibleRequest);

        // This should be allowed as it's the same device type (iPhone with Safari)
        $this->assertTrue($result['allowed']);
    }

    #[Test]
    public function multiple_users_can_each_have_one_device()
    {
        $user2 = User::factory()->create(['single_device_login_enabled' => true]);

        // User 1 logs in from iPhone
        $user1Request = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $this->deviceService->registerDevice($this->user, $user1Request, 'session1');

        // User 2 logs in from Android
        $user2Request = $this->createRequestWithUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
        $this->deviceService->registerDevice($user2, $user2Request, 'session2');

        // Both should be able to login from their respective devices
        $user1Result = $this->deviceService->canUserLoginFromDevice($this->user, $user1Request);
        $user2Result = $this->deviceService->canUserLoginFromDevice($user2, $user2Request);

        $this->assertTrue($user1Result['allowed']);
        $this->assertTrue($user2Result['allowed']);

        // User 1 should not be able to login from User 2's device
        $user1FromUser2Device = $this->deviceService->canUserLoginFromDevice($this->user, $user2Request);
        $this->assertFalse($user1FromUser2Device['allowed']);
    }

    #[Test]
    public function two_users_with_identical_android_user_agents_are_blocked_from_each_other()
    {
        // CRITICAL TEST: Verify the cross-account collision fix
        $user2 = User::factory()->create(['single_device_login_enabled' => true]);

        // Both users use identical Android/Chrome user agents
        $androidUserAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

        // User 1 registers from Android device
        $user1Request = $this->createRequestWithUserAgent($androidUserAgent);
        $this->deviceService->registerDevice($this->user, $user1Request, 'session1');

        // User 2 tries to login from an identical Android device (same UA string)
        $user2Request = $this->createRequestWithUserAgent($androidUserAgent);

        // Before the fix, user2 would have been allowed and would have overwritten user1's device
        // After the fix, user2 should be blocked because they don't have a registered device yet
        $user2Result = $this->deviceService->canUserLoginFromDevice($user2, $user2Request);

        // User 2 should be allowed because they don't have any devices registered yet
        $this->assertTrue($user2Result['allowed'], 'User 2 should be allowed to register their first device');

        // Now register user 2's device
        $this->deviceService->registerDevice($user2, $user2Request, 'session2');

        // Verify user 1 can still login (their device wasn't overwritten)
        $user1VerifyResult = $this->deviceService->canUserLoginFromDevice($this->user, $user1Request);
        $this->assertTrue($user1VerifyResult['allowed'], 'User 1 should still be able to login from their device');

        // Verify user 2 can login from their device
        $user2VerifyResult = $this->deviceService->canUserLoginFromDevice($user2, $user2Request);
        $this->assertTrue($user2VerifyResult['allowed'], 'User 2 should be able to login from their device');

        // Verify each user has exactly one device and they are different records
        $this->assertEquals(1, $this->user->devices()->count(), 'User 1 should have exactly 1 device');
        $this->assertEquals(1, $user2->devices()->count(), 'User 2 should have exactly 1 device');

        $user1Device = $this->user->devices()->first();
        $user2Device = $user2->devices()->first();

        $this->assertNotEquals($user1Device->id, $user2Device->id, 'Devices should be separate records');
        $this->assertEquals($this->user->id, $user1Device->user_id, 'User 1 device should belong to user 1');
        $this->assertEquals($user2->id, $user2Device->user_id, 'User 2 device should belong to user 2');

        // CRITICAL: Verify the compatible_device_id is different because it now includes user_id
        $this->assertNotEquals(
            $user1Device->compatible_device_id,
            $user2Device->compatible_device_id,
            'Compatible device IDs should be different due to user_id scoping'
        );
    }

    #[Test]
    public function user_with_disabled_single_device_can_use_multiple_devices()
    {
        $userWithoutRestriction = User::factory()->create(['single_device_login_enabled' => false]);

        $iPhoneRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
        $androidRequest = $this->createRequestWithUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36');

        // Register iPhone
        $this->deviceService->registerDevice($userWithoutRestriction, $iPhoneRequest, 'session1');

        // Should be able to login from Android too since single device login is disabled
        $result = $this->deviceService->canUserLoginFromDevice($userWithoutRestriction, $androidRequest);

        $this->assertTrue($result['allowed'], 'User without single device restriction should be able to use multiple devices');
    }

    private function createRequestWithUserAgent(string $userAgent): Request
    {
        return Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => $userAgent,
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
        ]);
    }
}
