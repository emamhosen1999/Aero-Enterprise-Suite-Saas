<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsPageBlock;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CmsPageBlockController extends Controller
{
    /**
     * Add a block to a page.
     */
    public function store(CmsPage $page, Request $request)
    {
        $this->authorize('update', $page);

        $validated = $request->validate([
            'type' => 'required|string|exists:cms_block_types,name',
            'data' => 'required|array',
            'order_index' => 'nullable|integer|min:0',
            'is_visible' => 'boolean|default:true',
        ]);

        $block = $page->blocks()->create([
            'type' => $validated['type'],
            'data' => $validated['data'],
            'is_visible' => $validated['is_visible'],
            'order_index' => $validated['order_index'] ?? ($page->blocks()->max('order_index') ?? -1) + 1,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Block added successfully',
            'block' => $block,
        ], 201);
    }

    /**
     * Update a block.
     */
    public function update(CmsPageBlock $block, Request $request)
    {
        $this->authorize('update', $block->page);

        $validated = $request->validate([
            'data' => 'array',
            'is_visible' => 'boolean',
            'conditions' => 'nullable|array',
            'variant' => 'nullable|string',
        ]);

        $validated['updated_by'] = auth()->id();
        $block->update($validated);

        return response()->json([
            'message' => 'Block updated successfully',
            'block' => $block,
        ]);
    }

    /**
     * Reorder blocks.
     */
    public function reorder(CmsPage $page, Request $request)
    {
        $this->authorize('update', $page);

        $order = $request->validate(['order' => 'required|array'])['order'];

        foreach ($order as $index => $blockId) {
            CmsPageBlock::where('id', $blockId)
                ->where('page_id', $page->id)
                ->update(['order_index' => $index]);
        }

        return response()->json(['message' => 'Blocks reordered successfully']);
    }

    /**
     * Delete a block.
     */
    public function destroy(CmsPageBlock $block)
    {
        $this->authorize('update', $block->page);

        $block->delete();

        return response()->json(['message' => 'Block deleted successfully']);
    }

    /**
     * Duplicate a block.
     */
    public function duplicate(CmsPageBlock $block)
    {
        $this->authorize('update', $block->page);

        $newBlock = $block->replicate();
        $newBlock->order_index = ($block->page->blocks()->max('order_index') ?? -1) + 1;
        $newBlock->created_by = auth()->id();
        $newBlock->save();

        return response()->json([
            'message' => 'Block duplicated successfully',
            'block' => $newBlock,
        ]);
    }
}
