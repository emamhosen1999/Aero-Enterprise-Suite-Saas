<?php

namespace App\Http\Controllers\IMS;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryItemController extends Controller
{
    public function index()
    {
        return Inertia::render('IMS/Items/Index', [
            'inventoryItems' => InventoryItem::with(['category', 'unit'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('IMS/Items/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:inventory_items,sku',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:inventory_categories,id',
            'unit_id' => 'required|exists:inventory_units,id',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'current_stock' => 'required|numeric|min:0',
            'barcode' => 'nullable|string|max:100',
            'status' => 'required|string|in:active,inactive',
            'location_id' => 'required|exists:inventory_locations,id',
            'is_serialized' => 'boolean',
            'tax_rate' => 'nullable|numeric|min:0',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'attributes' => 'nullable|array',
        ]);

        $item = InventoryItem::create($validated);

        if ($request->current_stock > 0) {
            // Create initial stock entry
            // Implementation here
        }

        return redirect()->route('ims.items.index')->with('status', 'Inventory item created successfully');
    }

    public function show(InventoryItem $item)
    {
        return Inertia::render('IMS/Items/Show', [
            'item' => $item->load([
                'category',
                'unit',
                'manufacturer',
                'stockMovements' => function ($query) {
                    $query->latest()->limit(10);
                },
            ]),
        ]);
    }

    public function edit(InventoryItem $item)
    {
        return Inertia::render('IMS/Items/Edit', [
            'item' => $item->load(['category', 'unit', 'manufacturer']),
        ]);
    }

    public function update(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:inventory_items,sku,'.$item->id,
            'description' => 'nullable|string',
            'category_id' => 'required|exists:inventory_categories,id',
            'unit_id' => 'required|exists:inventory_units,id',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'reorder_level' => 'required|numeric|min:0',
            'barcode' => 'nullable|string|max:100',
            'status' => 'required|string|in:active,inactive',
            'location_id' => 'required|exists:inventory_locations,id',
            'is_serialized' => 'boolean',
            'tax_rate' => 'nullable|numeric|min:0',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'attributes' => 'nullable|array',
        ]);

        $item->update($validated);

        return redirect()->route('ims.items.index')->with('status', 'Inventory item updated successfully');
    }

    public function destroy(InventoryItem $item)
    {
        $item->delete();

        return redirect()->route('ims.items.index')->with('status', 'Inventory item deleted successfully');
    }
}
