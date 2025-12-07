<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        return Inertia::render('Procurement/PurchaseOrders/Index', [
            'purchaseOrders' => PurchaseOrder::with(['supplier', 'approver', 'creator'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Procurement/PurchaseOrders/Create', [
            'suppliers' => Supplier::where('status', 'active')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'total_amount' => 'required|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:draft,pending,approved,rejected,completed,cancelled',
            'payment_terms' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'total_amount' => $validated['total_amount'],
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'status' => $validated['status'],
                'payment_terms' => $validated['payment_terms'],
                'delivery_terms' => $validated['delivery_terms'],
                'notes' => $validated['notes'],
                'created_by' => auth()->id(),
            ]);

            foreach ($request->items as $item) {
                $purchaseOrder->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                ]);
            }
        });

        return redirect()->route('procurement.purchase-orders.index')->with('status', 'Purchase order created successfully');
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return Inertia::render('Procurement/PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder->load(['supplier', 'items.product', 'approver', 'creator']),
        ]);
    }

    public function edit(PurchaseOrder $purchaseOrder)
    {
        return Inertia::render('Procurement/PurchaseOrders/Edit', [
            'purchaseOrder' => $purchaseOrder->load(['supplier', 'items.product']),
            'suppliers' => Supplier::where('status', 'active')->get(),
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'total_amount' => 'required|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:draft,pending,approved,rejected,completed,cancelled',
            'payment_terms' => 'nullable|string',
            'delivery_terms' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $purchaseOrder->update($validated);

        return redirect()->route('procurement.purchase-orders.index')->with('status', 'Purchase order updated successfully');
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status === 'completed') {
            return redirect()->route('procurement.purchase-orders.index')->with('error', 'Completed purchase orders cannot be deleted');
        }

        $purchaseOrder->delete();

        return redirect()->route('procurement.purchase-orders.index')->with('status', 'Purchase order deleted successfully');
    }

    public function approve(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'pending') {
            return redirect()->route('procurement.purchase-orders.index')->with('error', 'Only pending purchase orders can be approved');
        }

        $purchaseOrder->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->route('procurement.purchase-orders.index')->with('status', 'Purchase order approved successfully');
    }
}
