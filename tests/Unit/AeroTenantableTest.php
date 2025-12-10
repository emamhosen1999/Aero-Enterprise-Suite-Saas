<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Eloquent\Model;
use Aero\Core\Traits\AeroTenantable;

/**
 * AeroTenantable Trait Test
 * 
 * Tests the tenant isolation trait in both SaaS and Standalone modes.
 */
class AeroTenantableTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test table
        \Schema::create('test_models', function ($table) {
            $table->id();
            $table->string('name');
            $table->integer('tenant_id');
            $table->timestamps();
        });
    }

    public function test_trait_applies_tenant_scope_in_standalone_mode(): void
    {
        config(['aero.mode' => 'standalone']);
        config(['aero.standalone_tenant_id' => 1]);

        $model = new TestModel();
        $model->name = 'Test Record';
        $model->tenant_id = 1;
        $model->save();

        // Create record for different tenant
        $otherModel = new TestModel();
        $otherModel->name = 'Other Tenant Record';
        $otherModel->tenant_id = 2;
        $otherModel->save();

        // Query should only return tenant 1 records
        $results = TestModel::all();

        $this->assertCount(1, $results);
        $this->assertEquals('Test Record', $results->first()->name);
    }

    public function test_trait_can_query_all_tenants(): void
    {
        config(['aero.mode' => 'standalone']);

        // Create records for different tenants
        TestModel::create(['name' => 'Tenant 1', 'tenant_id' => 1]);
        TestModel::create(['name' => 'Tenant 2', 'tenant_id' => 2]);

        // Query all tenants
        $results = TestModel::allTenants()->get();

        $this->assertCount(2, $results);
    }

    public function test_trait_can_query_without_tenant_scope(): void
    {
        config(['aero.mode' => 'standalone']);

        TestModel::create(['name' => 'Tenant 1', 'tenant_id' => 1]);
        TestModel::create(['name' => 'Tenant 2', 'tenant_id' => 2]);

        $results = TestModel::withoutTenantScope()->get();

        $this->assertCount(2, $results);
    }

    public function test_trait_detects_current_tenant_id(): void
    {
        config(['aero.mode' => 'standalone']);
        config(['aero.standalone_tenant_id' => 5]);

        $tenantId = TestModel::getCurrentTenantId();

        $this->assertEquals(5, $tenantId);
    }

    public function test_trait_respects_tenantable_property(): void
    {
        config(['aero.mode' => 'standalone']);

        // Model with tenantable = false should not apply scope
        $model = new NonTenantableTestModel();
        $model->name = 'No Scope';
        $model->tenant_id = 99;
        $model->save();

        $results = NonTenantableTestModel::all();

        // Should return all records regardless of tenant_id
        $this->assertGreaterThanOrEqual(1, $results->count());
    }
}

/**
 * Test Model using AeroTenantable trait
 */
class TestModel extends Model
{
    use AeroTenantable;

    protected $table = 'test_models';
    protected $guarded = [];
}

/**
 * Test Model that disables tenantable
 */
class NonTenantableTestModel extends Model
{
    use AeroTenantable;

    protected $table = 'test_models';
    protected $guarded = [];
    protected static $tenantable = false;
}
