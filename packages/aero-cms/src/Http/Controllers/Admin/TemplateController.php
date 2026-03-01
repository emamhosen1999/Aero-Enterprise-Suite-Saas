<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Models\CmsBlockTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

/**
 * Controller for managing CMS block templates.
 *
 * Block templates are reusable pre-configured blocks that can be
 * saved and inserted into any page.
 */
class TemplateController extends Controller
{
    /**
     * List all block templates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CmsBlockTemplate::query();

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        // Filter by block type
        if ($request->filled('block_type')) {
            $query->where('block_type', $request->input('block_type'));
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
        }

        // Sort
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        // Paginate
        $perPage = $request->input('per_page', 20);
        $templates = $query->paginate($perPage);

        return response()->json([
            'templates' => $templates->items(),
            'pagination' => [
                'total' => $templates->total(),
                'per_page' => $templates->perPage(),
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
            ],
        ]);
    }

    /**
     * Store a new block template.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'block_type' => 'required|string|max:100',
            'category' => 'nullable|string|max:100',
            'content' => 'required|array',
            'settings' => 'nullable|array',
            'thumbnail' => 'nullable|string|max:500',
            'is_global' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $template = CmsBlockTemplate::create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'block_type' => $request->input('block_type'),
            'category' => $request->input('category', 'custom'),
            'content' => $request->input('content'),
            'settings' => $request->input('settings', []),
            'thumbnail' => $request->input('thumbnail'),
            'is_global' => $request->input('is_global', true),
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Template created successfully',
            'template' => $template,
        ], 201);
    }

    /**
     * Update a block template.
     */
    public function update(Request $request, CmsBlockTemplate $template): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            'content' => 'sometimes|required|array',
            'settings' => 'nullable|array',
            'thumbnail' => 'nullable|string|max:500',
            'is_global' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $template->update($request->only([
            'name',
            'description',
            'category',
            'content',
            'settings',
            'thumbnail',
            'is_global',
        ]));

        return response()->json([
            'message' => 'Template updated successfully',
            'template' => $template->fresh(),
        ]);
    }

    /**
     * Delete a block template.
     */
    public function destroy(CmsBlockTemplate $template): JsonResponse
    {
        $template->delete();

        return response()->json([
            'message' => 'Template deleted successfully',
        ]);
    }
}
