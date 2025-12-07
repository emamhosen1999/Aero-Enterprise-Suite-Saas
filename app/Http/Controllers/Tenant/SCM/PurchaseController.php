<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/Purchases/Index', [
            'purchases' => PurchaseOrder::with(['supplier', 'user', 'items.inventoryItem'])
                ->latest()
                ->paginate(15),
            'stats' => [
                'total_orders' => PurchaseOrder::count(),
                'pending_approval' => PurchaseOrder::where('status', 'pending_approval')->count(),
                'approved' => PurchaseOrder::where('status', 'approved')->count(),
                'total_value' => PurchaseOrder::where('status', '!=', 'cancelled')->sum('total'),
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/Purchases/Create', [
            'suppliers' => Supplier::where('status', 'active')->select('id', 'name')->get(),
            'inventoryItems' => InventoryItem::select('id', 'name', 'sku', 'unit_price')->get(),
            'nextPoNumber' => $this->generatePoNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'po_number' => 'required|string|unique:purchase_orders,po_number',
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'shipping_method' => 'nullable|string|max:255',
            'shipping_address' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.description' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            // Calculate totals
            $subtotal = 0;
            $totalTax = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_rate'] ?? 0) / 100);
                $subtotal += $itemSubtotal;
                $totalTax += $itemTax;
            }

            $total = $subtotal + $totalTax;

            // Create Purchase Order
            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $validated['po_number'],
                'supplier_id' => $validated['supplier_id'],
                'user_id' => Auth::id(),
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'shipping_method' => $validated['shipping_method'],
                'shipping_address' => $validated['shipping_address'],
                'billing_address' => $validated['billing_address'],
                'subtotal' => $subtotal,
                'tax' => $totalTax,
                'total' => $total,
                'notes' => $validated['notes'],
                'terms' => $validated['terms'],
                'status' => 'draft',
            ]);

            // Create Purchase Order Items
            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_rate'] ?? 0) / 100);

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $itemTax,
                    'subtotal' => $itemSubtotal,
                    'description' => $item['description'],
                ]);
            }
        });

        return Redirect::route('scm.purchases.index')->with('status', 'Purchase order created successfully.');
    }

    public function show(PurchaseOrder $purchase)
    {
        $purchase->load(['supplier', 'user', 'approver', 'items.inventoryItem', 'receipts.receiptItems']);

        return Inertia::render('SCM/Purchases/Show', [
            'purchase' => $purchase,
        ]);
    }

    public function edit(PurchaseOrder $purchase)
    {
        // Only allow editing of draft orders
        if ($purchase->status !== 'draft') {
            return Redirect::route('scm.purchases.index')->with('error', 'Only draft orders can be edited.');
        }

        $purchase->load(['items.inventoryItem']);

        return Inertia::render('SCM/Purchases/Edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::where('status', 'active')->select('id', 'name')->get(),
            'inventoryItems' => InventoryItem::select('id', 'name', 'sku', 'unit_price')->get(),
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchase)
    {
        // Only allow updating of draft orders
        if ($purchase->status !== 'draft') {
            return Redirect::route('scm.purchases.index')->with('error', 'Only draft orders can be updated.');
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'shipping_method' => 'nullable|string|max:255',
            'shipping_address' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.description' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $purchase) {
            // Delete existing items
            $purchase->items()->delete();

            // Calculate totals
            $subtotal = 0;
            $totalTax = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_rate'] ?? 0) / 100);
                $subtotal += $itemSubtotal;
                $totalTax += $itemTax;
            }

            $total = $subtotal + $totalTax;

            // Update Purchase Order
            $purchase->update([
                'supplier_id' => $validated['supplier_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'shipping_method' => $validated['shipping_method'],
                'shipping_address' => $validated['shipping_address'],
                'billing_address' => $validated['billing_address'],
                'subtotal' => $subtotal,
                'tax' => $totalTax,
                'total' => $total,
                'notes' => $validated['notes'],
                'terms' => $validated['terms'],
            ]);

            // Create new Purchase Order Items
            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_rate'] ?? 0) / 100);

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchase->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $itemTax,
                    'subtotal' => $itemSubtotal,
                    'description' => $item['description'],
                ]);
            }
        });

        return Redirect::route('scm.purchases.index')->with('status', 'Purchase order updated successfully.');
    }

    public function destroy(PurchaseOrder $purchase)
    {
        // Only allow deletion of draft or cancelled orders
        if (! in_array($purchase->status, ['draft', 'cancelled'])) {
            return Redirect::route('scm.purchases.index')->with('error', 'Only draft or cancelled orders can be deleted.');
        }

        $purchase->delete();

        return Redirect::route('scm.purchases.index')->with('status', 'Purchase order deleted successfully.');
    }

    public function approve(Request $request, PurchaseOrder $purchase)
    {
        if ($purchase->status !== 'pending_approval') {
            return Redirect::back()->with('error', 'Order is not pending approval.');
        }

        $purchase->update([
            'status' => 'approved',
            'approver_id' => Auth::id(),
            'approved_at' => now(),
        ]);

        return Redirect::back()->with('status', 'Purchase order approved successfully.');
    }

    public function submitForApproval(PurchaseOrder $purchase)
    {
        if ($purchase->status !== 'draft') {
            return Redirect::back()->with('error', 'Only draft orders can be submitted for approval.');
        }

        $purchase->update(['status' => 'pending_approval']);

        return Redirect::back()->with('status', 'Purchase order submitted for approval.');
    }

    public function cancel(PurchaseOrder $purchase)
    {
        if (in_array($purchase->status, ['received', 'partially_received'])) {
            return Redirect::back()->with('error', 'Cannot cancel order that has been received.');
        }

        $purchase->update(['status' => 'cancelled']);

        return Redirect::back()->with('status', 'Purchase order cancelled successfully.');
    }

    private function generatePoNumber()
    {
        $lastPo = PurchaseOrder::latest('id')->first();
        $nextNumber = $lastPo ? (int) substr($lastPo->po_number, 3) + 1 : 1;

        return 'PO-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
