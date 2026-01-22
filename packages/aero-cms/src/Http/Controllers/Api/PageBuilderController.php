<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Api;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Services\BlockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class PageBuilderController extends Controller
{
    public function __construct(
        protected BlockService $blockService
    ) {}

    /**
     * Autosave page content.
     */
    public function autosave(Request $request, CmsPage $page): JsonResponse
    {
        $validated = $request->validate([
            'blocks' => 'required|array',
            'blocks.*.type' => 'required|string',
            'blocks.*.data' => 'required|array',
            'blocks.*.order' => 'required|integer',
        ]);

        // Update page blocks
        $page->blocks()->delete();

        foreach ($validated['blocks'] as $index => $blockData) {
            $page->blocks()->create([
                'type' => $blockData['type'],
                'data' => $blockData['data'],
                'order' => $blockData['order'] ?? $index,
            ]);
        }

        $page->touch();

        return response()->json([
            'success' => true,
            'message' => 'Page autosaved successfully',
            'saved_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Upload inline image for the page builder.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => 'required|image|max:5120', // 5MB max
        ]);

        $file = $request->file('image');
        $path = $file->store('cms/inline', 'public');

        return response()->json([
            'success' => true,
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
        ]);
    }

    /**
     * Get default data for a block type.
     */
    public function blockDefaults(string $type): JsonResponse
    {
        $defaults = $this->blockService->getBlockDefaults($type);

        if ($defaults === null) {
            return response()->json([
                'success' => false,
                'message' => "Block type '{$type}' not found",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'type' => $type,
            'defaults' => $defaults,
        ]);
    }

    /**
     * Validate block content.
     */
    public function validateBlock(Request $request, string $type): JsonResponse
    {
        $data = $request->input('data', []);
        $errors = $this->blockService->validateBlockData($type, $data);

        return response()->json([
            'success' => empty($errors),
            'errors' => $errors,
        ]);
    }
}
