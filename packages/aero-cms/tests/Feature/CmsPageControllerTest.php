<?php

namespace Tests\Feature\Cms;

use App\Models\User;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CmsPageControllerTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_cms_pages()
    {
        // Create test pages
        for ($i = 0; $i < 5; $i++) {
            CmsPage::factory()->create();
        }

        $response = $this->actingAs($this->user)
            ->get(route('admin.cms.pages.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page->component('Platform/Admin/Cms/Pages/Index')
            ->has('pages.data', 5)
        );
    }

    public function test_can_create_cms_page()
    {
        $data = [
            'title' => 'Test Page',
            'slug' => 'test-page',
            'meta_title' => 'Test Page | Site',
            'meta_description' => 'Test page description',
            'layout' => 'default',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('admin.cms.pages.store'), $data);

        $this->assertDatabaseHas('cms_pages', [
            'title' => 'Test Page',
            'slug' => 'test-page',
        ]);
    }

    public function test_can_update_cms_page()
    {
        $page = CmsPage::factory()->create();

        $data = [
            'title' => 'Updated Title',
            'blocks' => [],
        ];

        $response = $this->actingAs($this->user)
            ->put(route('admin.cms.pages.update', $page), $data);

        $this->assertDatabaseHas('cms_pages', [
            'id' => $page->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_can_delete_cms_page()
    {
        $page = CmsPage::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('admin.cms.pages.destroy', $page));

        $this->assertSoftDeleted('cms_pages', ['id' => $page->id]);
    }

    public function test_can_duplicate_cms_page()
    {
        $page = CmsPage::factory()
            ->has(CmsPageBlock::factory()->count(3))
            ->create();

        $response = $this->actingAs($this->user)
            ->post(route('admin.cms.pages.duplicate', $page));

        $this->assertEquals(2, CmsPage::where('slug', 'like', $page->slug.'%')->count());
    }

    public function test_can_publish_cms_page()
    {
        $page = CmsPage::factory()->create(['status' => 'draft']);

        $response = $this->actingAs($this->user)
            ->post(route('admin.cms.pages.publish', $page));

        $this->assertDatabaseHas('cms_pages', [
            'id' => $page->id,
            'status' => 'published',
        ]);
    }

    public function test_creates_version_on_page_update()
    {
        $page = CmsPage::factory()->create();

        $this->actingAs($this->user)
            ->put(route('admin.cms.pages.update', $page), [
                'title' => 'New Title',
                'blocks' => [],
            ]);

        $this->assertDatabaseHas('cms_page_versions', [
            'cms_page_id' => $page->id,
        ]);
    }

    public function test_can_restore_page_version()
    {
        $page = CmsPage::factory()->create();
        $originalTitle = $page->title;

        // Create a version
        $this->actingAs($this->user)
            ->put(route('admin.cms.pages.update', $page), [
                'title' => 'Updated Title',
                'blocks' => [],
            ]);

        $version = $page->versions()->latest()->first();

        // Restore version
        $response = $this->actingAs($this->user)
            ->post(route('admin.cms.pages.restoreVersion', [$page, $version]));

        $page->refresh();
        $this->assertEquals($originalTitle, $page->title);
    }

    public function test_can_add_blocks_to_page()
    {
        $page = CmsPage::factory()->create();

        $this->actingAs($this->user)
            ->put(route('admin.cms.pages.update', $page), [
                'blocks' => [
                    [
                        'id' => 1,
                        'block_type' => 'hero_standard',
                        'content' => ['title' => 'Welcome'],
                        'settings' => [],
                        'order_index' => 0,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('cms_page_blocks', [
            'cms_page_id' => $page->id,
            'block_type' => 'hero_standard',
        ]);
    }
}
