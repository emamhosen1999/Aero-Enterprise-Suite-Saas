<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DeviceTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DeviceLockDebugTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected DeviceTrackingService $deviceService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'id' => 18,
            'email' => 'test@example.com',
            'single_device_login_enabled' => true,
        ]);

        $this->deviceService = app(DeviceTrackingService::class);
    }

    /** @test */
    public function debug_device_lock_behavior_for_same_device()
    {
        // Simulate iPhone 12 Pro with iOS 26
        $request = Request::create('/', 'GET');
        $request->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $request->server->set('REMOTE_ADDR', '192.168.1.100');
        $request->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $request->headers->set('Accept-Encoding', 'gzip, deflate, br');

        // Generate device ID for this request
        $deviceId = $this->deviceService->generateDeviceId($request);
        echo "\nGenerated Device ID: ".$deviceId."\n";

        // First login attempt - should be allowed
        $firstLoginCheck = $this->deviceService->canUserLoginFromDevice($this->user, $request);
        echo 'First login check result: '.json_encode($firstLoginCheck, JSON_PRETTY_PRINT)."\n";
        $this->assertTrue($firstLoginCheck['allowed'], 'First login should be allowed');

        // Register the device (simulate successful login)
        $sessionId = 'test_session_'.time();
        $device = $this->deviceService->registerDevice($this->user, $request, $sessionId);
        echo 'Registered device: '.json_encode([
            'id' => $device->id,
            'device_id' => $device->device_id,
            'device_name' => $device->device_name,
            'is_active' => $device->is_active,
        ], JSON_PRETTY_PRINT)."\n";

        // Reload user with devices
        $this->user->refresh();
        $this->user->load('devices');

        echo 'User has '.$this->user->devices()->count()." devices\n";
        echo 'User has '.$this->user->devices()->active()->count()." active devices\n";

        // Second login attempt from the SAME device - should be allowed
        $sameDeviceRequest = Request::create('/', 'GET');
        $sameDeviceRequest->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $sameDeviceRequest->server->set('REMOTE_ADDR', '192.168.1.100');
        $sameDeviceRequest->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $sameDeviceRequest->headers->set('Accept-Encoding', 'gzip, deflate, br');

        $sameDeviceId = $this->deviceService->generateDeviceId($sameDeviceRequest);
        echo "\nSame device ID (second request): ".$sameDeviceId."\n";
        echo 'Device IDs match: '.($deviceId === $sameDeviceId ? 'YES' : 'NO')."\n";

        $secondLoginCheck = $this->deviceService->canUserLoginFromDevice($this->user, $sameDeviceRequest);
        echo 'Second login check (same device) result: '.json_encode($secondLoginCheck, JSON_PRETTY_PRINT)."\n";

        // This should be TRUE but might be FALSE due to a bug
        $this->assertTrue($secondLoginCheck['allowed'], 'Login from same device should be allowed');

        // Third login attempt from a DIFFERENT device - should be blocked
        $differentDeviceRequest = Request::create('/', 'GET');
        $differentDeviceRequest->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        $differentDeviceRequest->server->set('REMOTE_ADDR', '192.168.1.101');
        $differentDeviceRequest->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $differentDeviceRequest->headers->set('Accept-Encoding', 'gzip, deflate, br');

        $differentDeviceId = $this->deviceService->generateDeviceId($differentDeviceRequest);
        echo "\nDifferent device ID: ".$differentDeviceId."\n";

        $thirdLoginCheck = $this->deviceService->canUserLoginFromDevice($this->user, $differentDeviceRequest);
        echo 'Third login check (different device) result: '.json_encode($thirdLoginCheck, JSON_PRETTY_PRINT)."\n";

        $this->assertFalse($thirdLoginCheck['allowed'], 'Login from different device should be blocked');
    }

    /** @test */
    public function debug_device_fingerprinting_details()
    {
        // Test device fingerprinting with minimal changes
        $baseRequest = Request::create('/', 'GET');
        $baseRequest->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $baseRequest->server->set('REMOTE_ADDR', '192.168.1.100');
        $baseRequest->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $baseRequest->headers->set('Accept-Encoding', 'gzip, deflate, br');

        $baseDeviceId = $this->deviceService->generateDeviceId($baseRequest);
        echo "\nBase device ID: ".$baseDeviceId."\n";

        // Test with slightly different IP (might happen with dynamic IP)
        $differentIpRequest = Request::create('/', 'GET');
        $differentIpRequest->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $differentIpRequest->server->set('REMOTE_ADDR', '192.168.1.101'); // Different IP
        $differentIpRequest->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $differentIpRequest->headers->set('Accept-Encoding', 'gzip, deflate, br');

        $differentIpDeviceId = $this->deviceService->generateDeviceId($differentIpRequest);
        echo 'Different IP device ID: '.$differentIpDeviceId."\n";
        echo 'Device IDs match with different IP: '.($baseDeviceId === $differentIpDeviceId ? 'YES' : 'NO')."\n";

        // Test with missing headers
        $minimalRequest = Request::create('/', 'GET');
        $minimalRequest->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $minimalRequest->server->set('REMOTE_ADDR', '192.168.1.100');

        $minimalDeviceId = $this->deviceService->generateDeviceId($minimalRequest);
        echo 'Minimal headers device ID: '.$minimalDeviceId."\n";
        echo 'Device IDs match with minimal headers: '.($baseDeviceId === $minimalDeviceId ? 'YES' : 'NO')."\n";
    }

    /** @test */
    public function debug_actual_login_flow()
    {
        // Simulate the actual login flow
        $request = Request::create('/login', 'POST', [
            'email' => $this->user->email,
            'password' => 'password',
        ]);
        $request->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $request->server->set('REMOTE_ADDR', '192.168.1.100');
        $request->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $request->headers->set('Accept-Encoding', 'gzip, deflate, br');

        // First login - should succeed
        $response = $this->post('/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept-Language' => 'en-US,en;q=0.9',
            'Accept-Encoding' => 'gzip, deflate, br',
        ]);

        echo "\nFirst login response status: ".$response->getStatusCode()."\n";

        if ($response->getStatusCode() === 302) {
            echo 'Redirected to: '.$response->headers->get('Location')."\n";
        }

        // Check if user is authenticated
        $this->assertTrue(Auth::check(), 'User should be authenticated after first login');

        // Logout to test second login
        Auth::logout();

        // Second login from same device - should succeed but might fail due to bug
        $response2 = $this->post('/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept-Language' => 'en-US,en;q=0.9',
            'Accept-Encoding' => 'gzip, deflate, br',
        ]);

        echo "\nSecond login response status: ".$response2->getStatusCode()."\n";

        if ($response2->getStatusCode() === 302) {
            echo 'Redirected to: '.$response2->headers->get('Location')."\n";
        }

        // Check session flash messages
        $flashData = session()->all();
        if (! empty($flashData)) {
            echo 'Session flash data: '.json_encode($flashData, JSON_PRETTY_PRINT)."\n";
        }

        // The bug might be here - user can't login from the same device they were locked to
        echo 'User authenticated after second login: '.(Auth::check() ? 'YES' : 'NO')."\n";
    }
}
