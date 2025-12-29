<?php

declare(strict_types=1);

namespace Aero\Platform\Tests\Feature;

use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Policies\TenantPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * @covers \Aero\Platform\Policies\TenantPolicy
 */
class TenantPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected TenantPolicy $policy;

    protected LandlordUser $superAdmin;

    protected LandlordUser $adminUser;

    protected LandlordUser $regularUser;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new TenantPolicy();

        // Create roles with appropriate module access
        $this->setupRolesAndUsers();

        // Create test tenant
        $this->tenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ACTIVE,
        ]);
    }

    protected function setupRolesAndUsers(): void
    {
        // Create Super Administrator role (has all access)
        $superAdminRole = Role::create([
            'name' => 'Super Administrator',
            'guard_name' => 'landlord',
        ]);

        // Create Platform Admin role with tenant management access
        $platformAdminRole = Role::create([
            'name' => 'Platform Admin',
            'guard_name' => 'landlord',
        ]);

        // Create Regular User role with limited access
        $regularRole = Role::create([
            'name' => 'Regular User',
            'guard_name' => 'landlord',
        ]);

        // Create users with roles
        $this->superAdmin = LandlordUser::factory()->create();
        $this->superAdmin->assignRole($superAdminRole);

        $this->adminUser = LandlordUser::factory()->create();
        $this->adminUser->assignRole($platformAdminRole);

        $this->regularUser = LandlordUser::factory()->create();
        $this->regularUser->assignRole($regularRole);
    }

    public function testSuperAdminCanViewAnyTenants(): void
    {
        $this->assertTrue($this->policy->viewAny($this->superAdmin));
    }

    public function testSuperAdminCanViewTenant(): void
    {
        $this->assertTrue($this->policy->view($this->superAdmin, $this->tenant));
    }

    public function testSuperAdminCanCreateTenant(): void
    {
        $this->assertTrue($this->policy->create($this->superAdmin));
    }

    public function testSuperAdminCanUpdateTenant(): void
    {
        $this->assertTrue($this->policy->update($this->superAdmin, $this->tenant));
    }

    public function testSuperAdminCanDeleteTenant(): void
    {
        $this->assertTrue($this->policy->delete($this->superAdmin, $this->tenant));
    }

    public function testSuperAdminCanSuspendActiveTenant(): void
    {
        $activeTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $this->assertTrue($this->policy->suspend($this->superAdmin, $activeTenant));
    }

    public function testCannotSuspendAlreadySuspendedTenant(): void
    {
        $suspendedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_SUSPENDED,
        ]);

        $this->assertFalse($this->policy->suspend($this->superAdmin, $suspendedTenant));
    }

    public function testCannotSuspendArchivedTenant(): void
    {
        $archivedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ARCHIVED,
        ]);

        $this->assertFalse($this->policy->suspend($this->superAdmin, $archivedTenant));
    }

    public function testSuperAdminCanActivateSuspendedTenant(): void
    {
        $suspendedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_SUSPENDED,
        ]);

        $this->assertTrue($this->policy->activate($this->superAdmin, $suspendedTenant));
    }

    public function testSuperAdminCanActivatePendingTenant(): void
    {
        $pendingTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_PENDING,
        ]);

        $this->assertTrue($this->policy->activate($this->superAdmin, $pendingTenant));
    }

    public function testCannotActivateAlreadyActiveTenant(): void
    {
        $activeTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $this->assertFalse($this->policy->activate($this->superAdmin, $activeTenant));
    }

    public function testSuperAdminCanArchiveActiveTenant(): void
    {
        $activeTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $this->assertTrue($this->policy->archive($this->superAdmin, $activeTenant));
    }

    public function testCannotArchiveAlreadyArchivedTenant(): void
    {
        $archivedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ARCHIVED,
        ]);

        $this->assertFalse($this->policy->archive($this->superAdmin, $archivedTenant));
    }

    public function testSuperAdminCanImpersonateActiveTenant(): void
    {
        $activeTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $this->assertTrue($this->policy->impersonate($this->superAdmin, $activeTenant));
    }

    public function testSuperAdminCanImpersonatePendingTenant(): void
    {
        $pendingTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_PENDING,
        ]);

        $this->assertTrue($this->policy->impersonate($this->superAdmin, $pendingTenant));
    }

    public function testCannotImpersonateSuspendedTenant(): void
    {
        $suspendedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_SUSPENDED,
        ]);

        $this->assertFalse($this->policy->impersonate($this->superAdmin, $suspendedTenant));
    }

    public function testCannotImpersonateArchivedTenant(): void
    {
        $archivedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ARCHIVED,
        ]);

        $this->assertFalse($this->policy->impersonate($this->superAdmin, $archivedTenant));
    }

    public function testSuperAdminCanRetryProvisioningForFailedTenant(): void
    {
        $failedTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_FAILED,
        ]);

        $this->assertTrue($this->policy->retryProvisioning($this->superAdmin, $failedTenant));
    }

    public function testCannotRetryProvisioningForNonFailedTenant(): void
    {
        $activeTenant = Tenant::factory()->create([
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $this->assertFalse($this->policy->retryProvisioning($this->superAdmin, $activeTenant));
    }

    public function testSuperAdminCanViewDomains(): void
    {
        $this->assertTrue($this->policy->viewDomains($this->superAdmin));
    }

    public function testSuperAdminCanManageDomains(): void
    {
        $this->assertTrue($this->policy->manageDomains($this->superAdmin));
    }

    public function testSuperAdminCanViewDatabases(): void
    {
        $this->assertTrue($this->policy->viewDatabases($this->superAdmin));
    }

    public function testSuperAdminCanMigrateDatabases(): void
    {
        $this->assertTrue($this->policy->migrateDatabases($this->superAdmin));
    }

    public function testSuperAdminCanBackupDatabases(): void
    {
        $this->assertTrue($this->policy->backupDatabases($this->superAdmin));
    }

    public function testSuperAdminCanForceDeleteTenant(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->superAdmin, $this->tenant));
    }

    public function testSuperAdminCanRestoreTenant(): void
    {
        $this->assertTrue($this->policy->restore($this->superAdmin, $this->tenant));
    }
}
