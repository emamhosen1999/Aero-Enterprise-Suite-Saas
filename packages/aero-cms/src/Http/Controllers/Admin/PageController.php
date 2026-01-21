<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Blocks\BlockRegistry;
use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Aero\Cms\Models\CmsPageVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        protected BlockRegistry $blockRegistry
    ) {}

    /**
     * Display a listing of pages.
     */
    public function index(Request $request): Response
    {
        $query = CmsPage::query()
            ->withCount('blocks')
            ->with('creator:id,name')
            ->orderBy('updated_at', 'desc');

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $pages = $query->paginate($request->input('per_page', 20));

        return Inertia::render('Platform/Admin/Cms/Pages/Index', [
            'title' => 'CMS Pages',
            'pages' => $pages,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total' => CmsPage::count(),
                'published' => CmsPage::where('status', 'published')->count(),
                'draft' => CmsPage::where('status', 'draft')->count(),
                'scheduled' => CmsPage::where('status', 'scheduled')->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(): Response
    {
        return Inertia::render('Platform/Admin/Cms/Pages/Create', [
            'title' => 'Create Page',
            'layouts' => $this->getAvailableLayouts(),
            'parentPages' => CmsPage::whereNull('parent_id')
                ->orderBy('title')
                ->get(['id', 'title', 'slug']),
        ]);
    }

    /**
     * Store a newly created page.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:cms_pages,slug',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'layout' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:cms_pages,id',
            'show_in_nav' => 'boolean',
            'nav_label' => 'nullable|string|max:100',
        ]);

        $validated['created_by'] = Auth::guard('landlord')->id();
        $validated['updated_by'] = Auth::guard('landlord')->id();

        $page = CmsPage::create($validated);

        return redirect()
            ->route('admin.cms.pages.edit', $page)
            ->with('success', 'Page created successfully. Add blocks to build your page.');
    }

    /**
     * Show the page builder editor.
     */
    public function edit(CmsPage $page): Response
    {
        $page->load(['blocks' => function ($query) {
            $query->orderBy('order_index');
        }]);

        return Inertia::render('Platform/Admin/Cms/Pages/Edit', [
            'title' => "Edit: {$page->title}",
            'page' => $page,
            'blocks' => $page->blocks->map(fn ($block) => [
                'id' => $block->id,
                'block_type' => $block->block_type,
                'content' => $block->content,
                'settings' => $block->settings,
                'order_index' => $block->order_index,
            ]),
            'blockTypes' => array_values($this->blockRegistry->toArray()),
            'blockCategories' => config('cms-blocks.categories', []),
            'layouts' => $this->getAvailableLayouts(),
        ]);
    }

    /**
     * Update the page.
     */
    public function update(Request $request, CmsPage $page): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:cms_pages,slug,' . $page->id,
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:500',
            'og_image' => 'nullable|string|max:500',
            'layout' => 'nullable|string|max:50',
            'settings' => 'nullable|array',
            'parent_id' => 'nullable|exists:cms_pages,id',
            'show_in_nav' => 'boolean',
            'nav_label' => 'nullable|string|max:100',
            'is_homepage' => 'boolean',
            'blocks' => 'nullable|array',
            'blocks.*.id' => 'nullable|integer',
            'blocks.*.block_type' => 'required|string',
            'blocks.*.content' => 'required|array',
            'blocks.*.settings' => 'nullable|array',
            'blocks.*.order_index' => 'required|integer',
        ]);

        DB::transaction(function () use ($page, $validated) {
            // Create version before updating
            $this->createVersion($page);

            // Update page metadata
            $pageData = collect($validated)->except('blocks')->toArray();
            $pageData['updated_by'] = Auth::guard('landlord')->id();
            $page->update($pageData);

            // Update blocks if provided
            if (isset($validated['blocks'])) {
                $this->syncBlocks($page, $validated['blocks']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Page saved successfully.',
            'page' => $page->fresh(['blocks']),
        ]);
    }

    /**
     * Delete the page.
     */
    public function destroy(CmsPage $page): RedirectResponse
    {
        $page->delete();

        return redirect()
            ->route('admin.cms.pages.index')
            ->with('success', 'Page deleted successfully.');
    }

    /**
     * Duplicate a page.
     */
    public function duplicate(CmsPage $page): RedirectResponse
    {
        $newPage = DB::transaction(function () use ($page) {
            $newPage = $page->replicate();
            $newPage->title = $page->title . ' (Copy)';
            $newPage->slug = null; // Let the model generate a unique slug
            $newPage->status = 'draft';
            $newPage->published_at = null;
            $newPage->is_homepage = false;
            $newPage->created_by = Auth::guard('landlord')->id();
            $newPage->updated_by = Auth::guard('landlord')->id();
            $newPage->save();

            // Duplicate blocks
            foreach ($page->blocks as $block) {
                $newBlock = $block->replicate();
                $newBlock->page_id = $newPage->id;
                $newBlock->save();
            }

            return $newPage;
        });

        return redirect()
            ->route('admin.cms.pages.edit', $newPage)
            ->with('success', 'Page duplicated successfully.');
    }

    /**
     * Publish a page.
     */
    public function publish(CmsPage $page): JsonResponse
    {
        $page->update([
            'status' => 'published',
            'published_at' => now(),
            'updated_by' => Auth::guard('landlord')->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Page published successfully.',
            'page' => $page,
        ]);
    }

    /**
     * Unpublish a page.
     */
    public function unpublish(CmsPage $page): JsonResponse
    {
        $page->update([
            'status' => 'draft',
            'updated_by' => Auth::guard('landlord')->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Page unpublished.',
            'page' => $page,
        ]);
    }

    /**
     * Get page versions.
     */
    public function versions(CmsPage $page): Response
    {
        $versions = CmsPageVersion::where('page_id', $page->id)
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Platform/Admin/Cms/Pages/Versions', [
            'title' => "Versions: {$page->title}",
            'page' => $page,
            'versions' => $versions,
        ]);
    }

    /**
     * Show a specific version.
     */
    public function showVersion(CmsPage $page, CmsPageVersion $version): JsonResponse
    {
        return response()->json([
            'version' => $version,
            'content' => $version->content,
        ]);
    }

    /**
     * Restore a page version.
     */
    public function restoreVersion(CmsPage $page, CmsPageVersion $version): JsonResponse
    {
        DB::transaction(function () use ($page, $version) {
            // Create version of current state first
            $this->createVersion($page, 'Before restore');

            // Restore blocks from version
            $page->blocks()->delete();

            foreach ($version->content['blocks'] ?? [] as $blockData) {
                CmsPageBlock::create([
                    'page_id' => $page->id,
                    'block_type' => $blockData['block_type'],
                    'content' => $blockData['content'],
                    'settings' => $blockData['settings'] ?? [],
                    'order_index' => $blockData['order_index'],
                ]);
            }

            // Restore page metadata
            $page->update([
                'title' => $version->content['title'] ?? $page->title,
                'meta_title' => $version->content['meta_title'] ?? $page->meta_title,
                'meta_description' => $version->content['meta_description'] ?? $page->meta_description,
                'settings' => $version->content['settings'] ?? $page->settings,
                'updated_by' => Auth::guard('landlord')->id(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Version restored successfully.',
        ]);
    }

    /**
     * Preview a page.
     */
    public function preview(CmsPage $page): Response
    {
        $page->load(['blocks' => function ($query) {
            $query->orderBy('order_index');
        }]);

        return Inertia::render('Platform/Public/CmsPage', [
            'title' => $page->meta_title ?: $page->title,
            'page' => $page,
            'blocks' => $page->blocks,
            'isPreview' => true,
        ]);
    }

    /**
     * Sync blocks for a page.
     */
    protected function syncBlocks(CmsPage $page, array $blocks): void
    {
        $existingIds = $page->blocks->pluck('id')->toArray();
        $incomingIds = collect($blocks)->pluck('id')->filter()->toArray();

        // Delete removed blocks
        $toDelete = array_diff($existingIds, $incomingIds);
        CmsPageBlock::whereIn('id', $toDelete)->delete();

        // Update or create blocks
        foreach ($blocks as $index => $blockData) {
            $data = [
                'page_id' => $page->id,
                'block_type' => $blockData['block_type'],
                'content' => $blockData['content'],
                'settings' => $blockData['settings'] ?? [],
                'order_index' => $blockData['order_index'] ?? $index,
            ];

            if (!empty($blockData['id'])) {
                CmsPageBlock::where('id', $blockData['id'])->update($data);
            } else {
                CmsPageBlock::create($data);
            }
        }
    }

    /**
     * Create a version snapshot.
     */
    protected function createVersion(CmsPage $page, ?string $note = null): void
    {
        CmsPageVersion::create([
            'page_id' => $page->id,
            'version_number' => CmsPageVersion::where('page_id', $page->id)->max('version_number') + 1,
            'content' => [
                'title' => $page->title,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'settings' => $page->settings,
                'blocks' => $page->blocks->map(fn ($block) => [
                    'block_type' => $block->block_type,
                    'content' => $block->content,
                    'settings' => $block->settings,
                    'order_index' => $block->order_index,
                ])->toArray(),
            ],
            'note' => $note,
            'created_by' => Auth::guard('landlord')->id(),
        ]);
    }

    /**
     * Get available layouts.
     */
    protected function getAvailableLayouts(): array
    {
        return [
            ['value' => 'public', 'label' => 'Public (with header/footer)'],
            ['value' => 'full-width', 'label' => 'Full Width (no container)'],
            ['value' => 'landing', 'label' => 'Landing Page'],
            ['value' => 'minimal', 'label' => 'Minimal (no navigation)'],
        ];
    }
}
