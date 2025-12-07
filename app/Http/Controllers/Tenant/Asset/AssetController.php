<?php

namespace App\Http\Controllers\Asset;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetStatus;
use App\Models\HRM\Department;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function index()
    {
        return Inertia::render('Asset/Assets/Index', [
            'assets' => Asset::with(['category', 'status', 'assignedTo', 'location'])
                ->when(request('status_id'), function ($query, $statusId) {
                    $query->where('asset_status_id', $statusId);
                })
                ->when(request('category_id'), function ($query, $categoryId) {
                    $query->where('asset_category_id', $categoryId);
                })
                ->when(request('search'), function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('asset_tag', 'like', "%{$search}%")
                            ->orWhere('serial_number', 'like', "%{$search}%");
                    });
                })
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => request()->only(['status_id', 'category_id', 'search']),
            'categories' => AssetCategory::all(),
            'statuses' => AssetStatus::all(),
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Asset/Assets/Create', [
            'categories' => AssetCategory::all(),
            'statuses' => AssetStatus::all(),
            'locations' => Location::all(),
            'users' => User::all(),
            'departments' => Department::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asset_tag' => 'required|string|max:50|unique:assets,asset_tag',
            'serial_number' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'asset_category_id' => 'required|exists:asset_categories,id',
            'asset_status_id' => 'required|exists:asset_statuses,id',
            'location_id' => 'nullable|exists:locations,id',
            'assigned_to_id' => 'nullable|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric|min:0',
            'warranty_expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'order_number' => 'nullable|string|max:100',
            'expected_lifespan' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:2048',
            'custom_fields' => 'nullable|array',
        ]);

        $validated['created_by_id'] = Auth::id();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('assets', 'public');
            $validated['image'] = $path;
        }

        $asset = Asset::create($validated);

        // Handle asset history creation
        $asset->assetHistories()->create([
            'action' => 'created',
            'notes' => 'Asset created by '.Auth::user()->name,
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('asset.assets.index')->with('status', 'Asset created successfully');
    }

    public function show(Asset $asset)
    {
        return Inertia::render('Asset/Assets/Show', [
            'asset' => $asset->load(['category', 'status', 'assignedTo', 'location', 'department', 'supplier', 'createdBy']),
            'maintenances' => $asset->maintenances()->with('user')->latest()->get(),
            'checkouts' => $asset->checkouts()->with(['checkedOutBy', 'checkedOutTo'])->latest()->get(),
            'histories' => $asset->assetHistories()->with('user')->latest()->get(),
        ]);
    }

    public function edit(Asset $asset)
    {
        return Inertia::render('Asset/Assets/Edit', [
            'asset' => $asset,
            'categories' => AssetCategory::all(),
            'statuses' => AssetStatus::all(),
            'locations' => Location::all(),
            'users' => User::all(),
            'departments' => Department::all(),
        ]);
    }

    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asset_tag' => 'required|string|max:50|unique:assets,asset_tag,'.$asset->id,
            'serial_number' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'asset_category_id' => 'required|exists:asset_categories,id',
            'asset_status_id' => 'required|exists:asset_statuses,id',
            'location_id' => 'nullable|exists:locations,id',
            'assigned_to_id' => 'nullable|exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric|min:0',
            'warranty_expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'order_number' => 'nullable|string|max:100',
            'expected_lifespan' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:2048',
            'custom_fields' => 'nullable|array',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('assets', 'public');
            $validated['image'] = $path;
        }

        // Track status changes
        $oldStatus = $asset->asset_status_id;
        $oldAssignedTo = $asset->assigned_to_id;

        $asset->update($validated);

        // Record history for status change
        if ($oldStatus != $validated['asset_status_id']) {
            $asset->assetHistories()->create([
                'action' => 'status_changed',
                'notes' => 'Status changed from '.AssetStatus::find($oldStatus)->name.' to '.AssetStatus::find($validated['asset_status_id'])->name,
                'user_id' => Auth::id(),
            ]);
        }

        // Record history for assignment change
        if ($oldAssignedTo != $validated['assigned_to_id']) {
            $asset->assetHistories()->create([
                'action' => 'assignment_changed',
                'notes' => $validated['assigned_to_id']
                    ? 'Assigned to '.User::find($validated['assigned_to_id'])->name
                    : 'Unassigned',
                'user_id' => Auth::id(),
            ]);
        }

        return redirect()->route('asset.assets.show', $asset)->with('status', 'Asset updated successfully');
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();

        return redirect()->route('asset.assets.index')->with('status', 'Asset deleted successfully');
    }

    public function checkout(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'checked_out_to_id' => 'required|exists:users,id',
            'expected_checkin_date' => 'nullable|date',
            'checkout_notes' => 'nullable|string',
        ]);

        $asset->checkouts()->create([
            'checked_out_by_id' => Auth::id(),
            'checked_out_to_id' => $validated['checked_out_to_id'],
            'checkout_date' => now(),
            'expected_checkin_date' => $validated['expected_checkin_date'] ?? null,
            'notes' => $validated['checkout_notes'] ?? null,
        ]);

        $asset->update([
            'asset_status_id' => AssetStatus::where('name', 'Checked Out')->first()->id,
            'assigned_to_id' => $validated['checked_out_to_id'],
        ]);

        $asset->assetHistories()->create([
            'action' => 'checked_out',
            'notes' => 'Checked out to '.User::find($validated['checked_out_to_id'])->name,
            'user_id' => Auth::id(),
        ]);

        return back()->with('status', 'Asset checked out successfully');
    }

    public function checkin(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'checkin_notes' => 'nullable|string',
            'asset_status_id' => 'required|exists:asset_statuses,id',
        ]);

        // Update the latest checkout record
        $latestCheckout = $asset->checkouts()->whereNull('checkin_date')->latest()->first();

        if ($latestCheckout) {
            $latestCheckout->update([
                'checkin_date' => now(),
                'checked_in_by_id' => Auth::id(),
                'checkin_notes' => $validated['checkin_notes'] ?? null,
            ]);
        }

        $asset->update([
            'asset_status_id' => $validated['asset_status_id'],
            'assigned_to_id' => null,
        ]);

        $asset->assetHistories()->create([
            'action' => 'checked_in',
            'notes' => 'Checked in by '.Auth::user()->name.($validated['checkin_notes'] ? '. Notes: '.$validated['checkin_notes'] : ''),
            'user_id' => Auth::id(),
        ]);

        return back()->with('status', 'Asset checked in successfully');
    }
}
