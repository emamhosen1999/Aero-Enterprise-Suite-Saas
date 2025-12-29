<?php

declare(strict_types=1);

namespace Aero\Platform\Tests\Feature;

use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Services\Monitoring\Tenant\TenantProvisioner;
use Aero\Platform\Services\Tenant\TenantRetentionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * @covers \Aero\Platform\Http\Controllers\TenantController
 */
class TenantControllerTest extends TestCase
{
    use RefreshDatabase;

    protected LandlordUser $superAdmin;

    protected LandlordUser $platformAdmin;

    protected LandlordUser $regularUser;

    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupRolesAndUsers();
        $this->plan = Plan::factory()->create();
    }

    protected function setupRolesAndUsers(): void
    {
        // Create Super Administrator role
        $superAdminRole = Role::create([
            'name' => 'Super Administrator',
            'guard_name' => 'landlord',
        ]);

        // Create Platform Admin role
        $platformAdminRole = Role::create([
            'name' => 'Platform Admin',
            'guard_name' => 'landlord',
        ]);

        // Create Regular User role
        $regularRole = Role::create([
            'name' => 'Regular User',
            'guard_name' => 'landlord',
        ]);

        // Create users
        $this->superAdmin = LandlordUser::factory()->create();
        $this->superAdmin->assignRole($superAdminRole);

        $this->platformAdmin = LandlordUser::factory()->create();
        $this->platformAdmin->assignRole($platformAdminRole);

        $this->regularUser = LandlordUser::factory()->create();
        $this->regularUser->assignRole($regularRole);
    }

    // =========================================================================
    // INDEX / LIST TENANTS
    // =========================================================================

    public function testSuperAdminCanListTenants(): void
    {
        Tenant::factory()->count(5)->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index'));

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function testTenantListCanBeFiltered(): void
    {
        Tenant::factory()->active()->count(3)->create();
        Tenant::factory()->suspended()->count(2)->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index', ['status' => Tenant::STATUS_ACTIVE]));

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    public function testTenantListCanBeSearched(): void
    {
        Tenant::factory()->create(['name' => 'Acme Corporation']);
        Tenant::factory()->create(['name' => 'Globex Industries']);
        Tenant::factory()->create(['name' => 'Umbrella Corp']);

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index', ['search' => 'Acme']));

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Acme Corporation', $response->json('data.0.name'));
    }

    public function testTenantListCanIncludeArchived(): void
    {
        Tenant::factory()->active()->count(2)->create();
        Tenant::factory()->archived()->count(1)->create();

        // Without include_archived
        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index'));

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));

        // With include_archived
        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index', ['include_archived' => true]));

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    // =========================================================================
    // STATS
    // =========================================================================

    public function testSuperAdminCanViewStats(): void
    {
        Tenant::factory()->active()->count(5)->create();
        Tenant::factory()->suspended()->count(2)->create();
        Tenant::factory()->pending()->count(1)->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.stats'));

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'total',
                    'active',
                    'pending',
                    'suspended',
                    'archived',
                    'on_trial',
                ],
            ]);

        $this->assertEquals(8, $response->json('data.total'));
        $this->assertEquals(5, $response->json('data.active'));
        $this->assertEquals(2, $response->json('data.suspended'));
        $this->assertEquals(1, $response->json('data.pending'));
    }

    // =========================================================================
    // SHOW / VIEW TENANT
    // =========================================================================

    public function testSuperAdminCanViewTenant(): void
    {
        $tenant = Tenant::factory()->withPlan($this->plan)->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.show', $tenant));

        $response->assertOk()
            ->assertJsonPath('data.id', $tenant->id)
            ->assertJsonPath('data.name', $tenant->name);
    }

    public function testViewTenantReturns404ForNonExistent(): void
    {
        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.show', 'non-existent-uuid'));

        $response->assertNotFound();
    }

    // =========================================================================
    // STORE / CREATE TENANT
    // =========================================================================

    public function testSuperAdminCanCreateTenant(): void
    {
        // Mock the provisioner to prevent actual provisioning
        $this->mock(TenantProvisioner::class, function ($mock) {
            $mock->shouldReceive('dispatch')->once();
        });

        $tenantData = [
            'name' => 'New Test Company',
            'subdomain' => 'newtestcompany',
            'email' => 'contact@newtestcompany.com',
            'phone' => '+1234567890',
            'type' => 'business',
            'plan_id' => $this->plan->id,
            'admin_name' => 'John Admin',
            'admin_email' => 'admin@newtestcompany.com',
        ];

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.store'), $tenantData);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'New Test Company')
            ->assertJsonPath('data.subdomain', 'newtestcompany')
            ->assertJsonPath('data.status', Tenant::STATUS_PENDING);

        $this->assertDatabaseHas('tenants', [
            'name' => 'New Test Company',
            'subdomain' => 'newtestcompany',
        ]);
    }

    public function testCreateTenantValidatesRequiredFields(): void
    {
        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.store'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'subdomain', 'email', 'type', 'plan_id', 'admin_name', 'admin_email']);
    }

    public function testCreateTenantValidatesSubdomainUniqueness(): void
    {
        Tenant::factory()->create(['subdomain' => 'existing']);

        $tenantData = [
            'name' => 'New Company',
            'subdomain' => 'existing',
            'email' => 'new@company.com',
            'type' => 'business',
            'plan_id' => $this->plan->id,
            'admin_name' => 'Admin',
            'admin_email' => 'admin@company.com',
        ];

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.store'), $tenantData);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['subdomain']);
    }

    public function testCreateTenantValidatesSubdomainFormat(): void
    {
        $tenantData = [
            'name' => 'New Company',
            'subdomain' => 'invalid subdomain!',
            'email' => 'new@company.com',
            'type' => 'business',
            'plan_id' => $this->plan->id,
            'admin_name' => 'Admin',
            'admin_email' => 'admin@company.com',
        ];

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.store'), $tenantData);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['subdomain']);
    }

    // =========================================================================
    // UPDATE TENANT
    // =========================================================================

    public function testSuperAdminCanUpdateTenant(): void
    {
        $tenant = Tenant::factory()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->putJson(route('api.v1.tenants.update', $tenant), [
                'name' => 'Updated Company Name',
                'email' => 'updated@company.com',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Company Name')
            ->assertJsonPath('data.email', 'updated@company.com');

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'name' => 'Updated Company Name',
        ]);
    }

    public function testUpdateTenantValidatesEmail(): void
    {
        $tenant = Tenant::factory()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->putJson(route('api.v1.tenants.update', $tenant), [
                'email' => 'not-a-valid-email',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    // =========================================================================
    // SUSPEND TENANT
    // =========================================================================

    public function testSuperAdminCanSuspendActiveTenant(): void
    {
        $tenant = Tenant::factory()->active()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.suspend', $tenant), [
                'reason' => 'Payment overdue',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', Tenant::STATUS_SUSPENDED);

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'status' => Tenant::STATUS_SUSPENDED,
        ]);
    }

    public function testCannotSuspendAlreadySuspendedTenant(): void
    {
        $tenant = Tenant::factory()->suspended()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.suspend', $tenant));

        $response->assertForbidden();
    }

    // =========================================================================
    // ACTIVATE TENANT
    // =========================================================================

    public function testSuperAdminCanActivateSuspendedTenant(): void
    {
        $tenant = Tenant::factory()->suspended()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.activate', $tenant));

        $response->assertOk()
            ->assertJsonPath('data.status', Tenant::STATUS_ACTIVE);

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'status' => Tenant::STATUS_ACTIVE,
        ]);
    }

    public function testCannotActivateAlreadyActiveTenant(): void
    {
        $tenant = Tenant::factory()->active()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.activate', $tenant));

        $response->assertForbidden();
    }

    // =========================================================================
    // ARCHIVE / SOFT DELETE TENANT
    // =========================================================================

    public function testSuperAdminCanArchiveTenant(): void
    {
        $tenant = Tenant::factory()->active()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.archive', $tenant));

        $response->assertOk()
            ->assertJsonPath('message', 'Tenant archived successfully.');

        $this->assertSoftDeleted('tenants', ['id' => $tenant->id]);
    }

    // =========================================================================
    // RESTORE TENANT
    // =========================================================================

    public function testSuperAdminCanRestoreArchivedTenant(): void
    {
        $tenant = Tenant::factory()->archived()->create();

        // Mock retention service to allow restore
        $this->mock(TenantRetentionService::class, function ($mock) {
            $mock->shouldReceive('canRestore')->andReturn(true);
        });

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.restore', $tenant->id));

        $response->assertOk()
            ->assertJsonPath('data.status', Tenant::STATUS_ACTIVE)
            ->assertJsonPath('message', 'Tenant restored successfully.');

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'status' => Tenant::STATUS_ACTIVE,
            'deleted_at' => null,
        ]);
    }

    public function testCannotRestoreTenantAfterRetentionPeriod(): void
    {
        $tenant = Tenant::factory()->archived()->create();

        // Mock retention service to deny restore
        $this->mock(TenantRetentionService::class, function ($mock) {
            $mock->shouldReceive('canRestore')->andReturn(false);
        });

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.restore', $tenant->id));

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'Retention period expired. Tenant cannot be restored.');
    }

    // =========================================================================
    // DELETE / DESTROY TENANT (Soft Delete with Retention)
    // =========================================================================

    public function testSuperAdminCanSoftDeleteTenant(): void
    {
        $tenant = Tenant::factory()->create();

        // Mock retention service
        $this->mock(TenantRetentionService::class, function ($mock) {
            $mock->shouldReceive('getRetentionExpiresAt')
                ->andReturn(now()->addDays(30));
        });

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->deleteJson(route('api.v1.tenants.destroy', $tenant), [
                'reason' => 'Customer requested account deletion',
                'confirm' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Tenant archived successfully. Can be restored within retention period.');

        $this->assertSoftDeleted('tenants', ['id' => $tenant->id]);
    }

    public function testDestroyTenantRequiresReason(): void
    {
        $tenant = Tenant::factory()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->deleteJson(route('api.v1.tenants.destroy', $tenant), [
                'confirm' => true,
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['reason']);
    }

    public function testDestroyTenantRequiresConfirmation(): void
    {
        $tenant = Tenant::factory()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->deleteJson(route('api.v1.tenants.destroy', $tenant), [
                'reason' => 'Test deletion',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['confirm']);
    }

    // =========================================================================
    // RETRY PROVISIONING
    // =========================================================================

    public function testSuperAdminCanRetryProvisioningForFailedTenant(): void
    {
        $tenant = Tenant::factory()->failed()->create();

        // Mock provisioner
        $this->mock(TenantProvisioner::class, function ($mock) {
            $mock->shouldReceive('dispatch')->once();
        });

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.retry-provisioning', $tenant));

        $response->assertOk()
            ->assertJsonPath('data.status', Tenant::STATUS_PROVISIONING)
            ->assertJsonPath('message', 'Provisioning retry started.');
    }

    public function testCannotRetryProvisioningForNonFailedTenant(): void
    {
        $tenant = Tenant::factory()->active()->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->postJson(route('api.v1.tenants.retry-provisioning', $tenant));

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'Only failed tenants can have their provisioning retried.');
    }

    // =========================================================================
    // AUTHORIZATION TESTS
    // =========================================================================

    public function testUnauthenticatedUserCannotAccessTenantEndpoints(): void
    {
        $tenant = Tenant::factory()->create();

        $this->getJson(route('api.v1.tenants.index'))->assertUnauthorized();
        $this->getJson(route('api.v1.tenants.show', $tenant))->assertUnauthorized();
        $this->postJson(route('api.v1.tenants.store'))->assertUnauthorized();
        $this->putJson(route('api.v1.tenants.update', $tenant))->assertUnauthorized();
        $this->deleteJson(route('api.v1.tenants.destroy', $tenant))->assertUnauthorized();
    }

    public function testPaginationWorksCorrectly(): void
    {
        Tenant::factory()->count(25)->create();

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index', ['per_page' => 10]));

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.last_page', 3);

        $this->assertCount(10, $response->json('data'));
    }

    public function testSortingWorksCorrectly(): void
    {
        Tenant::factory()->create(['name' => 'Alpha Company']);
        Tenant::factory()->create(['name' => 'Beta Corporation']);
        Tenant::factory()->create(['name' => 'Gamma Industries']);

        $response = $this->actingAs($this->superAdmin, 'landlord')
            ->getJson(route('api.v1.tenants.index', ['sort' => 'name', 'direction' => 'asc']));

        $response->assertOk();
        $this->assertEquals('Alpha Company', $response->json('data.0.name'));
        $this->assertEquals('Beta Corporation', $response->json('data.1.name'));
        $this->assertEquals('Gamma Industries', $response->json('data.2.name'));
    }
}
