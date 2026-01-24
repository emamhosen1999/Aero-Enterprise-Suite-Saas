<?php

namespace Aero\HRM\Tests\Feature;

use PHPUnit\Framework\TestCase;

class ProfileUpdateRouteTest extends TestCase
{
    public function test_profile_update_route_name_exists_in_routes_file(): void
    {
        $routesPath = __DIR__ . '/../../routes/web.php';
        $contents = file_get_contents($routesPath);

        $this->assertNotFalse($contents);
        $this->assertStringContainsString("->name('profile.update')", $contents);
    }
}
