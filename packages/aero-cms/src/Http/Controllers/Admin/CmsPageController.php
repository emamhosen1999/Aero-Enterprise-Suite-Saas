<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Models\CmsCategory;
use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Aero\Cms\Models\CmsTemplate;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class CmsPageController extends Controller
{
    /**
     * Show the CMS page builder UI.
     */
    public function index(Request $request)
    {
        $this->authorize('view', CmsPage::class);

        $pages = CmsPage::query()
            ->with(['category', 'template', 'blocks'])
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        $categories = CmsCategory::with('children')->whereNull('parent_id')->get();
        $templates = CmsTemplate::all();

        return Inertia::render('Admin/CMS/Pages/Index', [
            'pages' => $pages,
            'categories' => $categories,
            'templates' => $templates,
        ]);
    }

    /**
     * Show page editor.
     */
    public function show(CmsPage $page)
    {
        $this->authorize('view', $page);

        $page->load(['blocks' => fn ($q) => $q->orderBy('order_index')]);

        return Inertia::render('Admin/CMS/Pages/Editor', [
            'page' => $page,
            'blocks' => $page->blocks,
            'templates' => CmsTemplate::all(),
            'categories' => CmsCategory::all(),
        ]);
    }

    /**
     * Create a new page.
     */
    public function store(Request $request)
    {
        $this->authorize('create', CmsPage::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:cms_pages',
            'category_id' => 'nullable|exists:cms_categories,id',
            'template_id' => 'nullable|exists:cms_templates,id',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string',
            'status' => 'in:draft,published,archived',
            'language' => 'string|default:en',
        ]);

        $validated['created_by'] = auth()->id();

        $page = CmsPage::create($validated);

        return response()->json([
            'message' => 'Page created successfully',
            'page' => $page,
        ], 201);
    }

    /**
     * Update a page.
     */
    public function update(CmsPage $page, Request $request)
    {
        $this->authorize('update', $page);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|unique:cms_pages,slug,' . $page->id,
            'category_id' => 'nullable|exists:cms_categories,id',
            'template_id' => 'nullable|exists:cms_templates,id',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string',
            'status' => 'in:draft,published,archived',
            'show_in_nav' => 'boolean',
            'nav_label' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        $validated['updated_by'] = auth()->id();

        // Create version before updating
        $page->createVersion('Updated by ' . auth()->user()->name);

        $page->update($validated);

        return response()->json([
            'message' => 'Page updated successfully',
            'page' => $page,
        ]);
    }

    /**
     * Publish a page.
     */
    public function publish(CmsPage $page)
    {
        $this->authorize('update', $page);

        $page->publish();
        $page->createVersion('Published');

        return response()->json([
            'message' => 'Page published successfully',
        ]);
    }

    /**
     * Duplicate a page.
     */
    public function duplicate(CmsPage $page)
    {
        $this->authorize('create', CmsPage::class);

        $newPage = $page->replicate();
        $newPage->slug = $page->slug . '-copy';
        $newPage->status = 'draft';
        $newPage->created_by = auth()->id();
        $newPage->save();

        // Duplicate blocks
        foreach ($page->blocks as $block) {
            $newPage->blocks()->create($block->toArray());
        }

        return response()->json([
            'message' => 'Page duplicated successfully',
            'page' => $newPage,
        ]);
    }

    /**
     * Delete a page.
     */
    public function destroy(CmsPage $page)
    {
        $this->authorize('delete', $page);

        $page->delete();

        return response()->json([
            'message' => 'Page deleted successfully',
        ]);
    }

    /**
     * Bulk delete pages.
     */
    public function bulkDelete(Request $request)
    {
        $this->authorize('delete', CmsPage::class);

        $ids = $request->validate(['ids' => 'required|array|min:1'])['ids'];

        CmsPage::whereIn('id', $ids)->delete();

        return response()->json([
            'message' => 'Pages deleted successfully',
        ]);
    }
}
