<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Blocks\BlockRegistry;
use Aero\Cms\Models\CmsBlockTemplate;
use Aero\Cms\Models\CmsPageBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class BlockController extends Controller
{
    public function __construct(
        protected BlockRegistry $blockRegistry
    ) {}

    /**
     * Get available block types.
     */
    public function types(): JsonResponse
    {
        return response()->json([
            'blocks' => $this->blockRegistry->toArray(),
            'categories' => $this->blockRegistry->categories()->map(fn ($cat) => [
                'key' => $cat,
                'label' => ucfirst(str_replace('-', ' ', $cat)),
                'blocks' => $this->blockRegistry->byCategory($cat)->keys()->toArray(),
            ])->values()->toArray(),
        ]);
    }

    /**
     * Get a specific block schema.
     */
    public function schema(string $type): JsonResponse
    {
        $schema = $this->blockRegistry->get($type);

        if (! $schema) {
            return response()->json(['error' => 'Block type not found'], 404);
        }

        return response()->json($schema->toArray());
    }

    /**
     * Get default content for a block type.
     */
    public function defaults(string $type): JsonResponse
    {
        try {
            $defaults = $this->blockRegistry->getDefaults($type);

            return response()->json(['content' => $defaults]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    /**
     * Validate block content.
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'block_type' => 'required|string',
            'content' => 'required|array',
        ]);

        try {
            $errors = $this->blockRegistry->validateContent(
                $validated['block_type'],
                $validated['content']
            );

            return response()->json([
                'valid' => empty($errors),
                'errors' => $errors,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    /**
     * Reorder blocks.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'blocks' => 'required|array',
            'blocks.*.id' => 'required|integer|exists:cms_page_blocks,id',
            'blocks.*.order_index' => 'required|integer|min:0',
        ]);

        foreach ($validated['blocks'] as $blockData) {
            CmsPageBlock::where('id', $blockData['id'])
                ->update(['order_index' => $blockData['order_index']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Blocks reordered successfully.',
        ]);
    }

    /**
     * Duplicate a block.
     */
    public function duplicate(CmsPageBlock $block): JsonResponse
    {
        $newBlock = $block->replicate();

        // Insert after original block
        $maxOrder = CmsPageBlock::where('page_id', $block->page_id)->max('order_index');
        $newBlock->order_index = $maxOrder + 1;
        $newBlock->save();

        return response()->json([
            'success' => true,
            'block' => $newBlock,
            'message' => 'Block duplicated successfully.',
        ]);
    }

    /**
     * Delete a block.
     */
    public function destroy(CmsPageBlock $block): JsonResponse
    {
        $block->delete();

        return response()->json([
            'success' => true,
            'message' => 'Block deleted successfully.',
        ]);
    }

    /**
     * Save block as template.
     */
    public function saveAsTemplate(Request $request, CmsPageBlock $block): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_global' => 'boolean',
        ]);

        $template = CmsBlockTemplate::create([
            'name' => $validated['name'],
            'block_type' => $block->block_type,
            'content' => $block->content,
            'settings' => $block->settings,
            'is_global' => $validated['is_global'] ?? false,
            'created_by' => Auth::guard('landlord')->id(),
        ]);

        return response()->json([
            'success' => true,
            'template' => $template,
            'message' => 'Block saved as template.',
        ]);
    }

    /**
     * Get block templates.
     */
    public function templates(Request $request): JsonResponse
    {
        $query = CmsBlockTemplate::query();

        if ($type = $request->input('block_type')) {
            $query->where('block_type', $type);
        }

        if ($category = $request->input('category')) {
            $schema = $this->blockRegistry->byCategory($category);
            $query->whereIn('block_type', $schema->keys());
        }

        $templates = $query->orderBy('name')->get();

        return response()->json([
            'templates' => $templates,
        ]);
    }

    /**
     * Create block from template.
     */
    public function createFromTemplate(Request $request, CmsBlockTemplate $template): JsonResponse
    {
        $validated = $request->validate([
            'page_id' => 'required|exists:cms_pages,id',
            'order_index' => 'nullable|integer',
        ]);

        $maxOrder = CmsPageBlock::where('page_id', $validated['page_id'])->max('order_index') ?? -1;

        $block = CmsPageBlock::create([
            'page_id' => $validated['page_id'],
            'block_type' => $template->block_type,
            'content' => $template->content,
            'settings' => $template->settings,
            'order_index' => $validated['order_index'] ?? $maxOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'block' => $block,
            'message' => 'Block created from template.',
        ]);
    }
}
