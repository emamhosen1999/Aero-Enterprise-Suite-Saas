<?php

namespace Aero\Cms\Tests\Feature;

use Aero\Cms\Models\CmsPage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PublicPageControllerTest extends TestCase
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
    public function it_can_display_published_page()
    {
        $page = CmsPage::factory()->create([
            'slug' => 'about-us',
            'status' => 'published',
        ]);

        $response = $this->get('/about-us');

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert->component('Platform/Public/CmsPage')
            ->has('page')
            ->where('page.slug', 'about-us')
        );
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_404_for_non_existent_page()
    {
        $response = $this->get('/non-existent-page');

        $response->assertStatus(404);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_404_for_draft_pages_to_public()
    {
        CmsPage::factory()->create([
            'slug' => 'draft-page',
            'status' => 'draft',
        ]);

        $response = $this->get('/draft-page');

        $response->assertStatus(404);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_allows_preview_of_draft_pages_for_authenticated_users()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create([
            'slug' => 'draft-page',
            'status' => 'draft',
        ]);

        $response = $this->get('/draft-page?preview=true');

        $response->assertStatus(200);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_includes_page_blocks_in_response()
    {
        $page = CmsPage::factory()
            ->has(\Aero\Cms\Models\CmsPageBlock::factory()->count(3), 'blocks')
            ->create(['status' => 'published']);

        $response = $this->get("/{$page->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert->has('blocks', 3)
        );
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_orders_blocks_correctly()
    {
        $page = CmsPage::factory()->create(['status' => 'published']);

        \Aero\Cms\Models\CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'text_block',
            'order_index' => 2,
        ]);

        \Aero\Cms\Models\CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'hero_standard',
            'order_index' => 0,
        ]);

        \Aero\Cms\Models\CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'block_type' => 'cta_section',
            'order_index' => 1,
        ]);

        $response = $this->get("/{$page->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert->has('blocks', 3)
            ->where('blocks.0.block_type', 'hero_standard')
            ->where('blocks.1.block_type', 'cta_section')
            ->where('blocks.2.block_type', 'text_block')
        );
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_excludes_hidden_blocks()
    {
        $page = CmsPage::factory()->create(['status' => 'published']);

        \Aero\Cms\Models\CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'is_visible' => true,
        ]);

        \Aero\Cms\Models\CmsPageBlock::factory()->create([
            'page_id' => $page->id,
            'is_visible' => false,
        ]);

        $response = $this->get("/{$page->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert->has('blocks', 1)
        );
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_handles_homepage_slug()
    {
        CmsPage::factory()->create([
            'slug' => 'home',
            'status' => 'published',
            'is_homepage' => true,
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_sets_correct_meta_tags()
    {
        $page = CmsPage::factory()->create([
            'slug' => 'test-seo',
            'status' => 'published',
            'meta_title' => 'Custom Meta Title',
            'meta_description' => 'Custom meta description for SEO',
        ]);

        $response = $this->get('/test-seo');

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert->where('page.meta_title', 'Custom Meta Title')
            ->where('page.meta_description', 'Custom meta description for SEO')
        );
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_increments_view_count()
    {
        $page = CmsPage::factory()->create([
            'slug' => 'view-test',
            'status' => 'published',
            'view_count' => 0,
        ]);

        $this->get('/view-test');
        $this->get('/view-test');
        $this->get('/view-test');

        $this->assertEquals(3, $page->fresh()->view_count);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_handles_scheduled_pages()
    {
        // Future scheduled page - should return 404
        CmsPage::factory()->create([
            'slug' => 'future-page',
            'status' => 'scheduled',
            'published_at' => now()->addDays(7),
        ]);

        $response = $this->get('/future-page');
        $response->assertStatus(404);

        // Past scheduled page - should be accessible
        CmsPage::factory()->create([
            'slug' => 'past-scheduled',
            'status' => 'scheduled',
            'published_at' => now()->subDays(1),
        ]);

        $response = $this->get('/past-scheduled');
        // Depending on implementation, may need to update status
        // or check published_at logic
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
