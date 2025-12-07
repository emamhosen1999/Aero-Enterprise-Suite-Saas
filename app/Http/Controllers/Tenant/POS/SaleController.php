<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function index()
    {
        return Inertia::render('POS/Sales/Index', [
            'sales' => Sale::with(['user', 'customer'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('POS/Sales/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'sale_date' => 'required|date',
            'total_amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,bank_transfer,credit',
            'payment_status' => 'required|string|in:paid,pending,partial,canceled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        // Process sale creation with related sale items
        // ...implementation logic here

        return redirect()->route('pos.sales.index')->with('status', 'Sale created successfully');
    }

    public function show(Sale $sale)
    {
        return Inertia::render('POS/Sales/Show', [
            'sale' => $sale->load(['customer', 'items.product', 'user']),
        ]);
    }

    public function edit(Sale $sale)
    {
        return Inertia::render('POS/Sales/Edit', [
            'sale' => $sale->load(['customer', 'items.product']),
        ]);
    }

    public function update(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'sale_date' => 'required|date',
            'total_amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string|in:cash,card,bank_transfer,credit',
            'payment_status' => 'required|string|in:paid,pending,partial,canceled',
            'notes' => 'nullable|string',
        ]);

        $sale->update($validated);

        return redirect()->route('pos.sales.index')->with('status', 'Sale updated successfully');
    }

    public function destroy(Sale $sale)
    {
        $sale->delete();

        return redirect()->route('pos.sales.index')->with('status', 'Sale deleted successfully');
    }
}
