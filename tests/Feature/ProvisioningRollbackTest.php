<?php

namespace Tests\Feature;

use Aero\Platform\Jobs\ProvisionTenant;
use Aero\Platform\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProvisioningRollbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure we're using the testing database
        config(['database.default' => 'mysql']);
    }

    /**
     * Test that failed provisioning performs complete rollback.
     */
    public function test_failed_provisioning_deletes_all_resources(): void
    {
        // Arrange: Create a tenant
        $tenant = Tenant::factory()->create([
            'name' => 'Test Company',
            'email' => 'test@example.com',
            'subdomain' => 'testcompany',
            'status' => Tenant::STATUS_PENDING,
        ]);

        // Create a domain for the tenant
        $tenant->domains()->create([
            'domain' => 'testcompany.eos365.test',
            'tenant_id' => $tenant->id,
        ]);

        $tenantId = $tenant->id;

        // Verify tenant and domain exist
        $this->assertDatabaseHas('tenants', ['id' => $tenantId]);
        $this->assertDatabaseHas('domains', ['tenant_id' => $tenantId]);

        // Act: Simulate job failure by calling failed() method directly
        $job = new ProvisionTenant($tenant);
        $exception = new \Exception('Simulated provisioning failure');
        $job->failed($exception);

        // Assert: Tenant record should be deleted
        $this->assertDatabaseMissing('tenants', ['id' => $tenantId]);

        // Assert: Domain records should be deleted
        $this->assertDatabaseMissing('domains', ['tenant_id' => $tenantId]);
    }

    /**
     * Test that user can re-register after failed provisioning.
     */
    public function test_user_can_reregister_after_failed_provisioning(): void
    {
        // Arrange: Create and fail a tenant
        $firstTenant = Tenant::factory()->create([
            'name' => 'Test Company',
            'email' => 'test@example.com',
            'subdomain' => 'testcompany',
            'status' => Tenant::STATUS_PENDING,
        ]);

        $firstTenant->domains()->create([
            'domain' => 'testcompany.eos365.test',
            'tenant_id' => $firstTenant->id,
        ]);

        $firstTenantId = $firstTenant->id;

        // Simulate failure - this should delete the tenant
        $job = new ProvisionTenant($firstTenant);
        $job->failed(new \Exception('Test failure'));

        // Verify first tenant was deleted
        $this->assertDatabaseMissing('tenants', ['id' => $firstTenantId]);

        // Act: Attempt to create new tenant with same subdomain and email using factory
        $secondTenant = Tenant::factory()->create([
            'name' => 'Test Company',
            'email' => 'test@example.com',
            'subdomain' => 'testcompany',
            'status' => Tenant::STATUS_PENDING,
        ]);

        // Assert: New tenant should be created successfully without unique constraint violations
        $this->assertDatabaseHas('tenants', [
            'id' => $secondTenant->id,
            'subdomain' => 'testcompany',
            'email' => 'test@example.com',
        ]);

        // Assert: IDs should be different
        $this->assertNotEquals($firstTenantId, $secondTenant->id);

        // Cleanup
        $secondTenant->forceDelete();
    }

    /**
     * Test that rollback handles non-existent database gracefully.
     */
    public function test_rollback_handles_nonexistent_database_gracefully(): void
    {
        // Arrange: Create tenant without actually creating database
        $tenant = Tenant::factory()->create([
            'name' => 'Test Company',
            'email' => 'test@example.com',
            'subdomain' => 'testcompany',
            'status' => Tenant::STATUS_PENDING,
        ]);

        $tenantId = $tenant->id;

        // Act & Assert: Trigger rollback even though database was never created
        // Should not throw exception
        $job = new ProvisionTenant($tenant);
        $job->failed(new \Exception('Early failure before database creation'));

        // Tenant should still be deleted
        $this->assertDatabaseMissing('tenants', ['id' => $tenantId]);
    }
}
