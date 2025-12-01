<?php

namespace Tests\Feature;

use App\Jobs\ProvisionTenant;
use App\Models\Tenant;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Tests for the ProvisionTenant job.
 *
 * Note: Full integration tests that actually create databases require
 * a proper test environment with database server access. These unit tests
 * verify the job structure, serialization, and dispatch behavior.
 */
class ProvisionTenantJobTest extends TestCase
{
    /**
     * Test the job can be instantiated with a tenant.
     */
    public function test_job_accepts_tenant_instance(): void
    {
        $tenant = Tenant::factory()->pending()->make();
        $adminData = [
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => 'password123',
        ];

        $job = new ProvisionTenant($tenant, $adminData);

        $this->assertInstanceOf(ProvisionTenant::class, $job);
        $this->assertSame($tenant, $job->tenant);
    }

    /**
     * Test the job has correct retry configuration.
     */
    public function test_job_has_retry_configuration(): void
    {
        $tenant = Tenant::factory()->pending()->make();
        $job = new ProvisionTenant($tenant);

        $this->assertEquals(3, $job->tries);
        $this->assertEquals([30, 60, 120], $job->backoff);
        $this->assertEquals(1, $job->maxExceptions);
    }

    /**
     * Test the job can be dispatched to queue.
     */
    public function test_job_can_be_dispatched_to_queue(): void
    {
        Queue::fake();

        $tenant = Tenant::factory()->pending()->make();
        $adminData = [
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => 'password123',
        ];

        ProvisionTenant::dispatch($tenant, $adminData);

        Queue::assertPushed(ProvisionTenant::class, function ($job) use ($tenant) {
            return $job->tenant->id === $tenant->id;
        });
    }

    /**
     * Test the job can be serialized for queue.
     */
    public function test_job_can_be_serialized(): void
    {
        $tenant = Tenant::factory()->pending()->make([
            'id' => 'test-tenant-123',
        ]);
        $adminData = [
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => 'password123',
        ];

        $job = new ProvisionTenant($tenant, $adminData);

        // Job should be serializable (required for queue)
        $serialized = serialize($job);
        $this->assertIsString($serialized);
    }

    /**
     * Test tenant status constants are properly defined.
     */
    public function test_tenant_has_provisioning_status_constants(): void
    {
        $this->assertEquals('pending', Tenant::STATUS_PENDING);
        $this->assertEquals('provisioning', Tenant::STATUS_PROVISIONING);
        $this->assertEquals('active', Tenant::STATUS_ACTIVE);
        $this->assertEquals('failed', Tenant::STATUS_FAILED);
    }

    /**
     * Test tenant has provisioning step constants.
     */
    public function test_tenant_has_provisioning_step_constants(): void
    {
        $this->assertEquals('creating_db', Tenant::STEP_CREATING_DB);
        $this->assertEquals('migrating', Tenant::STEP_MIGRATING);
        $this->assertEquals('seeding', Tenant::STEP_SEEDING);
        $this->assertEquals('creating_admin', Tenant::STEP_CREATING_ADMIN);
    }

    /**
     * Test tenant factory can create provisioning state.
     */
    public function test_tenant_factory_provisioning_state(): void
    {
        $tenant = Tenant::factory()->provisioning()->make();

        $this->assertEquals(Tenant::STATUS_PROVISIONING, $tenant->status);
        $this->assertEquals(Tenant::STEP_CREATING_DB, $tenant->provisioning_step);
    }

    /**
     * Test tenant factory can create with admin data.
     */
    public function test_tenant_factory_with_admin_data(): void
    {
        $tenant = Tenant::factory()->withAdminData([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
        ])->make();

        $this->assertEquals('Test Admin', $tenant->admin_data['name']);
        $this->assertEquals('admin@test.com', $tenant->admin_data['email']);
    }

    /**
     * Test tenant isProvisioning helper method.
     */
    public function test_tenant_is_provisioning_method(): void
    {
        $pendingTenant = Tenant::factory()->pending()->make();
        $provisioningTenant = Tenant::factory()->provisioning()->make();

        $this->assertFalse($pendingTenant->isProvisioning());
        $this->assertTrue($provisioningTenant->isProvisioning());
    }

    /**
     * Test tenant hasFailed helper method.
     */
    public function test_tenant_has_failed_method(): void
    {
        $activeTenant = Tenant::factory()->make();
        $failedTenant = Tenant::factory()->failed()->make();

        $this->assertFalse($activeTenant->hasFailed());
        $this->assertTrue($failedTenant->hasFailed());
    }
}
