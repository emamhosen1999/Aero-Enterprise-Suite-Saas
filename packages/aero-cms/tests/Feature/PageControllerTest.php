<?php

namespace Aero\Cms\Tests\Feature;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PageControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run CMS migrations
        $this->artisan('migrate', [
            '--path' => 'packages/aero-cms/database/migrations',
            '--realpath' => true,
        ]);
    }

    /** @test */
    public function it_can_list_all_pages()
    {
        $this->actingAsAuthenticatedUser();

        CmsPage::factory()->count(5)->create();

        $response = $this->get(route('cms.admin.pages.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Cms/Pages/Index')
                ->has('pages.data', 5)
        );
    }

    /** @test */
    public function it_can_show_create_page_form()
    {
        $this->actingAsAuthenticatedUser();

        $response = $this->get(route('cms.admin.pages.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Cms/Pages/Create')
                ->has('blockTypes')
        );
    }

    /** @test */
    public function it_can_create_a_new_page()
    {
        $this->actingAsAuthenticatedUser();

        $pageData = [
            'title' => 'Test Page',
            'slug' => 'test-page',
            'description' => 'A test page description',
            'status' => 'draft',
            'meta_title' => 'Test Meta Title',
            'meta_description' => 'Test meta description',
        ];

        $response = $this->post(route('cms.admin.pages.store'), $pageData);

        $response->assertRedirect();
        $this->assertDatabaseHas('cms_pages', [
            'title' => 'Test Page',
            'slug' => 'test-page',
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_page()
    {
        $this->actingAsAuthenticatedUser();

        $response = $this->post(route('cms.admin.pages.store'), []);

        $response->assertSessionHasErrors(['title']);
    }

    /** @test */
    public function it_generates_unique_slug()
    {
        $this->actingAsAuthenticatedUser();

        CmsPage::factory()->create(['slug' => 'test-page']);

        $response = $this->post(route('cms.admin.pages.store'), [
            'title' => 'Test Page',
            'slug' => 'test-page',
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    /** @test */
    public function it_can_show_edit_page_form()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();

        $response = $this->get(route('cms.admin.pages.edit', $page));

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => 
            $assert->component('Cms/Pages/Edit')
                ->has('page')
                ->has('blockTypes')
        );
    }

    /** @test */
    public function it_can_update_a_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();

        $updateData = [
            'title' => 'Updated Title',
            'slug' => $page->slug,
            'description' => 'Updated description',
        ];

        $response = $this->put(route('cms.admin.pages.update', $page), $updateData);

        $response->assertRedirect();
        $this->assertDatabaseHas('cms_pages', [
            'id' => $page->id,
            'title' => 'Updated Title',
        ]);
    }

    /** @test */
    public function it_can_delete_a_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create();

        $response = $this->delete(route('cms.admin.pages.destroy', $page));

        $response->assertRedirect();
        $this->assertDatabaseMissing('cms_pages', ['id' => $page->id]);
    }

    /** @test */
    public function it_deletes_associated_blocks_when_deleting_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()
            ->has(CmsPageBlock::factory()->count(3), 'blocks')
            ->create();

        $blockIds = $page->blocks->pluck('id')->toArray();

        $this->delete(route('cms.admin.pages.destroy', $page));

        foreach ($blockIds as $blockId) {
            $this->assertDatabaseMissing('cms_page_blocks', ['id' => $blockId]);
        }
    }

    /** @test */
    public function it_can_publish_a_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create(['status' => 'draft']);

        $response = $this->post(route('cms.admin.pages.publish', $page));

        $response->assertRedirect();
        $this->assertDatabaseHas('cms_pages', [
            'id' => $page->id,
            'status' => 'published',
        ]);
    }

    /** @test */
    public function it_can_unpublish_a_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()->create(['status' => 'published']);

        $response = $this->post(route('cms.admin.pages.unpublish', $page));

        $response->assertRedirect();
        $this->assertDatabaseHas('cms_pages', [
            'id' => $page->id,
            'status' => 'draft',
        ]);
    }

    /** @test */
    public function it_can_duplicate_a_page()
    {
        $this->actingAsAuthenticatedUser();

        $page = CmsPage::factory()
            ->has(CmsPageBlock::factory()->count(2), 'blocks')
            ->create(['title' => 'Original Page']);

        $response = $this->post(route('cms.admin.pages.duplicate', $page));

        $response->assertRedirect();
        
        $duplicatedPage = CmsPage::where('title', 'like', 'Original Page (Copy%')->first();
        $this->assertNotNull($duplicatedPage);
        $this->assertCount(2, $duplicatedPage->blocks);
    }

    /** @test */
    public function it_paginates_page_list()
    {
        $this->actingAsAuthenticatedUser();

        CmsPage::factory()->count(50)->create();

        $response = $this->get(route('cms.admin.pages.index', ['perPage' => 10]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('pages.data', 10)
                ->has('pages.links')
        );
    }

    /** @test */
    public function it_filters_pages_by_status()
    {
        $this->actingAsAuthenticatedUser();

        CmsPage::factory()->count(3)->create(['status' => 'published']);
        CmsPage::factory()->count(2)->create(['status' => 'draft']);

        $response = $this->get(route('cms.admin.pages.index', ['status' => 'published']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('pages.data', 3)
        );
    }

    /** @test */
    public function it_searches_pages_by_title()
    {
        $this->actingAsAuthenticatedUser();

        CmsPage::factory()->create(['title' => 'Home Page']);
        CmsPage::factory()->create(['title' => 'About Us']);
        CmsPage::factory()->create(['title' => 'Contact']);

        $response = $this->get(route('cms.admin.pages.index', ['search' => 'Home']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('pages.data', 1)
        );
    }

    /**
     * Helper to authenticate a user for tests.
     */
    protected function actingAsAuthenticatedUser()
    {
        // Create and authenticate a user with CMS permissions
        $user = \App\Models\User::factory()->create();
        
        // If using Spatie permissions, assign the role/permission
        // $user->givePermissionTo('cms.pages.list.index', 'cms.pages.editor.create', ...);
        
        $this->actingAs($user);
        
        return $user;
    }
}
