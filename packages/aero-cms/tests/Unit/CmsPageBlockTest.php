<?php

namespace Aero\Cms\Tests\Unit;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CmsPageBlockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->artisan('migrate', [
            '--path' => 'packages/aero-cms/database/migrations',
            '--realpath' => true,
        ]);
    }

    /** @test */
    public function it_can_create_a_block()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::create([
            'page_id' => $page->id,
            'block_type' => 'hero_standard',
            'content' => ['title' => 'Hello World'],
            'order' => 0,
        ]);

        $this->assertDatabaseHas('cms_page_blocks', [
            'page_id' => $page->id,
            'block_type' => 'hero_standard',
        ]);
    }

    /** @test */
    public function it_belongs_to_a_page()
    {
        $page = CmsPage::factory()->create();
        $block = CmsPageBlock::factory()->create(['page_id' => $page->id]);

        $this->assertInstanceOf(CmsPage::class, $block->page);
        $this->assertEquals($page->id, $block->page->id);
    }

    /** @test */
    public function it_casts_content_to_array()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::create([
            'page_id' => $page->id,
            'block_type' => 'feature_grid',
            'content' => [
                'title' => 'Features',
                'features' => [
                    ['icon' => 'star', 'title' => 'Feature 1'],
                    ['icon' => 'heart', 'title' => 'Feature 2'],
                ],
            ],
        ]);

        $this->assertIsArray($block->content);
        $this->assertEquals('Features', $block->content['title']);
        $this->assertCount(2, $block->content['features']);
    }

    /** @test */
    public function it_casts_settings_to_array()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'settings' => [
                'background' => 'dark',
                'padding' => 'large',
            ],
        ]);

        $this->assertIsArray($block->settings);
        $this->assertEquals('dark', $block->settings['background']);
    }

    /** @test */
    public function it_defaults_to_visible()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::create([
            'page_id' => $page->id,
            'block_type' => 'text_block',
            'content' => ['text' => 'Some text'],
        ]);

        $this->assertTrue($block->is_visible);
    }

    /** @test */
    public function it_scopes_by_visibility()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageBlock::factory()->count(3)->create([
            'page_id' => $page->id,
            'is_visible' => true,
        ]);
        
        CmsPageBlock::factory()->count(2)->create([
            'page_id' => $page->id,
            'is_visible' => false,
        ]);

        $visibleBlocks = CmsPageBlock::visible()->get();
        $hiddenBlocks = CmsPageBlock::hidden()->get();

        $this->assertCount(3, $visibleBlocks);
        $this->assertCount(2, $hiddenBlocks);
    }

    /** @test */
    public function it_scopes_by_block_type()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageBlock::factory()->count(2)->create([
            'page_id' => $page->id,
            'block_type' => 'hero_standard',
        ]);
        
        CmsPageBlock::factory()->count(3)->create([
            'page_id' => $page->id,
            'block_type' => 'text_block',
        ]);

        $heroBlocks = CmsPageBlock::ofType('hero_standard')->get();
        $textBlocks = CmsPageBlock::ofType('text_block')->get();

        $this->assertCount(2, $heroBlocks);
        $this->assertCount(3, $textBlocks);
    }

    /** @test */
    public function it_orders_by_order_column()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 2]);
        CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 0]);
        CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 1]);

        $orderedBlocks = CmsPageBlock::orderBy('order')->get();

        $this->assertEquals(0, $orderedBlocks[0]->order);
        $this->assertEquals(1, $orderedBlocks[1]->order);
        $this->assertEquals(2, $orderedBlocks[2]->order);
    }

    /** @test */
    public function it_can_duplicate_block()
    {
        $page = CmsPage::factory()->create();
        
        $original = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'pricing_cards',
            'content' => ['plans' => [['name' => 'Basic', 'price' => 9]]],
            'order' => 0,
        ]);

        $duplicate = $original->duplicate();

        $this->assertNotEquals($original->id, $duplicate->id);
        $this->assertEquals($original->block_type, $duplicate->block_type);
        $this->assertEquals($original->content, $duplicate->content);
        $this->assertEquals($original->order + 1, $duplicate->order);
    }

    /** @test */
    public function it_gets_content_attribute_with_default()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'hero_standard',
            'content' => ['title' => 'Hello'],
        ]);

        $this->assertEquals('Hello', $block->getContentValue('title'));
        $this->assertNull($block->getContentValue('nonexistent'));
        $this->assertEquals('default', $block->getContentValue('nonexistent', 'default'));
    }

    /** @test */
    public function it_sets_content_attribute()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'content' => ['title' => 'Original'],
        ]);

        $block->setContentValue('title', 'Updated');
        $block->setContentValue('newKey', 'New Value');
        $block->save();

        $freshBlock = $block->fresh();
        $this->assertEquals('Updated', $freshBlock->content['title']);
        $this->assertEquals('New Value', $freshBlock->content['newKey']);
    }

    /** @test */
    public function it_can_merge_content()
    {
        $page = CmsPage::factory()->create();
        
        $block = CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'content' => ['title' => 'Original', 'description' => 'Keep this'],
        ]);

        $block->mergeContent(['title' => 'Updated', 'newField' => 'Added']);
        $block->save();

        $freshBlock = $block->fresh();
        $this->assertEquals('Updated', $freshBlock->content['title']);
        $this->assertEquals('Keep this', $freshBlock->content['description']);
        $this->assertEquals('Added', $freshBlock->content['newField']);
    }
}
