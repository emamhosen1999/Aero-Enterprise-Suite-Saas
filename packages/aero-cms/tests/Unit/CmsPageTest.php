<?php

namespace Aero\Cms\Tests\Unit;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Aero\Cms\Models\CmsPageVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CmsPageTest extends TestCase
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
    public function it_can_create_a_page()
    {
        $page = CmsPage::create([
            'title' => 'Test Page',
            'slug' => 'test-page',
            'description' => 'A test page',
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('cms_pages', [
            'title' => 'Test Page',
            'slug' => 'test-page',
        ]);
    }

    /** @test */
    public function it_generates_slug_from_title()
    {
        $page = CmsPage::create([
            'title' => 'My Amazing Page Title',
            'status' => 'draft',
        ]);

        $this->assertEquals('my-amazing-page-title', $page->slug);
    }

    /** @test */
    public function it_has_many_blocks()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageBlock::factory()->count(3)->create([
            'page_id' => $page->id,
        ]);

        $this->assertCount(3, $page->blocks);
        $this->assertInstanceOf(CmsPageBlock::class, $page->blocks->first());
    }

    /** @test */
    public function it_has_many_versions()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageVersion::factory()->count(2)->create([
            'page_id' => $page->id,
        ]);

        $this->assertCount(2, $page->versions);
        $this->assertInstanceOf(CmsPageVersion::class, $page->versions->first());
    }

    /** @test */
    public function it_scopes_by_published_status()
    {
        CmsPage::factory()->count(3)->create(['status' => 'published']);
        CmsPage::factory()->count(2)->create(['status' => 'draft']);

        $publishedPages = CmsPage::published()->get();

        $this->assertCount(3, $publishedPages);
    }

    /** @test */
    public function it_scopes_by_draft_status()
    {
        CmsPage::factory()->count(2)->create(['status' => 'published']);
        CmsPage::factory()->count(4)->create(['status' => 'draft']);

        $draftPages = CmsPage::draft()->get();

        $this->assertCount(4, $draftPages);
    }

    /** @test */
    public function it_casts_meta_tags_to_array()
    {
        $page = CmsPage::factory()->create([
            'meta_tags' => ['og:title' => 'Test', 'og:image' => '/image.jpg'],
        ]);

        $this->assertIsArray($page->meta_tags);
        $this->assertEquals('Test', $page->meta_tags['og:title']);
    }

    /** @test */
    public function it_casts_settings_to_array()
    {
        $page = CmsPage::factory()->create([
            'settings' => ['show_header' => true, 'layout' => 'wide'],
        ]);

        $this->assertIsArray($page->settings);
        $this->assertTrue($page->settings['show_header']);
    }

    /** @test */
    public function it_orders_blocks_by_order_column()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 2]);
        CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 0]);
        CmsPageBlock::factory()->create(['page_id' => $page->id, 'order' => 1]);

        $blocks = $page->blocks()->orderBy('order')->get();

        $this->assertEquals(0, $blocks[0]->order);
        $this->assertEquals(1, $blocks[1]->order);
        $this->assertEquals(2, $blocks[2]->order);
    }

    /** @test */
    public function it_can_check_if_published()
    {
        $publishedPage = CmsPage::factory()->create(['status' => 'published']);
        $draftPage = CmsPage::factory()->create(['status' => 'draft']);

        $this->assertTrue($publishedPage->isPublished());
        $this->assertFalse($draftPage->isPublished());
    }

    /** @test */
    public function it_can_get_visible_blocks()
    {
        $page = CmsPage::factory()->create();
        
        CmsPageBlock::factory()->count(2)->create([
            'page_id' => $page->id,
            'is_visible' => true,
        ]);
        
        CmsPageBlock::factory()->count(1)->create([
            'page_id' => $page->id,
            'is_visible' => false,
        ]);

        $visibleBlocks = $page->blocks()->visible()->get();

        $this->assertCount(2, $visibleBlocks);
    }

    /** @test */
    public function it_returns_full_url()
    {
        $page = CmsPage::factory()->create(['slug' => 'about-us']);

        $this->assertStringContainsString('/about-us', $page->url);
    }

    /** @test */
    public function it_returns_edit_url()
    {
        $page = CmsPage::factory()->create();

        $this->assertStringContainsString((string) $page->id, $page->editUrl);
    }
}
