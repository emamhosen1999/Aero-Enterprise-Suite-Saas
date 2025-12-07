<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index()
    {
        return Inertia::render('Procurement/Vendors/Index', [
            'vendors' => Supplier::where('type', 'vendor')
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Procurement/Vendors/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'status' => 'required|string|in:active,inactive,blacklisted',
            'notes' => 'nullable|string',
            'vendor_category_id' => 'nullable|exists:vendor_categories,id',
        ]);

        $validated['type'] = 'vendor';

        Supplier::create($validated);

        return redirect()->route('procurement.vendors.index')->with('status', 'Vendor created successfully');
    }

    public function show(Supplier $vendor)
    {
        if ($vendor->type !== 'vendor') {
            abort(404);
        }

        return Inertia::render('Procurement/Vendors/Show', [
            'vendor' => $vendor->load([
                'purchaseOrders' => function ($query) {
                    $query->latest()->limit(5);
                },
            ]),
        ]);
    }

    public function edit(Supplier $vendor)
    {
        if ($vendor->type !== 'vendor') {
            abort(404);
        }

        return Inertia::render('Procurement/Vendors/Edit', [
            'vendor' => $vendor,
        ]);
    }

    public function update(Request $request, Supplier $vendor)
    {
        if ($vendor->type !== 'vendor') {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'tax_id' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'status' => 'required|string|in:active,inactive,blacklisted',
            'notes' => 'nullable|string',
            'vendor_category_id' => 'nullable|exists:vendor_categories,id',
        ]);

        $vendor->update($validated);

        return redirect()->route('procurement.vendors.index')->with('status', 'Vendor updated successfully');
    }

    public function destroy(Supplier $vendor)
    {
        if ($vendor->type !== 'vendor') {
            abort(404);
        }

        if ($vendor->purchaseOrders()->exists()) {
            return redirect()->route('procurement.vendors.index')
                ->with('error', 'Vendor cannot be deleted as it has associated purchase orders');
        }

        $vendor->delete();

        return redirect()->route('procurement.vendors.index')->with('status', 'Vendor deleted successfully');
    }
}
