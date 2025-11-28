<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\RFQ;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RFQController extends Controller
{
    public function index()
    {
        return Inertia::render('Procurement/RFQ/Index', [
            'rfqs' => RFQ::with(['suppliers', 'creator'])
                ->latest()
                ->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Procurement/RFQ/Create', [
            'suppliers' => Supplier::where('status', 'active')
                ->where('type', 'vendor')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'required|date|after:today',
            'status' => 'required|string|in:draft,published,closed,awarded,cancelled',
            'supplier_ids' => 'required|array|min:1',
            'supplier_ids.*' => 'exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'nullable|string|max:50',
            'specifications' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $rfq = RFQ::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'deadline' => $validated['deadline'],
                'status' => $validated['status'],
                'specifications' => $validated['specifications'],
                'terms_conditions' => $validated['terms_conditions'],
                'created_by' => Auth::id(),
            ]);

            $rfq->suppliers()->attach($validated['supplier_ids']);

            foreach ($request->items as $item) {
                $rfq->items()->create([
                    'name' => $item['name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'] ?? null,
                ]);
            }
        });

        return redirect()->route('procurement.rfq.index')->with('status', 'RFQ created successfully');
    }

    public function show(RFQ $rfq)
    {
        return Inertia::render('Procurement/RFQ/Show', [
            'rfq' => $rfq->load(['suppliers', 'items', 'quotes.supplier', 'creator']),
        ]);
    }

    public function edit(RFQ $rfq)
    {
        if ($rfq->status !== 'draft') {
            return redirect()->route('procurement.rfq.index')
                ->with('error', 'Only draft RFQs can be edited');
        }

        return Inertia::render('Procurement/RFQ/Edit', [
            'rfq' => $rfq->load(['suppliers', 'items']),
            'suppliers' => Supplier::where('status', 'active')
                ->where('type', 'vendor')
                ->get(),
        ]);
    }

    public function update(Request $request, RFQ $rfq)
    {
        if ($rfq->status !== 'draft') {
            return redirect()->route('procurement.rfq.index')
                ->with('error', 'Only draft RFQs can be edited');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'required|date|after:today',
            'status' => 'required|string|in:draft,published,closed,awarded,cancelled',
            'supplier_ids' => 'required|array|min:1',
            'supplier_ids.*' => 'exists:suppliers,id',
            'specifications' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $rfq) {
            $rfq->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'deadline' => $validated['deadline'],
                'status' => $validated['status'],
                'specifications' => $validated['specifications'],
                'terms_conditions' => $validated['terms_conditions'],
            ]);

            $rfq->suppliers()->sync($validated['supplier_ids']);
        });

        return redirect()->route('procurement.rfq.index')->with('status', 'RFQ updated successfully');
    }

    public function destroy(RFQ $rfq)
    {
        if ($rfq->status !== 'draft' && $rfq->status !== 'cancelled') {
            return redirect()->route('procurement.rfq.index')
                ->with('error', 'Only draft or cancelled RFQs can be deleted');
        }

        $rfq->delete();

        return redirect()->route('procurement.rfq.index')->with('status', 'RFQ deleted successfully');
    }

    public function publish(RFQ $rfq)
    {
        if ($rfq->status !== 'draft') {
            return redirect()->route('procurement.rfq.index')
                ->with('error', 'Only draft RFQs can be published');
        }

        $rfq->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        // TODO: Send email notifications to suppliers

        return redirect()->route('procurement.rfq.index')->with('status', 'RFQ published successfully');
    }

    public function close(RFQ $rfq)
    {
        if ($rfq->status !== 'published') {
            return redirect()->route('procurement.rfq.index')
                ->with('error', 'Only published RFQs can be closed');
        }

        $rfq->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return redirect()->route('procurement.rfq.index')->with('status', 'RFQ closed successfully');
    }
}
