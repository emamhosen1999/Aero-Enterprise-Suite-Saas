<?php

namespace Aero\Cms\Tests\Feature;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class BlockControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('migrate', [
            '--path' => 'packages/aero-cms/database/migrations',
            '--realpath' => true,
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_list_block_types()
    {
        $this->actingAsAuthenticatedUser();

        $response = $this->get(route('cms.api.blocks.types'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'categories',
            'blocks' => [
                '*' => ['type', 'label', 'description', 'category', 'icon', 'schema', 'defaults'],
            ],
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_add_block_to_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();

        $response = $this->post(route('cms.api.pages.blocks.store', $page), [
            'block_type' => 'hero_standard',
            'content' => [
                'title' => 'Hero Title',
                'subtitle' => 'Hero Subtitle',
            ],
            'order' => 0,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cms_page_blocks', [
            'page_id' => $page->id,
            'block_type' => 'hero_standard',
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_validates_block_type()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();

        $response = $this->postJson(route('cms.api.pages.blocks.store', $page), [
            'block_type' => 'invalid_block_type',
            'content' => [],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['block_type']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_update_block_content()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'text_block',
            'content' => ['text' => 'Original text'],
        ]);

        $response = $this->put(route('cms.api.blocks.update', $block), [
            'content' => ['text' => 'Updated text'],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cms_page_blocks', [
            'id' => $block->id,
        ]);

        $updatedBlock = CmsPageBlock::find($block->id);
        $this->assertEquals('Updated text', $updatedBlock->content['text']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_delete_block()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();
        $block = CmsPageBlock::factory()->create(['page_id' => $page->id]);

        $response = $this->delete(route('cms.api.blocks.destroy', $block));

        $response->assertStatus(200);
        $this->assertDatabaseMissing('cms_page_blocks', ['id' => $block->id]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_reorder_blocks()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();

        $block1 = CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 0]);
        $block2 = CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 1]);
        $block3 = CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 2]);

        $response = $this->post(route('cms.api.pages.blocks.reorder', $page), [
            'blocks' => [
                ['id' => $block3->id, 'order' => 0],
                ['id' => $block1->id, 'order' => 1],
                ['id' => $block2->id, 'order' => 2],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertEquals(0, $block3->fresh()->order);
        $this->assertEquals(1, $block1->fresh()->order);
        $this->assertEquals(2, $block2->fresh()->order);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_duplicate_block()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'feature_grid',
            'content' => ['title' => 'Features'],
        ]);

        $response = $this->post(route('cms.api.blocks.duplicate', $block));

        $response->assertStatus(201);
        $this->assertCount(2, $page->fresh()->blocks);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_toggle_block_visibility()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'is_visible' => true,
        ]);

        $response = $this->patch(route('cms.api.blocks.visibility', $block), [
            'is_visible' => false,
        ]);

        $response->assertStatus(200);
        $this->assertFalse($block->fresh()->is_visible);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_get_block_schema()
    {
        $this->actingAsAuthenticatedUser();

        $response = $this->get(route('cms.api.blocks.schema', ['type' => 'hero_standard']));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'type',
            'label',
            'description',
            'schema' => [
                'properties',
            ],
            'defaults',
        ]);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_404_for_invalid_block_schema()
    {
        $this->actingAsAuthenticatedUser();

        $response = $this->get(route('cms.api.blocks.schema', ['type' => 'non_existent_block']));

        $response->assertStatus(404);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_bulk_update_blocks()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();
        $blocks = CmsPageBlock::factory()->count(3)->create(['page_id' => $page->id]);

        $updateData = $blocks->map(fn ($block, $index) => [
            'id' => $block->id,
            'content' => ['title' => "Updated Title {$index}"],
            'order' => 2 - $index, // Reverse order
        ])->toArray();

        $response = $this->put(route('cms.api.pages.blocks.bulk-update', $page), [
            'blocks' => $updateData,
        ]);

        $response->assertStatus(200);

        foreach ($blocks as $index => $block) {
            $fresh = $block->fresh();
            $this->assertEquals("Updated Title {$index}", $fresh->content['title']);
            $this->assertEquals(2 - $index, $fresh->order);
        }
    }

    /**
     * Helper to authenticate a user for tests.
     */
    protected function actingAsAuthenticatedUser()
    {
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        return $user;
    }
}
