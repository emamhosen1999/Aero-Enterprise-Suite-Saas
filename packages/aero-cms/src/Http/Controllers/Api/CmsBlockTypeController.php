<?php

namespace Aero\Cms\Http\Controllers\Api;

use Aero\Cms\Models\CmsBlockType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CmsBlockTypeController
{
    /**
     * Get all active block types grouped by category.
     */
    public function index(): JsonResponse
    {
        try {
            $blockTypes = CmsBlockType::active()
                ->orderBy('category')
                ->orderBy('sort_order')
                ->get()
                ->map(fn($type) => $type->toBlockTypeArray())
                ->groupBy('category');

            return response()->json([
                'success' => true,
                'data' => $blockTypes,
                'message' => 'Block types retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve block types: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get advanced block types only.
     */
    public function advanced(): JsonResponse
    {
        try {
            $blockTypes = CmsBlockType::active()
                ->category('advanced')
                ->orderBy('sort_order')
                ->get()
                ->map(fn($type) => $type->toBlockTypeArray());

            return response()->json([
                'success' => true,
                'data' => $blockTypes,
                'message' => 'Advanced block types retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve block types: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single block type by slug.
     */
    public function show(string $slug): JsonResponse
    {
        try {
            $blockType = CmsBlockType::bySlug($slug)->first();

            if (!$blockType) {
                return response()->json([
                    'success' => false,
                    'message' => "Block type '{$slug}' not found",
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $blockType->toBlockTypeArray(),
                'message' => 'Block type retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve block type: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get block type schema for form generation.
     */
    public function schema(string $slug): JsonResponse
    {
        try {
            $blockType = CmsBlockType::bySlug($slug)->first();

            if (!$blockType) {
                return response()->json([
                    'success' => false,
                    'message' => "Block type '{$slug}' not found",
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'slug' => $blockType->slug,
                    'name' => $blockType->name,
                    'schema' => $blockType->getSchemaFields(),
                ],
                'message' => 'Block type schema retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve schema: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new block type (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:cms_block_types',
                'slug' => 'required|string|max:255|unique:cms_block_types',
                'description' => 'nullable|string',
                'schema_data' => 'nullable|json',
                'category' => 'required|string|in:basic,advanced,custom',
                'icon' => 'nullable|string',
                'preview_image' => 'nullable|string',
                'sort_order' => 'nullable|integer',
            ]);

            $blockType = CmsBlockType::create($validated);

            return response()->json([
                'success' => true,
                'data' => $blockType->toBlockTypeArray(),
                'message' => 'Block type created successfully',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create block type: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update block type (admin only).
     */
    public function update(Request $request, string $slug): JsonResponse
    {
        try {
            $blockType = CmsBlockType::bySlug($slug)->first();

            if (!$blockType) {
                return response()->json([
                    'success' => false,
                    'message' => "Block type '{$slug}' not found",
                ], 404);
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|unique:cms_block_types,name,' . $blockType->id,
                'description' => 'nullable|string',
                'schema_data' => 'nullable|json',
                'category' => 'sometimes|string|in:basic,advanced,custom',
                'icon' => 'nullable|string',
                'preview_image' => 'nullable|string',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
            ]);

            $blockType->update($validated);

            return response()->json([
                'success' => true,
                'data' => $blockType->toBlockTypeArray(),
                'message' => 'Block type updated successfully',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update block type: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete block type (admin only).
     */
    public function destroy(string $slug): JsonResponse
    {
        try {
            $blockType = CmsBlockType::bySlug($slug)->first();

            if (!$blockType) {
                return response()->json([
                    'success' => false,
                    'message' => "Block type '{$slug}' not found",
                ], 404);
            }

            $blockType->delete();

            return response()->json([
                'success' => true,
                'message' => 'Block type deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete block type: ' . $e->getMessage(),
            ], 500);
        }
    }
}
