<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Models\CmsMenu;
use Aero\Cms\Models\CmsMenuItem;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CmsMenuController extends Controller
{
    public function index()
    {
        $menus = CmsMenu::with('allItems')->get();
        return response()->json($menus);
    }

    public function show(CmsMenu $menu)
    {
        $menu->load('items.children');
        return response()->json($menu);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'slug' => 'required|string|unique:cms_menus',
            'location' => 'nullable|string',
        ]);

        $menu = CmsMenu::create($validated);

        return response()->json([
            'message' => 'Menu created',
            'menu' => $menu,
        ], 201);
    }

    public function update(CmsMenu $menu, Request $request)
    {
        $validated = $request->validate([
            'name' => 'string',
            'location' => 'nullable|string',
        ]);

        $menu->update($validated);

        return response()->json([
            'message' => 'Menu updated',
            'menu' => $menu,
        ]);
    }

    public function destroy(CmsMenu $menu)
    {
        $menu->delete();
        return response()->json(['message' => 'Menu deleted']);
    }
}

class CmsMenuItemController extends Controller
{
    public function store(CmsMenu $menu, Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string',
            'url' => 'nullable|string',
            'page_id' => 'nullable|exists:cms_pages,id',
            'parent_id' => 'nullable|exists:cms_menu_items,id',
            'icon' => 'nullable|string',
            'order' => 'integer|default:0',
            'is_visible' => 'boolean|default:true',
        ]);

        $item = $menu->items()->create([...$validated, 'menu_id' => $menu->id]);

        return response()->json([
            'message' => 'Menu item created',
            'item' => $item,
        ], 201);
    }

    public function update(CmsMenuItem $item, Request $request)
    {
        $validated = $request->validate([
            'label' => 'string',
            'url' => 'nullable|string',
            'icon' => 'nullable|string',
            'order' => 'integer',
            'is_visible' => 'boolean',
        ]);

        $item->update($validated);

        return response()->json(['message' => 'Menu item updated', 'item' => $item]);
    }

    public function destroy(CmsMenuItem $item)
    {
        $item->delete();
        return response()->json(['message' => 'Menu item deleted']);
    }
}
