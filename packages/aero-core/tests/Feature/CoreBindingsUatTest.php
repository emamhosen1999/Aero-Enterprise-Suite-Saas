<?php

declare(strict_types=1);

namespace Aero\Core\Tests\Feature;

use Aero\Core\Contracts\TenantScopeInterface;
use Aero\Core\Services\NavigationRegistry;
use Tests\TestCase;

class CoreBindingsUatTest extends TestCase
{
    public function test_core_tenant_scope_and_navigation_registry_are_available(): void
    {
        $tenantScope = app(TenantScopeInterface::class);
        $registry = app(NavigationRegistry::class);

        $this->assertInstanceOf(TenantScopeInterface::class, $tenantScope);
        $this->assertInstanceOf(NavigationRegistry::class, $registry);
    }

    public function test_navigation_registry_accepts_and_returns_items(): void
    {
        $registry = app(NavigationRegistry::class);

        $registry->register('core', [
            ['name' => 'Dashboard', 'route' => 'dashboard.index'],
            ['name' => 'Users', 'route' => 'users.index'],
        ], priority: 10, scope: 'platform');

        $registry->register('hrm', [
            ['name' => 'Employees', 'route' => 'employees.index'],
        ], priority: 20);

        $all = $registry->all();

        $this->assertCount(3, $all);
        $this->assertSame('Dashboard', $all[0]['name']);
        $this->assertTrue($registry->hasModule('core'));
        $this->assertTrue($registry->hasModule('hrm'));
    }
}
