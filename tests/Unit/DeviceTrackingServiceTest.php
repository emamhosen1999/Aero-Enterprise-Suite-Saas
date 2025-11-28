<?php

namespace Tests\Unit;

use App\Services\DeviceTrackingService;
use Illuminate\Http\Request;
use Tests\TestCase;

class DeviceTrackingServiceTest extends TestCase
{
    protected DeviceTrackingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DeviceTrackingService;
    }

    public function test_device_id_generation_excludes_ip_address()
    {
        // Create two requests with same browser/headers but different IPs
        $request1 = Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
            'REMOTE_ADDR' => '192.168.1.100',
        ]);

        $request2 = Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
            'REMOTE_ADDR' => '192.168.1.101', // Different IP
        ]);

        $deviceId1 = $this->service->generateDeviceId($request1);
        $deviceId2 = $this->service->generateDeviceId($request2);

        // Device IDs should be the same despite different IPs
        $this->assertEquals($deviceId1, $deviceId2, 'Device IDs should match when only IP differs');
    }

    public function test_device_id_changes_with_different_user_agent()
    {
        $request1 = Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
            'REMOTE_ADDR' => '192.168.1.100',
        ]);

        $request2 = Request::create('/', 'GET', [], [], [], [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'HTTP_ACCEPT_LANGUAGE' => 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING' => 'gzip, deflate, br',
            'REMOTE_ADDR' => '192.168.1.100',
        ]);

        $deviceId1 = $this->service->generateDeviceId($request1);
        $deviceId2 = $this->service->generateDeviceId($request2);

        // Device IDs should be different with different user agents
        $this->assertNotEquals($deviceId1, $deviceId2, 'Device IDs should differ when user agent differs');
    }

    public function test_compatible_device_id_generation()
    {
        $request = Request::create('/', 'GET');
        $request->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $request->server->set('REMOTE_ADDR', '192.168.1.100');

        $compatibleDeviceId = $this->service->generateCompatibleDeviceId($request);

        $this->assertNotEmpty($compatibleDeviceId, 'Compatible device ID should not be empty');
        $this->assertEquals(64, strlen($compatibleDeviceId), 'Compatible device ID should be SHA256 hash (64 chars)');
    }

    public function test_device_id_resilience_to_missing_headers()
    {
        // Request with full headers
        $request1 = Request::create('/', 'GET');
        $request1->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        $request1->headers->set('Accept-Language', 'en-US,en;q=0.9');
        $request1->headers->set('Accept-Encoding', 'gzip, deflate, br');

        // Request with minimal headers
        $request2 = Request::create('/', 'GET');
        $request2->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        // Missing Accept-Language and Accept-Encoding

        $deviceId1 = $this->service->generateDeviceId($request1);
        $deviceId2 = $this->service->generateDeviceId($request2);

        // Should generate different IDs but both should be valid
        $this->assertNotEmpty($deviceId1);
        $this->assertNotEmpty($deviceId2);
        $this->assertEquals(64, strlen($deviceId1), 'Device ID should be SHA256 hash');
        $this->assertEquals(64, strlen($deviceId2), 'Device ID should be SHA256 hash');
    }
}
