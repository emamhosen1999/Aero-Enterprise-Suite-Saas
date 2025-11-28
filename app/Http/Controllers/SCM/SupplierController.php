<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\LogisticsShipment;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/Suppliers/Index', [
            'suppliers' => Supplier::query()
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/Suppliers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:active,inactive,pending',
            'category_id' => 'nullable|exists:supplier_categories,id',
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string',
        ]);

        Supplier::create($validated);

        return redirect()->route('scm.suppliers.index')->with('status', 'Supplier created successfully');
    }

    public function show(Supplier $supplier)
    {
        return Inertia::render('SCM/Suppliers/Show', [
            'supplier' => $supplier->load(['category', 'purchaseOrders']),
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('SCM/Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:active,inactive,pending',
            'category_id' => 'nullable|exists:supplier_categories,id',
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string',
        ]);

        $supplier->update($validated);

        return redirect()->route('scm.suppliers.index')->with('status', 'Supplier updated successfully');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()->route('scm.suppliers.index')->with('status', 'Supplier deleted successfully');
    }

    public function dashboard()
    {
        return Inertia::render('SCM/Dashboard', [
            'stats' => [
                // Supplier Stats
                'total_suppliers' => Supplier::count(),
                'active_suppliers' => Supplier::where('status', 'active')->count(),
                'inactive_suppliers' => Supplier::where('status', 'inactive')->count(),

                // Purchase Order Stats
                'total_purchase_orders' => PurchaseOrder::count(),
                'pending_approval' => PurchaseOrder::where('status', 'pending_approval')->count(),
                'approved_orders' => PurchaseOrder::where('status', 'approved')->count(),
                'total_po_value' => PurchaseOrder::where('status', '!=', 'cancelled')->sum('total'),

                // Logistics Stats
                'total_shipments' => LogisticsShipment::count(),
                'in_transit_shipments' => LogisticsShipment::where('status', 'in_transit')->count(),
                'delivered_shipments' => LogisticsShipment::where('status', 'delivered')->count(),
                'pending_shipments' => LogisticsShipment::where('status', 'pending')->count(),
            ],
            'recent_activities' => [
                'recent_purchase_orders' => PurchaseOrder::with(['supplier', 'user'])
                    ->latest()
                    ->take(5)
                    ->get(),
                'recent_shipments' => LogisticsShipment::with(['carrier'])
                    ->latest()
                    ->take(5)
                    ->get(),
                'recent_suppliers' => Supplier::latest()
                    ->take(5)
                    ->get(),
            ],
        ]);
    }
}
