<?php

namespace Aero\Cms\Tests\Feature\Api;

use Aero\Cms\Models\CmsBlockType;
use PHPUnit\Framework\Attributes\Test;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CmsBlockTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function can_list_all_block_types(): void
    {
        // Create some test block types
        $blockTypes = CmsBlockType::factory()->count(3)->create([
            'is_active' => true,
            'category' => 'advanced',
        ]);

        // Make request to API
        $response = $this->actingAs($this->user, 'landlord')
            ->getJson(route('api.block-types.index'));

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'data',
            'message',
        ]);
        
        $this->assertTrue($response->json('success'));
        $this->assertIsArray($response->json('data'));
    }

    #[Test]
    public function can_get_advanced_block_types_only(): void
    {
        // Create block types with different categories
        CmsBlockType::factory()->create(['category' => 'advanced', 'is_active' => true]);
        CmsBlockType::factory()->create(['category' => 'basic', 'is_active' => true]);

        $response = $this->actingAs($this->user, 'landlord')
            ->getJson(route('api.block-types.advanced'));

        $response->assertOk();
        $this->assertTrue($response->json('success'));
    }

    #[Test]
    public function can_get_single_block_type_by_slug(): void
    {
        // Create a block type
        $blockType = CmsBlockType::factory()->create([
            'slug' => 'testimonial',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'landlord')
            ->getJson(route('api.block-types.show', 'testimonial'));

        $response->assertOk();
        $response->assertJsonPath('data.slug', 'testimonial');
    }

    #[Test]
    public function returns_404_for_non_existent_block_type(): void
    {
        $response = $this->actingAs($this->user, 'landlord')
            ->getJson(route('api.block-types.show', 'non-existent'));

        $response->assertNotFound();
    }

    #[Test]
    public function can_get_block_type_schema(): void
    {
        $blockType = CmsBlockType::factory()->create([
            'slug' => 'pricing-table',
            'schema_data' => [
                'fields' => [
                    ['name' => 'title', 'type' => 'text'],
                    ['name' => 'tiers', 'type' => 'array'],
                ],
            ],
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user, 'landlord')
            ->getJson(route('api.block-types.schema', 'pricing-table'));

        $response->assertOk();
        $response->assertJsonPath('data.schema.fields', $blockType->schema_data['fields']);
    }

    #[Test]
    public function can_create_new_block_type(): void
    {
        $this->actingAs($this->adminUser, 'landlord');

        $response = $this->postJson(route('api.block-types.store'), [
            'name' => 'Custom Block',
            'slug' => 'custom-block',
            'description' => 'A custom block type',
            'category' => 'advanced',
            'icon' => 'StarIcon',
        ]);

        $this->assertDatabaseHas('cms_block_types', [
            'name' => 'Custom Block',
            'slug' => 'custom-block',
        ]);
    }

    #[Test]
    public function validates_required_fields_on_create(): void
    {
        $this->actingAs($this->adminUser, 'landlord');

        $response = $this->postJson(route('api.block-types.store'), [
            'name' => 'Custom Block',
            // Missing required slug and category
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);
    }

    #[Test]
    public function only_inactive_block_types_are_excluded_from_list(): void
    {
        CmsBlockType::factory()->create(['is_active' => true]);
        CmsBlockType::factory()->create(['is_active' => false]);

        $response = $this->actingAs($this->user, 'landlord')
            ->getJson(route('api.block-types.index'));

        $response->assertOk();
        // The inactive one should not be in response
    }

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create authenticated users for tests
        $this->user = \App\Models\User::factory()->create();
        $this->adminUser = \App\Models\User::factory()->create([
            'is_admin' => true,
        ]);
    }
}
