<?php

namespace AeroHRM\Tests\Unit\Models;

use AeroHRM\Models\Asset;
use AeroHRM\Models\AssetCategory;
use AeroHRM\Models\AssetAllocation;
use AeroHRM\Models\Employee;
use AeroHRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AssetModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_has_correct_status_workflow_states()
    {
        $validStatuses = ['available', 'allocated', 'maintenance', 'retired', 'lost'];

        foreach ($validStatuses as $status) {
            $asset = Asset::factory()->create(['status' => $status]);
            $this->assertEquals($status, $asset->status);
        }
    }

    /** @test */
    public function it_auto_generates_unique_asset_tag_on_creation()
    {
        $asset1 = Asset::factory()->create();
        $asset2 = Asset::factory()->create();

        $this->assertNotEquals($asset1->asset_tag, $asset2->asset_tag);
        $this->assertStringStartsWith('AST' . date('Y'), $asset1->asset_tag);
        $this->assertStringStartsWith('AST' . date('Y'), $asset2->asset_tag);
    }

    /** @test */
    public function it_belongs_to_category_and_has_allocations()
    {
        $category = AssetCategory::factory()->create();
        $asset = Asset::factory()->create([
            'asset_category_id' => $category->id,
        ]);
        $employee = Employee::factory()->create();
        
        $allocation = AssetAllocation::factory()->create([
            'asset_id' => $asset->id,
            'employee_id' => $employee->id,
        ]);

        $this->assertInstanceOf(AssetCategory::class, $asset->category);
        $this->assertEquals($category->id, $asset->category->id);
        $this->assertCount(1, $asset->allocations);
        $this->assertInstanceOf(AssetAllocation::class, $asset->allocations->first());
    }

    /** @test */
    public function it_can_check_if_asset_can_be_allocated()
    {
        $availableAsset = Asset::factory()->create(['status' => 'available']);
        $allocatedAsset = Asset::factory()->allocated()->create();
        $maintenanceAsset = Asset::factory()->maintenance()->create();

        $this->assertTrue($availableAsset->canBeAllocated());
        $this->assertFalse($allocatedAsset->canBeAllocated());
        $this->assertFalse($maintenanceAsset->canBeAllocated());
    }

    /** @test */
    public function it_can_check_if_asset_is_allocated()
    {
        $availableAsset = Asset::factory()->create(['status' => 'available']);
        $allocatedAsset = Asset::factory()->allocated()->create();

        $this->assertFalse($availableAsset->isAllocated());
        $this->assertTrue($allocatedAsset->isAllocated());
    }

    /** @test */
    public function it_tracks_current_allocation()
    {
        $asset = Asset::factory()->create();
        $employee = Employee::factory()->create();

        $currentAllocation = AssetAllocation::factory()->active()->create([
            'asset_id' => $asset->id,
            'employee_id' => $employee->id,
        ]);

        $asset->update(['status' => 'allocated']);

        $activeAllocation = $asset->allocations()
            ->where('status', 'active')
            ->first();

        $this->assertNotNull($activeAllocation);
        $this->assertEquals($currentAllocation->id, $activeAllocation->id);
        $this->assertEquals($employee->id, $activeAllocation->employee_id);
    }

    /** @test */
    public function it_soft_deletes_correctly()
    {
        $asset = Asset::factory()->create();
        $assetId = $asset->id;

        $asset->delete();

        $this->assertSoftDeleted('assets', ['id' => $assetId]);
        $this->assertNotNull($asset->fresh()->deleted_at);
    }
}
